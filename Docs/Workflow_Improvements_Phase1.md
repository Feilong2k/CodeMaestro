## Workflow Improvements — Phase 1 (Control Panel)

Owner: Orion (Orchestrator)  
Status: Draft v0.1  
Scope: Lessons learned while implementing subtasks 1‑1 through 1‑6 and 1‑2, and concrete improvements for the orchestration workflow.

---

## 1. What Worked Well

- **Single Sources of Truth**
  - `Agents/Subtasks/manifest.yml` for subtask list, status, branch, and log paths.
  - `Agents/Subtasks/Logs/<id>.yml` for requirements, checklists, openQuestions, notes, and PR/Test report links.
  - Result: easy to resume work after context loss and to audit each subtask.

- **TDD Loop Enforced**
  - Tara creates failing unit/integration tests (Red).
  - Devon implements until tests pass (Green) and performs a refactor pass.
  - Tara runs integration + coverage as final gate.
  - Result: issues (Tailwind, canvas mocks) surfaced early and with clear contracts.

- **Git Hygiene**
  - One branch per subtask, squash merge into `master`.
  - Final artifacts per subtask:
    - Test report in `Agents/Subtasks/TestReports/<id>_*.md`.
    - Merge request summary in `Agents/Subtasks/MergeRequests/<id>_*.md`.

- **Lightweight Orchestrator Tools**
  - `scripts/context.js` to assemble role+log+rules at session start.
  - `scripts/next-tasks.js` to list subtasks whose dependencies are satisfied.

---

## 2. Pain Points Observed

- **Status vs Checklist Confusion**
  - Subtasks were occasionally marked `completed` before Tara’s integration/coverage gates were green.
  - Logs sometimes implied “done” while remaining boxes were unchecked.

- **Environment & Tooling Issues Bleeding Into Features**
  - Tailwind v4 vs v3, missing `postcss.config.js`, and Vitest canvas mocking all blocked feature subtasks.
  - These belonged to “tooling setup”, not “Header” or “Matrix Theme”.

- **Context Generation Overuse**
  - Full context files were regenerated more often than necessary.
  - In practice, they are only needed at **session start** or when switching agents/models.

- **Manual YAML Editing**
  - Status, timestamps, and some fields were edited by hand in logs/manifest.
  - High chance of typos or inconsistent state across files.

- **Parallelism Ambiguity**
  - Once 1‑3, 1‑4, 1‑5 were all unblocked, it was unclear:
    - How many subtasks Tara/Devon should handle concurrently.
    - How Orion should decide which ready subtasks to assign.

---

## 3. Proposed Workflow Improvements

### 3.1 State Machine Enforcement

- **Rule:** Only Orion updates `status` fields in `manifest.yml` and logs.
- Devon:
  - May update `verificationChecklist` developer items and `prChecklist.developer`.
- Tara:
  - May update tester checklist items, `prChecklist.tester`, and `openQuestions`.
- Orion:
  - Moves `status` through `pending → in_progress → ready-for-review → completed`.
- Future:
  - Provide CLI helpers instead of manual edits, e.g.:
    - `node scripts/orion-status.js set 1-3 in_progress`
    - `node scripts/orion-status.js set 1-3 completed`

### 3.2 Environment & Tooling Subtasks

- Introduce dedicated `0-x` subtasks for shared setup:
  - `0-1 Tailwind Baseline` — Tailwind v3 configured, smoke UI passes.
  - `0-2 Test Runner Baseline` — Vitest + jsdom + canvas mocks working.
- Policy:
  - If Tara or Devon hit fundamental tooling issues, they:
    - Mark the relevant `0-x` subtask `blocked` or `in_progress`.
    - Log details there instead of inside feature subtasks.

### 3.3 Orchestrator Helpers (Ready Queue)

- Use `scripts/next-tasks.js` as the initial “Ready Queue” engine:
  - Reads `manifest.yml` + per-subtask logs.
  - Lists all subtasks where:
    - `status == pending`, and
    - All IDs in `dependencies` are `completed`.
- Future backend feature:
  - `/api/orion/ready-tasks` implementing the same logic on PostgreSQL.
  - Orion UI shows:
    - Ready for Tara, Ready for Devon, Blocked (with reasons).

### 3.4 Parallelism Policy

- Tara:
  - May create failing unit tests for multiple **independent** subtasks in parallel, as long as they don’t touch the same files.
- Devon:
  - Should have at most one *implementation* subtask active per repo to minimize merge conflicts.
- Orion:
  - Uses `next-tasks.js` / future API to:
    - Prefer “vertical slices” (finish 1‑3 before 1‑4/1‑5), unless there is idle capacity.

### 3.5 PR & Merge Artifacts

- Standardize per-subtask artifacts:
  - `testReport: Agents/Subtasks/TestReports/<id>_*.md`
  - `mergeRequest: Agents/Subtasks/MergeRequests/<id>_*.md`
- Logs should link to these paths so:
  - Future dashboard can show “View Test Report” / “View Merge Summary” buttons.

---

## 4. Relation to Future Features

- **Phase A — Orchestrator Foundation** (see `Docs/CodeMaestro_Future_Features.md`):
  - The Ready Queue + dependency resolver here is the concrete behavior behind:
    - Workflow Orchestration Service
    - State machine and agent session tracking.
- **Phase B — Pro Dashboard:**
  - The manifest/log-driven Ready Queue and state transitions can feed:
    - Dependency graphs
    - Workflow timelines
    - Task board views.


