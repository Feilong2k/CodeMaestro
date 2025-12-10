# Orion Chat Tools Stabilization & Observability Plan (Future Work)

Status: Proposed (Backlog)
Owner: Adam (Architect)
Scope: Backend (Node/Express), OrionAgent, Tools, Tests, System Log

## 1) Overview
Now that Orion's local router commands (list docs, read Docs/<file>, git status) are working reliably, this plan hardens the feature set for long‑term stability, observability, and testability. It focuses on preventing regressions, improving developer ergonomics, and making runtime behavior predictable and easy to debug on Windows.

## 2) Goals
- Make chat commands resilient to DB hiccups and never hang the request.
- Ensure Windows‑safe path handling for read/list across slash/backslash/colon forms.
- Provide consistent, actionable System Log visibility (intent and completion, plus optional thoughts).
- Lock behavior with unit/integration tests.

## 3) Non‑Goals
- No new feature tools beyond minor UX polish for the local router.
- No production DB schema changes unless the optional “thought persistence” is explicitly prioritized.

## 4) Proposed Changes

### A. Tests and Regression Safety
- Unit tests (FileSystemTool)
  - Validate absolute path resolution against GLOBAL_ROOT on Windows.
  - Verify safeRead/safeList use resolved absolute paths (CWD independent).
- Integration tests (Express API)
  - POST /api/agents/orion/chat
    - list docs, list docs/<folder>, read Docs/<file>
    - Backslash and colon tolerant forms (e.g., `read Docs:\Phase5_Plan.md`).
    - DB up vs DB down (mock or connection disabled) — chat still responds; history writes are non‑blocking.
- Contract tests (System Log)
  - Verify agent_action chips: executing_function → function_result present for local actions.
  - When ORION_VERBOSE_THOUGHTS=true, verify thought entries for OBSERVE/THINK/ACT/VERIFY/COMPLETE.

### B. Observability and Toggles
- Keep ORION_EMIT_SYNTHETIC=false by default; when enabled, mark synthetic events clearly.
- Keep ORION_VERBOSE_THOUGHTS=false by default; allow session toggles via: “debug thoughts on/off”.
- UI affordance (future): indicate when verbose thoughts are active.
- Optional: Persist thought events into an agent_thoughts table with retention (e.g., 7 days) guarded by a feature flag.

### C. Resilience
- Replace ad‑hoc `.catch(() => {})` with a small async queue for chat‑history writes:
  - Retry with exponential backoff when DB is idle.
  - Cap total retry window per request (e.g., 300–500ms) so the HTTP response is never blocked.
- Enforce a per‑request ceiling for non‑essential persistence work (history, thoughts DB if enabled).

### D. UX Polish (Local Router)
- Suggestions on invalid paths: when `list docs/<folder>` fails, reply with closest matches/siblings.
- Search paging: for `search docs for <term>`, show top N (e.g., 10) and how to view more.
- Response formatting: preserve bullet indentation and truncate very large files with an explicit “…(truncated)…” marker.

### E. Docs & DevQOL
- Extend Docs/Orion_What_To_Expect*.md with troubleshooting:
  - PROJECT_ROOT/CWD notes, DB idle behavior, toggles.
- Add a simple script to exercise chat routes locally:
  - `scripts/test-orion-chat.ps1` (PowerShell) and/or `scripts/test-orion-chat.js` (Node fetch examples).

## 5) Acceptance Criteria
- Chat commands return within ~1 second even when the DB is slow/unavailable.
- list docs, list docs/<folder>, read Docs/<file> succeed across slash/backslash/colon forms on Windows.
- System Log
  - Always shows executing_function and function_result for local actions.
  - Shows thought entries for OBSERVE/THINK/ACT/VERIFY/COMPLETE when ORION_VERBOSE_THOUGHTS=true.
- Tests are green (unit + integration), with Windows path coverage.

## 6) Risks & Considerations
- Over‑verbose logging can clutter the System Log; keep thoughts opt‑in.
- Backoff queue must remain lightweight to avoid memory pressure during DB outages.
- Path normalization should continue to refuse traversal outside PROJECT_ROOT.

## 7) Phasing (Suggested)
- Phase 1: Tests & Observability Baseline
  - Add FileSystemTool unit tests and chat route integration tests.
  - Verify System Log chips and optional thoughts.
- Phase 2: Resilience
  - Replace non‑blocking `.catch` with retry queue + request ceiling.
  - Exercise DB down/up scenarios.
- Phase 3: UX Polish
  - Invalid path suggestions; search paging.
- Phase 4 (Optional): Thought Persistence
  - Add DB table + feature flag + retention.

## 8) Appendix

### Environment Flags
- `ORION_LOCAL_ROUTER=true|false` (default: true)
- `ORION_EMIT_SYNTHETIC=true|false` (default: false)
- `ORION_VERBOSE_THOUGHTS=true|false` (default: false)

### Endpoints (for local checks)
- POST `http://localhost:4000/api/agents/orion/chat`
  - Body examples (JSON):
    - `{ "message": "list docs" }`
    - `{ "message": "list docs/AfterPhase5" }`
    - `{ "message": "read Docs/Phase5_Plan.md" }`

### Quick Test (Node fetch)
```bash
node -e "fetch('http://localhost:4000/api/agents/orion/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'list docs'})}).then(async r=>{const t=await r.text(); console.log('STATUS',r.status); console.log(t)}).catch(e=>console.error('ERR',e.message))"
```

---
This plan is intentionally scoped and incremental so we can lock today’s working behavior and build confidence over time without changing user‑visible features.
