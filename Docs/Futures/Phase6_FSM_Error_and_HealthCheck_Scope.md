# Phase 6 Additions — Scope & Estimates

This document details the concrete scope, effort, and acceptance criteria for two proposed Phase 6 enhancements:

- FSM Error Sub‑machine (6‑1 enhancement)
- Health‑Check & Recovery (new 6‑11)

Both are intentionally small and can be delivered in Phase 6 without disrupting current work.

---

## 1) FSM Error Sub‑machine (6‑1 enhancement)

Purpose
- Provide deterministic recovery paths instead of a single terminal ERROR state.
- Reduce triage time and make failures observable/auditable.

Scope (backend only)
- Update AgentFSM to model ERROR as a sub‑machine with explicit exits:
  - ERROR_INIT → RETRY_WAIT (exponential backoff + jitter, capped attempts) → OBSERVE
  - ERROR_INIT → ESCALATE_PENDING (handoff to Orion/human) → RESUME when cleared
  - ERROR_INIT → ABORTED (final)
- Log transitions via AgentFsmLogService (include cause, attempt, backoff ms).
- Wire default policy in AgentExecutor (e.g., retry count = 3; base backoff = 1s; max backoff = 10s; jitter ±20%).
- Provide a small helper to trigger ERROR_INIT on tool failures (e.g., exception in tool execute).

Files Likely Touched
- backend/src/machines/AgentFSM.js
- backend/src/machines/subtaskMachine.js (if used)
- backend/src/services/AgentExecutor.js
- backend/src/services/AgentFsmLogService.js
- backend/src/__tests__/unit/ (new tests)

Dependencies
- None hard. Plays well with Health‑Check & Recovery (below) but does not require it.

Effort (est.)
- 0.5–1.0 day backend incl. tests

Acceptance Criteria
- Given a simulated tool failure, the subtask transitions to ERROR_INIT and follows policy:
  - RETRY path performs N attempts with increasing delays and returns to OBSERVE on success.
  - ESCALATE path marks subtask as pending escalation and emits a log entry with reason.
  - ABORT path reaches final state with root cause recorded.
- agent_fsm_log contains entries with cause, attempt count, and backoff duration.

Risks / Mitigations
- Race between retry timer and manual escalation: lock transitions per subtask to avoid double‑exit.
- Too‑aggressive retries: default to conservative limits and make policy configurable.

---

## 2) Health‑Check & Recovery (new 6‑11)

Purpose
- Detect “zombie agents” (no activity > threshold) and provide a safe manual recovery path.
- Surface live state to ops/owners.

Scope (backend; optional light UI later)
- Heartbeat: On every FSM transition, update last_activity (derive from agent_fsm_log or store on tasks table).
- Stuck detection:
  - Rule: ACT with no heartbeat > X minutes, or NO_HEARTBEAT > Y minutes in THINK/VERIFY.
  - Configurable thresholds via env or constants.
- API endpoints:
  - GET /api/agent‑health → [{ subtaskId, agent, state, lastActivity, status: ok|stuck, hint }]
  - PUT /api/agent‑health/:id/reset → transitions stuck subtask to RETRY_WAIT or ABORTED based on request body
- WebSocket: emit a warning banner event when a subtask becomes stuck; clear on recovery.
- (Optional) Minimal UI hook: System Log displays a warning line; no new page required.

Files Likely Touched
- backend/src/routes/ (new agentHealth router)
- backend/src/services/AgentFsmLogService.js (helper to compute last_activity) or dedicated service
- backend/src/socket/ (warning event)
- backend/src/__tests__/integration/ (new tests)

Dependencies
- Works best with FSM Error Sub‑machine, but can ship independently (reset can simply “nudge” to OBSERVE or ABORT).

Effort (est.)
- 0.5 day backend; +0.5 day if adding a minimal UI notice beyond System Log line

Acceptance Criteria
- GET returns accurate status for active subtasks, including last_activity and a clear stuck/ok flag.
- PUT/reset transitions a stuck subtask to a safe state (RETRY_WAIT or ABORTED) and logs the action.
- WebSocket emits a stuck warning event and a clear event on recovery.

Risks / Mitigations
- False positives near long‑running ACT: require periodic ACT “tick” (e.g., every 60s) to refresh last_activity.
- Manual resets racing with retry timers: rely on per‑subtask transition locks.

---

## Scheduling & Fit in Phase 6
- Both tasks are small and fit comfortably in Phase 6.
- Recommended order:
  1) FSM Error Sub‑machine (6‑1 enhancement)
  2) Health‑Check & Recovery (new 6‑11)
- Both benefit from the test harness already added under backend/scripts/test-orion-chat.js; we can extend that harness to probe stuck detection via simulated delays.

## Summary
- FSM Error Sub‑machine: 0.5–1 day; backend‑only; clear tests; low risk.
- Health‑Check & Recovery: 0.5 day backend (+0.5 day optional UI); clear tests; low risk.
- Both are safe to include in Phase 6 and improve reliability and operability without large code churn.
