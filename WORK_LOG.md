# DevForge AI - Work Log

*This log documents the progress made by the AI engineering agent during the Hackathon MVP phase.*

## Completed Work

### Phase 1: Restructuring & Modularization (Approx. 2 Hours)
- **Goal:** Move away from a single bloated script into a production-ready FastApi architecture.
- **Actions:**
  - Created modular directories (`api/`, `core/`, `llm/`, `schemas/`, `services/`).
  - Separated concerns: `main.py` (entry point), `routes.py` (endpoints), `ai_service.py` (orchestration).
  - Preserved the existing `parser.py` logic but integrated it into the new flow.
  - Implemented strictly typed Pydantic models in `schemas/models.py`.

### Phase 2: Pipeline Engineering (Approx. 1.5 Hours)
- **Goal:** Build the strict AI pipeline: Parser -> Cache -> Guardrails -> Prompts -> LLM -> Cleaner.
- **Actions:**
  - Implemented `repo_cache.py` to prevent redundant filesystem scans.
  - Built `guardrails.py` to reject non-software questions using regex word boundaries.
  - Designed `prompts.py` to inject repository context dynamically into Gemma prompts.
  - Wrote `cleaner.py` to aggressively extract and validate JSON from conversational LLM output.
  - Created a robust `GemmaClient` with a fallback `mock` mode to allow UI development without burning GPU hours.

### Phase 3: Final Stabilization & Audit (Approx. 1 Hour)
- **Goal:** Ensure the backend never crashes during the live hackathon demo.
- **Actions:**
  - Conducted a full static audit of the backend.
  - **Security:** Prevented Local File Inclusion (LFI) / path traversal by strictly validating endpoints against `WORKSPACE_ROOT`.
  - **Cache Invalidation:** Improved caching by hashing the modification times of specific package manifests rather than just the root directory.
  - **HTTP Reliability:** Replaced naive requests with `requests.Session()` connection pooling, and added automatic retries (with exponential backoff) for transient HTTP 502/503/504 errors.
  - **Error Normalization:** Implemented global exception handlers so the frontend *always* receives a clean `{ "success": false, "error": {...} }` object.
  - **Verification:** Built `test_e2e.py` to script out valid scans, empty repos, path traversals, valid code questions, and guardrail triggers. All tests passed.

---

## What is Missing / Next Priorities

**1. Gemma Kaggle Integration**
- The backend currently defaults to `LLM_PROVIDER="mock"`.
- We need to stand up the Gemma model on Kaggle, expose an endpoint (via ngrok/localtunnel), set the `GEMMA_ENDPOINT` environment variable, and verify the model follows our JSON prompt structure accurately.

**2. VS Code Extension (Frontend)**
- The React Webview UI is not built.
- The extension needs to send the current workspace path to `POST /scan` on activation.
- The extension needs to render the interactive dependency graph and chat UI.

**3. Demo Polish & End-to-End Rehearsal**
- Test the integration on 10-20 varied open-source repositories to ensure the parser and prompts scale well with real-world noise.
- Record the final demo video.
