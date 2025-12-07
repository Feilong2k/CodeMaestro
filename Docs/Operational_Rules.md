# Operational Rules: Conflict Prevention & Multi-Agent Safety

**Version:** 3.2 (Orion-Integrated Git Flow)
**Status:** Active
**Context:** Rules for Phase 4-9 (Automated Orchestrator)

---

## 1. Core Philosophy: Concern-Based Locking

To enable parallel agent execution without file conflicts or race conditions, we enforce strict separation of concerns via Database Locks.

**The Golden Rule:**
> **No two agents may work on the same (Subtask + Concern) at the same time.**

### Example Scenario: The "Login Button" Task
1.  **Start:** Task `AUTH-101` (Create Login Button) is created.
2.  **Lock 1:** Tara requests lock for `AUTH-101` + `tests`.
    *   *System Check:* Is `AUTH-101` locked? No.
    *   *Result:* **Granted.** Tara starts working.
3.  **Lock 2:** Devon requests lock for `AUTH-101` + `implementation`.
    *   *System Check:* Is `AUTH-101` locked? Yes (by Tara).
    *   *Conflict Check:* Is `implementation` == `tests`? No.
    *   *Result:* **Granted.** Devon starts working (Parallel!).
4.  **Lock 3:** Another Devon instance requests lock for `AUTH-101` + `implementation`.
    *   *System Check:* `implementation` is already locked by Devon 1.
    *   *Result:* **DENIED.** (Prevents double-work).

---

## 2. Concern Types & Territory

Agents are assigned a specific **Concern**. This grants them permission to edit specific files.

### Territory Map

| Concern | Primary Agent | Write Access (Territory) | Read Access | Locking Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Design** | Orion | `Docs/`, `manifest.yml` | All | Task Definition |
| **Tests** | Tara | `__tests__/**/*`, `*.spec.ts`, `*.test.js` | `src/**/*` | Test Suite |
| **Implementation** | Devon | `src/**/*` (excluding tests) | `__tests__/**/*` | Source Code |
| **Refactor** | Devon | `src/**/*`, `__tests__/**/*` | All | **GLOBAL LOCK** (Blocks Tests) |
| **Documentation** | Orion/Devon | `README.md`, `Docs/**/*` | All | Docs Only |
| **Config** | Orion | `package.json`, `.env`, `docker-compose.yml` | All | **CRITICAL LOCK** (Exclusive) |

### Protected Paths Registry (Requires Orion Approval)
*   `/types/**/*`, `/schemas/**/*` (Contracts)
*   `/db/migrations/**/*` (DB Structure)

**Rule:** If an agent needs to change these, they must request an **Interface Lock** or delegate to Orion.

---

## 3. The Rules of Engagement

### Rule A: Single Owner per Concern
If Devon owns `Implementation` for Task-123, Tara cannot touch `src/` for Task-123.

### Rule B: Tara Always Leads
Every TDD cycle begins with Tara.
1.  **Red Phase:** Tara creates tests.
2.  **Green Phase:** Devon implements.

### Rule C: Refactoring is Exclusive
Refactoring changes contracts.
*   **Action:** System locks `Tests` concern. Tara must pause.

---

## 4. Git Safety & Traceability

### The "Holy Base" Rule
The `subtask/{id}-base` branch is **APPEND-ONLY** for Agents.
*   **Agents:** NEVER `reset --hard`, `rebase`, or `push --force`.
*   **Orion:** Only Orion can rewrite history.

### The Traceability Rule
Commits must be identifiable: `[AGENT] Message`.

### The Backup Protocol (Parachute)
Orion pushes `subtask/{id}-base` to Origin:
1.  When Base passes tests.
2.  After every successful merge.
3.  Every 60 minutes.

---

## 5. Subtask Ownership Schema (Data Model)

```json
{
  "task_id": "TASK-0142",
  "concern": "tests",
  "owner": "Tara",
  "locked": true,
  "locked_at": "2025-12-07T10:32:01Z"
}
```

---

## 6. Workflow: The Local Factory (Git Worktrees)

**Constraint:** Agents share the same `.git` folder. Concurrent merges create race conditions.
**Solution:** Agents **Request** merges; Orion **Executes** them sequentially.

### The Flow

**1. Setup (Orion)**
*   Creates `subtask/{id}-base` from `master`.

**2. Red Phase (Tara)**
*   Worktree: `../CM-tara`. Branch: `feature/tests`.
*   Writes Tests. Commits `[TARA] Red Phase...`.
*   **Signal:** "Orion, I am done."

**3. Integration 1 (Orion)**
*   Worktree: Main.
*   **Action:** Merges `feature/tests` -> `subtask/{id}-base`.
*   (This is serialized. If Devon calls at same time, he waits).

**4. Green Phase (Devon)**
*   Worktree: `../CM-devon`.
*   **Update:** Pulls/Checks out `subtask/{id}-base` (Gets Tara's tests).
*   Branch: `feature/impl`.
*   Writes Code. Commits `[DEVON] Green Phase...`.
*   **Signal:** "Orion, I am done."

**5. Integration 2 (Orion)**
*   Worktree: Main.
*   **Action:** Merges `feature/impl` -> `subtask/{id}-base`.

**6. Completion (Orion)**
*   **Verify:** Runs tests on `subtask/{id}-base`.
*   **Merge:** `subtask/{id}-base` -> `master`.
*   **Push:** `master` -> Origin.
*   **Cleanup:** Delete subtask and feature branches.
