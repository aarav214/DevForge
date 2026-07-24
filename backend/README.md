# DevForge AI - Backend

The DevForge AI backend is a fast, reliable, and decoupled API built with **FastAPI**. It serves as the brain between the VS Code Extension and the Gemma LLM (running on Kaggle/local).

## What it can do so far
1. **Repository Parsing:** Rapidly scans a local directory, detects frameworks, package managers, and key dependencies.
2. **Context Caching:** Hashes the repository manifests to cache the project summary, drastically reducing scan times for subsequent requests.
3. **Structured Prompts:** Converts user intents (`recommend`, `bug`, `architecture`) into highly tailored system prompts injected with the repository context.
4. **Guardrails:** Prevents off-topic inputs (e.g., questions about politics or general history) from hitting the LLM.
5. **Resilient LLM Client:** Handles network flakiness with exponential backoff and returns strict JSON structures that easily bridge to the frontend.
6. **Mock Mode:** Can run entirely offline using a mocked LLM response for rapid UI/UX development.

## User Flow
1. **Developer opens a project in VS Code.**
2. **VS Code Extension** sends a `POST /scan` request with the workspace path.
3. **Backend** parses the local files, builds a `RepositorySummary`, stores it in cache, and returns it.
4. **Developer types a query** (e.g., "I need a fast python web framework").
5. **VS Code Extension** sends a `POST /ask` with `mode: recommend` and the `repository_path`.
6. **Backend Guardrails** validate the query.
7. **PromptBuilder** injects the query and the cached context into a prompt.
8. **GemmaClient** sends the prompt to the LLM (Kaggle).
9. **Cleaner** validates that the LLM returned correct JSON.
10. **Backend** returns the structured JSON to the extension.
11. **Extension** renders the beautiful UI.

## How to Start the Backend

1. **Set up a Virtual Environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables:**
   ```bash
   export WORKSPACE_ROOT="/path/to/your/projects"
   export LLM_PROVIDER="mock"  # or "kaggle"
   export GEMMA_ENDPOINT="https://your-kaggle-url"
   ```

4. **Run the Server:**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

## How to Test

You can test the backend locally using `curl`:

**1. Scan a repository:**
```bash
curl -X POST "http://127.0.0.1:8000/scan" \
     -H "Content-Type: application/json" \
     -d '{"repository_path": "/path/to/valid/local/repo"}'
```

**2. Ask a question (Ensure you scanned first to populate cache):**
```bash
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{"mode": "recommend", "query": "I need auth for my project.", "repository_path": "/path/to/valid/local/repo"}'
```
