# DevForge AI: Model Context Protocol (MCP) Integration

This document outlines the architecture, usage, and startup procedures for the Model Context Protocol (MCP) layer of DevForge AI. 

The MCP layer allows compatible LLM-powered clients (such as Claude Desktop, Cursor, or the official MCP Inspector) to programmatically interact with DevForge AI's repository scanning and AI analysis capabilities.

---

## 1. How It Works (Architecture)

The MCP Server is implemented as a **Thin Adapter** using the official `FastMCP` SDK. 

### Core Tenets:
1. **No Business Logic**: The MCP layer itself does not perform any file parsing, LLM inference, or caching. It is strictly an interface.
2. **Direct Service Delegation**: It bypasses the FastAPI HTTP routes and communicates directly with the underlying `services/` layer (e.g., `ScanService` and `AIService`).
3. **Model Re-use**: The MCP server natively returns standard Pydantic models from `backend/schemas/models.py`. The `FastMCP` SDK automatically translates these into well-typed JSON Schemas for connected MCP clients.
4. **Graceful Error Handling**: Internal exceptions (like parsing errors or invalid LLM configurations) are caught and surfaced to the client as clean MCP `ToolError` JSONRPC payloads, guaranteeing that sensitive Python stack traces are never exposed.

### Architectural Flow:
```text
[ MCP Client ]  (Claude Desktop, Cursor, etc.)
      │
 (JSONRPC over Stdio)
      │
      ▼
[ FastMCP Server ] (backend/mcp/server.py)
      │
      ├─► [ Tool: scan_repository ] ──► [ ScanService ] ──► (Local File System / Cache)
      │
      └─► [ Tool: ask_devforge ] ─────► [ AIService ] ────► (LLM Provider / Prompts)
```

---

## 2. Startup Guide

The MCP server operates over standard input/output (`stdio`). It requires a valid Python environment and environment variables.

### Prerequisites

1. Ensure the Python virtual environment is initialized and dependencies are installed:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   pip install fastmcp
   ```

2. Create a `.env` file in the `backend/` directory (or ensure the variables are available in the client's execution environment):
   ```dotenv
   # Example .env configuration
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_api_key_here
   ```

### Execution

The MCP server must be executed from the **Project Root** (one level above `backend/`) as a native Python module.

**Command:**
```bash
export WORKSPACE_ROOT=/absolute/path/to/your/workspaces
python -m backend.mcp.server
```

**Startup Validation:**
When the server boots, it performs strict validation:
- `WORKSPACE_ROOT` must be explicitly defined and point to a valid directory. The server will reject any attempts to scan repositories outside this boundary.
- If `LLM_PROVIDER` is set to `gemini`, `GEMINI_API_KEY` must be present.
If any check fails, the server will log an error to `stderr` and immediately exit with code `1`.

---

## 3. User Flow

Once an MCP Client is connected to the DevForge server, the interaction follows a strict two-step pipeline.

### Step 1: Repository Discovery (`scan_repository`)
Before the AI can answer questions about a codebase, it needs metadata. The client must first execute the `scan_repository` tool.
- **Input**: `repository_path` (Absolute path to the target folder, e.g., `/home/user/my-project`).
- **Execution**: The server validates the path against the `WORKSPACE_ROOT` security boundary. It then recursively scans for `package.json`, `requirements.txt`, etc.
- **Output**: Returns a `RepositorySummary` JSON object containing the tech stack, frameworks, languages, and dependencies.

### Step 2: AI Interaction (`ask_devforge`)
Once scanned (and cached), the client can query the AI about the codebase using the `ask_devforge` tool.
- **Inputs**:
  - `repository_path`: The exact same path previously scanned.
  - `mode`: The intent of the query. Must be one of `recommend`, `review`, `bug`, `architecture`, `compare`, `security`, `summary`, or `chat`.
  - `query`: The user's specific question (e.g., "What auth library should I use here?").
- **Execution**: The `AIService` injects the previously generated `RepositorySummary` into specialized LLM prompts and streams it to the configured provider (e.g., Gemini).
- **Output**: Returns a highly structured JSON response (e.g., `RecommendationData`) containing the AI's answer natively formatted for the client UI.

---

## 4. Configuring MCP Clients

To connect a popular client to DevForge AI, provide the startup command in their respective configuration files.

### Claude Desktop (macOS/Windows)
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "devforge-ai": {
      "command": "/absolute/path/to/devforge-ai/backend/.venv/bin/python",
      "args": ["-m", "backend.mcp.server"],
      "env": {
        "WORKSPACE_ROOT": "/absolute/path/to/your/workspaces",
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Cursor IDE
In Cursor settings -> Models -> MCP:
- **Type**: `command`
- **Name**: `DevForge`
- **Command**: `WORKSPACE_ROOT=/your/path/ ... /backend/.venv/bin/python -m backend.mcp.server`

---

## 5. Development and Testing

The MCP integration features a fully native Pytest suite covering all integration scenarios, boundary checks, and error encapsulations.

To run the tests from the project root:
```bash
source backend/.venv/bin/activate
export WORKSPACE_ROOT=/absolute/path/to/your/workspaces
python -m pytest tests/test_mcp.py
```
*(No `sys.path` hacks are required; the suite resolves standard module imports seamlessly).*
