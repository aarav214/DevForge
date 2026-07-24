# DevForge: Live Multi-Registry Package Explorer & AI Assistant

DevForge is a next-generation developer tooling suite that brings live package registry telemetry, structural repository analysis, and context-aware AI suggestions directly into the developer workflow. 

It is structured as a **hybrid VS Code Extension** containing a React-based Webview UI, a local Python FastAPI backend for advanced LLM orchestration, and a native Model Context Protocol (MCP) server for integration with modern AI-agent clients (like Cursor or Claude Desktop).

---

## 💡 Why DevForge?

### The Problem
1. **Outdated Curated Lists**: Static package suggestion sheets become obsolete quickly as versions change, licenses deprecate, or new packages gain traction.
2. **CORS & CSP Restrictions**: Fetching live telemetry directly from 3rd party APIs inside browser frames (like VS Code Webviews) violates Content Security Policies and causes CORS failures.
3. **Rate Limits & Telemetry Bloat**: Querying live endpoints during bulk project scans can trigger severe API rate limits, while loading raw telemetry strains frontend rendering.
4. **Agent-Editor Separation**: Editor-specific diagnostics and package structures are typically isolated from external AI coding agents.

### The Solution
* **Multi-Registry Adapters**: DevForge aggregates search results from 8 package registries in real-time.
* **Extension Bridge Routing**: Bypasses browser CORS constraints by routing API requests through the VS Code Extension Host (Node.js) using message passing.
* **Persistent Cache & Lazy Loading**: Uses a disk-backed service to cache queries (10-min TTL) and lazy-loads telemetry details (forks, downloads, stars) *only* when a package card is expanded.
* **Model Context Protocol (MCP)**: Exposes a standardized stdio interface letting external agents query and scan repositories within the editor's workspace boundary.

---

## 📦 Supported Package Registries

DevForge dynamically fetches, displays, and generates copyable installation commands for:
* **npm** (Node.js)
* **PyPI** (Python)
* **crates.io** (Rust/Cargo)
* **NuGet** (.NET)
* **Maven Central** (Java)
* **RubyGems** (Ruby)
* **Packagist** (PHP/Composer)
* **pub.dev** (Flutter/Dart)

---

## 📂 Project File Structure

```text
DevForge/
├── backend/                       # Python Backend Service & MCP Layer
│   ├── api/                       # FastAPI HTTP router & endpoints
│   ├── core/                      # Guardrails, logging, exceptions, and caching
│   ├── llm/                       # Clients for Gemini and Gemma models
│   ├── mcp/                       # FastMCP protocol adapter & tools definitions
│   ├── schemas/                   # Pydantic schemas for structured JSON outputs
│   ├── services/                  # Business logic (AIService, ScanService)
│   ├── tests/                     # Integration tests for backend & MCP
│   ├── main.py                    # FastAPI server entrypoint
│   └── requirements.txt           # Python backend dependencies
│
├── src/                           # VS Code Extension Host (TypeScript)
│   ├── lib/
│   │   └── registries/            # Live registry adapters (npm, PyPI, etc.)
│   ├── extension.ts               # Main extension entrypoint & bridge router
│   ├── test-registries.ts         # Live adapters validation script
│   └── validate-catalog.ts        # Database verification runner
│
├── webview-ui/                    # React Webview Panel (Vite + TS)
│   ├── dist/                      # Compiled production assets
│   ├── src/
│   │   ├── components/            # UI components (LibraryCard, AI Chat Box)
│   │   ├── services/              # vscode.ts IPC messaging wrapper
│   │   ├── App.tsx                # Main search & explorer interface
│   │   └── full_library_catalog.ts# Restored 1,240 library catalog index
│   ├── package.json               # Frontend dependencies configuration
│   └── vite.config.ts             # Vite compiler config
│
├── package.json                   # Root VS Code Extension configuration
├── tsconfig.json                  # Extension TypeScript configuration
└── WORK_LOG.md                    # Historical record of developmental phases
```

---

## 🛠️ Getting Started

### 1. Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Initialize the Python environment and install dependencies:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Configure your environment keys in a `.env` file inside `backend/`:
   ```dotenv
   LLM_PROVIDER=google_ai_studio
   GEMINI_API_KEY=your_gemini_api_key_here
   WORKSPACE_ROOT=/absolute/path/to/your/workspaces
   ```
4. Run the Uvicorn development server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

### 2. VS Code Extension & Frontend Setup
1. In the project root, install packages and compile the extension code:
   ```bash
   npm install
   npx tsc -b
   ```
2. Set up and build the Webview React application:
   ```bash
   cd webview-ui
   npm install
   npm run build
   ```
3. Launch the Extension inside VS Code:
   * Open the project root folder in VS Code.
   * Press `F5` (or go to **Run and Debug** -> **Launch Extension**). This spins up a new *Extension Development Host* window where you can trigger the DevForge commands.

---

## 🤖 Model Context Protocol (MCP) Interface

The MCP Server lets LLM clients (like Claude Desktop or Cursor) analyze your workspace codebases programmatically.

### Running the MCP Server
Verify you have the virtual environment activated, then start the server from the **Project Root**:
```bash
export WORKSPACE_ROOT=/absolute/path/to/workspaces
python -m backend.mcp.server
```

### Supported Tools
* **`scan_repository`**: Discovers the tech stack and dependencies of a project.
* **`ask_devforge`**: Queries the AI assistant for library suggestions or refactoring scoped to the repository context.

---

## 🧪 Testing and Verification

### Backend & MCP Unit Tests
Run the Python test suite:
```bash
source backend/.venv/bin/activate
export WORKSPACE_ROOT=/absolute/path/to/workspaces
python -m pytest backend/tests/
```

### Package Adapters Live Tests
Executes test queries against the real registry endpoints for all 8 package ecosystems:
```bash
npx ts-node src/test-registries.ts
```

### Static Catalog Database Auditor
Verifies the integrity of local catalog entries:
```bash
npx ts-node src/validate-catalog.ts
```
Outputs validation reports to `validation_report.json`.
