# DevForge: Live Multi-Registry Package Explorer & AI Assistant

DevForge is a developer tooling suite that bridges the gap between codebase package dependencies, live registry analytics, and context-aware AI recommendations. 

---

## ⚡ The Problems DevForge Solves

### 1. Inefficient Package Research
* **The Problem**: Developers waste hours switching between browser tabs (npm, PyPI, crates.io, NuGet, pub.dev, Maven Central) to search for libraries, check their popularity, evaluate licenses, and find documentation.
* **The Solution**: DevForge aggregates search results and live telemetry from **8 major package registries** into a single unified dashboard directly inside the VS Code editor.

### 2. Context-Blind AI Suggestions
* **The Problem**: General AI chatbots don't know what tech stack, dependencies, or versions a developer's local project is currently using. Developers are forced to copy-paste their configurations, which is tedious and security-risky.
* **The Solution**: DevForge automatically scans the active workspace, extracts a precise JSON repository schema, and injects this state into the AI Chat Box. The AI has immediate context of your exact project structure.

### 3. Webview CORS & CSP Sandboxing
* **The Problem**: VS Code Webviews are highly sandboxed. Direct network fetches to third-party registry APIs violate Content Security Policies (CSP) and trigger CORS blocks inside the editor.
* **The Solution**: DevForge routes all live API registry queries securely through the **VS Code Extension Host (Node.js)** process using message passing (`postMessage`), safely bypassing browser sandboxing.

### 4. API Rate-Limiting during Bulk Lookups
* **The Problem**: Scanning directories and querying API details (like GitHub stars, forks, and licenses) for hundreds of libraries quickly exhausts API rate limits.
* **The Solution**: DevForge uses a **persistent disk-cache layer** (10-minute search cache, 4-hour details cache) and **lazy-loads** deep telemetry metrics *only* when a package card is expanded in the UI.

### 5. Multi-Language Syntax Overhead
* **The Problem**: Developers working in polyglot environments have to recall the exact installer syntax for different package managers (e.g. `npm install`, `poetry add`, `cargo add`, `composer require`, `dotnet add package`).
* **The Solution**: DevForge auto-detects the library's ecosystem and displays the **exact copyable installation command**, automatically determining specialized criteria like Flutter vs. Dart configurations.

### 6. Isolation of External AI Agents from Local Workspace
* **The Problem**: Modern AI-agent interfaces (like Cursor or Claude Desktop) cannot natively read local file layouts or perform structural dependency analysis.
* **The Solution**: DevForge integrates a **Model Context Protocol (MCP) server** over stdio, allowing external agents to query workspace frameworks and generate tailored code suggestions.

---

## 📦 Supported Package Registries & Global AI Knowledge

* **Global AI Recommendations**: Powered by advanced LLMs (such as Google Gemma), the DevForge AI Assistant is not constrained to local indexes and can provide detailed analysis, security audits, and code examples for **any library available on the internet**.
* **Native Telemetry Integrations**: To assist with live verification and package management, DevForge directly queries and displays real-time telemetry (downloads, stars, updates, licenses, and copyable installation commands) for the 8 most widely-used package registries:
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
