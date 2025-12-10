# Orion Chat Tools — Executive Summary (Stabilization & Observability)

Context
- Local router commands (list docs, read Docs/<file>, git status) are now working reliably on Windows.
- We added clear System Log chips (executing_function → function_result) and optional thought logs (OBSERVE/THINK/ACT/VERIFY/COMPLETE) behind ORION_VERBOSE_THOUGHTS.
- FileSystemTool now uses absolute resolved paths (CWD‑independent) to avoid server runtime path issues.

Goals
- Reliability: Chat returns promptly even if the DB is slow/unavailable.
- Windows‑safe paths: Support slash/backslash/colon variants for read/list.
- Observability: Consistent, actionable System Log entries (intent + completion; optional thoughts).
- Confidence: Unit/integration tests to lock behavior and prevent regressions.

Top Priorities (Next Moves)
1) Tests (fast win)
   - Unit: FileSystemTool path resolution (read/list with absolute resolved paths; traversal protection).
   - Integration: POST /api/agents/orion/chat — list docs, list docs/<folder>, read Docs/<file>; DB up vs down; slash/backslash/colon.
   - Contract: System Log must show executing_function/function_result; thoughts appear when ORION_VERBOSE_THOUGHTS=true.
2) Resilience (non‑blocking persistence)
   - Replace ad‑hoc `.catch(() => {})` with a lightweight async retry queue for chat‑history writes.
   - Cap retry window per request (e.g., 300–500ms) so HTTP replies are never blocked.
3) UX polish (local router)
   - Suggestions on invalid folder paths; search paging for large result sets.

Risks & Mitigations
- Over‑verbose logs can clutter the System Log → Keep thought logs opt‑in; add a UI indicator when on.
- DB outages could accumulate retries → Use capped, jittered backoff and per‑request ceiling.
- Path normalization must remain strict → Keep traversal checks and base‑path enforcement.

Key Environment Flags
- ORION_LOCAL_ROUTER=true|false (default: true)
- ORION_EMIT_SYNTHETIC=true|false (default: false)
- ORION_VERBOSE_THOUGHTS=true|false (default: false); chat toggles: “debug thoughts on/off”

Definition of Done
- Chat commands return within ~1 second even during DB hiccups; no hangs.
- Paths work across slash/backslash/colon forms; traversal blocked outside PROJECT_ROOT.
- System Log consistently shows intent and completion; thought logs appear only when enabled.
- Tests (unit + integration) are green on Windows.

Suggested Phasing
- Phase 1: Tests & Observability Baseline
- Phase 2: Resilience (retry queue + per‑request ceilings)
- Phase 3: UX Polish
- Phase 4 (Optional): Thought persistence (feature‑flagged with retention)
