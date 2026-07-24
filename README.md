
# 🛠️ DevForge: AI-Powered Multi-Registry Package Explorer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)](https://fastapi.tiangolo.com/)
[![Protocol: MCP](https://img.shields.io/badge/Protocol-MCP-orange.svg)](https://modelcontextprotocol.io/)

DevForge is an intelligent, context-aware package explorer and architecture assistant built directly into your IDE. It bridges the gap between codebase dependency management, real-time registry telemetry, and global AI knowledge.

---

## ⚡ Real-World Problems DevForge Solves

| Developer Pain Point                                  | DevForge Solution                                                                                                                                 | Technical Mechanism                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Library Overload**                                  | Helps developers discover the right tools from a huge software ecosystem, organized by what they want to build.                                   | Categorized library explorer + search across major development areas.                                         |
| **Fragmented Package Discovery**                      | Brings **8 major package ecosystems** into one VS Code experience.                                                                                | Unified registry adapters for npm, PyPI, crates.io, NuGet, Maven Central, RubyGems, Packagist, and pub.dev.   |
| **Context-Blind Recommendations**                     | Recommends libraries with awareness of the developer’s existing project and dependencies.                                                         | Workspace scanning + project metadata + AI-assisted reasoning.                                                |
| **“What Library Should I Use?”**                      | Developers describe a feature such as *“I need interactive 3D”* and receive relevant options instead of manually researching dozens of libraries. | Gemma interprets developer intent and reasons over project context and candidate technologies.                |
| **Outdated & Deprecated Dependencies**                | Surfaces dependency health and warns about deprecated or archived libraries where reliable metadata is available.                                 | Dependency scanning + registry/repository metadata + replacement suggestions where known.                     |
| **Discovery → Decision → Installation Is Fragmented** | Lets developers discover, understand, choose, install, and manage libraries without leaving their development workflow.                           | VS Code extension integrating the library explorer, PROJECT view, AI assistance, and package-manager actions. |

---

## 📦 Global AI Knowledge & Live Telemetry

DevForge operates on two key intellectual layers:

1. **Global AI Recommendations**: Powered by Google Gemma and Gemini models, the assistant holds knowledge of **any software library available on the internet**—not just those indexed locally. It acts as an open-ended advisor on architecture, security, and refactoring.
2. **Native Telemetry Adapters**: For the most widely-used package registries, DevForge queries live APIs to serve up-to-date versions, downloads, stars, licenses, and installers:
   * **npm** (Node.js/Frontend)
   * **PyPI** (Python)
   * **crates.io** (Rust/Cargo)
   * **NuGet** (.NET/C#)
   * **Maven Central** (Java/JVM)
   * **RubyGems** (Ruby)
   * **Packagist** (PHP/Composer)
   * **pub.dev** (Flutter/Dart)

---

## 🏗️ Architecture & Communication Flow

DevForge uses a **Hybrid Extension Bridge** architecture to circumvent browser security constraints while maintaining clean interface boundaries.

```text
               +-------------------------------------------------+
               |                   Webview UI                    |
               |                (Vite + React)                   |
               +-----------------------+-------------------------+
                                       |
                               (postMessage IPC)
                                       |
                                       ▼
               +-------------------------------------------------+
               |              VS Code Extension Host             |
               |                (TypeScript Node)                |
               +----------+--------------------------+-----------+
                          |                          |
                     (HTTPS API)              (localhost HTTP)
                          |                          |
                          ▼                          ▼
               +--------------------+      +--------------------+
               |   Package APIs     |      |  FastAPI Backend   |
               | (npm, PyPI, etc.)  |      |   (Python LLM)     |
               +--------------------+      +----------+---------+
                                                      |
                                                  (Gemini)
                                                      |
                                                      ▼
                                           +--------------------+
                                           |  Google AI Studio  |
                                           +--------------------+
```

---

## 📂 Codebase Directory Map

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

## ⚙️ Configuration & Environment Setup

Create a `.env` file inside the `backend/` directory with the following variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | LLM API provider model configuration | `google_ai_studio` |
| `GEMINI_API_KEY` | Your Gemini Studio API key | `AIzaSy...` |
| `WORKSPACE_ROOT` | Security boundary; limits repository scans | `/home/user/projects` |
| `REQUEST_TIMEOUT` | Timeout limit in seconds for LLM queries | `90` |
| `MAX_TOKENS` | Token generation boundary for prompts | `2000` |

---

## 🚀 Installation & Running Guide

### 1. Initialize Python Backend
Navigate to the `backend/` directory and configure the virtual environment:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Run the development FastAPI server:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Configure extension host
Navigate back to the project root, install packages, and compile:
```bash
npm install
npx tsc -b
```

### 3. Build Webview React Assets
Navigate to the Webview directory, install dependencies, and run Vite compilation:
```bash
cd webview-ui
npm install
npm run build
```

### 4. Running DevForge Extension
1. Open the project root folder in VS Code.
2. Press `F5` (or execute the **Launch Extension** action under VS Code's **Run and Debug** side panel).
3. A new *Extension Development Host* window will open with the DevForge panel active.

---

## 🤖 Model Context Protocol (MCP) Integration

The MCP integration allows external LLM agents to interact directly with your workspace diagnostics over standard I/O (`stdio`).

### Running the MCP server
Ensure the Python virtual environment is activated, then execute this command from the **Project Root**:
```bash
export WORKSPACE_ROOT=/absolute/path/to/workspaces
python -m backend.mcp.server
```

### Registered Tools
* **`scan_repository(repository_path: str)`**: Crawls the codebase to identify files, active dependencies, and languages.
* **`ask_devforge(repository_path: str, mode: str, query: str)`**: Ask AI assistant questions with context of the scanned metadata.

---

## 🧪 Testing and Verification

### Backend Tests
Execute Python tests using `pytest`:
```bash
source backend/.venv/bin/activate
export WORKSPACE_ROOT=/absolute/path/to/workspaces
python -m pytest backend/tests/
```

### Registry Telemetry Tests
Verify live adapters can query package registries successfully:
```bash
npx ts-node src/test-registries.ts
```

### Static Catalog Audit
Verify the integrity of local package configurations:
```bash
npx ts-node src/validate-catalog.ts
```
Results are exported directly to `validation_report.json`.