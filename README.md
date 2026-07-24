# 🛠️ DevForge: Project-Aware AI Library Explorer for VS Code

**Discover libraries. Understand your dependencies. Find what fits your project.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)](https://fastapi.tiangolo.com/)
[![Protocol: MCP](https://img.shields.io/badge/Protocol-MCP-orange.svg)](https://modelcontextprotocol.io/)

DevForge is a VS Code extension that helps developers discover, compare, and manage software libraries without leaving their development workflow.

It combines project-aware AI assistance with package data from major registries. DevForge can understand the dependencies already used in a project and help developers find libraries that better fit what they are building.

---

## 🎬 Demo

<!-- Add GIF or screenshot here -->

### Library Explorer
Browse libraries by area and category, search across supported ecosystems, and inspect package information.

### Project View
See installed dependencies, identify deprecated packages, and discover relevant suggestions for the current project.

### AI Assistant
Describe what you want to build and get project-aware library suggestions.

---

## ⚡ Real-World Problems DevForge Solves

| Developer Pain Point                                  | DevForge Solution                                                                                                                                 | Technical Mechanism                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Library Overload**                                  | Helps developers discover the right tools from a huge software ecosystem, organized by what they want to build.                                   | Categorized library explorer + search across major development areas.                                         |
| **Fragmented Package Discovery**                      | Lets developers search and explore packages from 8 major package ecosystems in one VS Code experience.                                             | Unified registry adapters for npm, PyPI, crates.io, NuGet, Maven Central, RubyGems, Packagist, and pub.dev.   |
| **Context-Blind Recommendations**                     | Uses available project and dependency context to make library suggestions more relevant.                                                          | Workspace scanning + project metadata + AI-assisted reasoning.                                                |
| **“What Library Should I Use?”**                      | Developers describe a feature such as *“I need interactive 3D”* and receive relevant options instead of manually researching dozens of libraries. | Gemma interprets developer intent and reasons over project context and candidate technologies.                |
| **Outdated & Deprecated Dependencies**                | Surfaces dependency health and warns about deprecated or archived libraries where reliable metadata is available.                                 | Dependency scanning + registry/repository metadata + replacement suggestions where known.                     |
| **Discovery → Decision → Installation Is Fragmented** | Lets developers discover, understand, choose, install, and manage libraries without leaving their development workflow.                           | VS Code extension integrating the library explorer, PROJECT view, AI assistance, and package-manager actions. |

---

## 🔍 How It Works

DevForge has two main views:

### ALL — Discover
Browse libraries across development areas such as Frontend, Backend, Databases, AI/ML, Testing, DevOps, Mobile, and Developer Tools.

Each library can show:
* A short description
* Package ecosystem
* Current version where available
* Maintenance or deprecation status
* Whether it is already installed
* An option to install it when supported

### PROJECT — Understand Your Stack
DevForge scans the current workspace to understand the project's dependencies.

The PROJECT view can show:
* Installed libraries
* Dependency descriptions
* Maintenance/deprecation information
* Suggested libraries
* Install and remove actions

### ASK AI — Find What Fits
If you do not know which library to choose, describe what you want to build.
> "I need an interactive 3D product viewer for my React app."

DevForge combines the request with available project context to help identify and explain relevant options.

---

## 📦 AI-Assisted Discovery & Live Package Data

DevForge combines two complementary layers:

### 1. AI-Assisted Discovery
Gemma helps developers discover and compare libraries based on what they want to build and the context of their current project.

The AI layer is not limited to the eight directly integrated registries. It can suggest and explain technologies from the broader software ecosystem based on its model knowledge.

### 2. Live Package Data
For current package information, DevForge integrates directly with eight major package ecosystems:
* npm
* PyPI
* crates.io
* NuGet
* Maven Central
* RubyGems
* Packagist
* pub.dev

These integrations provide structured metadata such as versions, descriptions, releases, licenses, and deprecation information where available.

> **Registries provide current package facts. AI helps developers decide what may fit their project.**

---

## 💡 What Makes DevForge Different?

DevForge is not another package manager.

Package managers such as npm, pip, and Cargo are designed to answer:
> "How do I install this package?"

Package registries help answer:
> "What packages are available?"

AI assistants can help answer:
> "What technologies might solve this problem?"

DevForge connects these workflows:
> **"Given what I want to build and what my project already uses, what libraries should I consider, why, and how can I add them?"**

The goal is to bring library discovery, project context, package information, and AI-assisted decision-making into one development workflow.

---

## 🏗️ Architecture & Communication Flow

DevForge uses a VS Code Webview architecture where the UI communicates with the Extension Host through VS Code's messaging API.

The Extension Host handles operations that require workspace access, registry requests, package management, or communication with the local backend.

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
Run the FastAPI backend server:
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Configure Extension Host
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

### 4. Running the DevForge Extension
1. Open the project root folder in VS Code.
2. Press `F5` (or execute the **Launch Extension** action under VS Code's **Run and Debug** side panel).
3. A new *Extension Development Host* window will open with the DevForge panel active.

---

## 🤖 Model Context Protocol (MCP) Integration

The MCP integration allows external LLM agents to interact directly with your workspace diagnostics over standard I/O (`stdio`).

### Running the MCP Server
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
│   │   └── full_library_catalog.ts# Curated library catalog
│   ├── package.json               # Frontend dependencies configuration
│   └── vite.config.ts             # Vite compiler config
│
├── package.json                   # Root VS Code Extension configuration
├── tsconfig.json                  # Extension TypeScript configuration
└── WORK_LOG.md                    # Historical record of developmental phases
```

---

## 🗺️ Roadmap

- [x] VS Code Webview interface
- [x] Multi-registry package search
- [x] Project dependency scanning
- [x] AI-assisted project questions
- [x] MCP integration
- [ ] Expanded library metadata and health signals
- [ ] Deeper compatibility analysis
- [ ] Library comparison view
- [ ] Dependency migration assistance
- [ ] Automated architecture recommendations

---

## ⚠️ Current Limitations

* Registry metadata differs between ecosystems, so not every package exposes the same fields.
* AI-generated recommendations may require verification before production use.
* Live package metadata is available only through supported registry/data integrations.
* Installation and removal behavior depends on the detected package ecosystem and project configuration.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
