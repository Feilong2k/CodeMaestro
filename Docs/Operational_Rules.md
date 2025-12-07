# Operational Rules: Conflict Prevention & Multi-Agent Safety

**Version:** 3.0 (Local Factory Model)
**Status:** Active
**Context:** Rules for Phase 4-9 (Automated Orchestrator)

---

## 1. Core Philosophy: Concern-Based Locking

To enable parallel agent execution without file conflicts or race conditions, we enforce strict separation of concerns.

**The Golden Rule:**
> **No two agents may work on the same (Subtask + Concern) at the same time.**

---

## 2. Concern Types & Territory

Agents are assigned a specific **Concern**. This grants them permission to edit specific files and requires them to lock specific resources.

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
The following paths define the contract between agents. Changing them breaks everything, so they are **Protected**.

*   `/types/**/*` (TypeScript Interfaces)
*   `/schemas/**/*` (Validation Schemas)
*   `/interfaces/**/*` (API Contracts)
*   `/db/migrations/**/*` (Database Structure)

**Rule:** If an agent needs to change these, they must request an **Interface Lock** or delegate the change to Orion.

---

## 3. The Rules of Engagement

### Rule A: Single Owner per Concern
If Devon owns `Implementation` for Task-123, Tara cannot touch `src/` for Task-123. She *can* own `Tests` for Task-123 simultaneously.

### Rule B: Tara Always Leads
Every TDD cycle begins with Tara.
1.  **Red Phase:** Tara creates tests (Concern: Tests). Devon is IDLE or working on a *different* task.
2.  **Handoff:** Tara signals "Red Phase Complete". Logic unlocks for Devon.
3.  **Green Phase:** Devon implements (Concern: Implementation). Tara monitors or writes Integration Tests.

### Rule C: Refactoring is Exclusive
Refactoring (renaming, moving files) changes the contract.
*   **Trigger:** Devon signals "Starting Refactor".
*   **Action:** System locks `Tests` concern. Tara must pause or finish current commit.
*   **Release:** Devon signals "Refactor Complete".

### Rule D: Shared Config Safety
Files like `package.json` or `schema.sql` are **Critical Shared Resources**.
*   **Request:** Agent requests "Add dependency `axios`".
*   **Action:** Orion (Orchestrator) queues the request. Orion performs the edit.
*   **Result:** No merge conflicts on config files.

### Rule E: Environment Contract (Drift Prevention)
If logic requires new infrastructure (Redis, API Keys):
1.  **Check:** Does `Docs/env.contract.md` include it?
2.  **Request:** If not, Request "Environment Update".
3.  **Approval:** Orion approves and updates `.env.example` and `env.contract.md`.
4.  **Action:** Only then can implementation proceed.

---

## 4. Subtask Ownership Schema (Data Model)

This schema will be stored in the `subtasks` table (metadata column) or a new `locks` table.

```json
{
  "task_id": "TASK-0142",
  "parent_task": "AUTH_MODULE",
  "description": "Validate user input on signup",
  "owner": "Tara",
  "concern": "tests",  // [design, tests, implementation, refactor, verification]
  
  // Branching Strategy
  "branch_name": "feature/TASK-0142-tests",
  "base_branch": "subtask/4-9-orchestrator-automation",
  
  // Locking Status
  "status": "in_progress",
  "locked": true,
  "locked_at": "2025-12-07T10:32:01Z",
  "handoff_allowed": false,
  
  // Safety
  "dependencies": ["TASK-0141"],
  "escalation_level": 0, // 0=None, 1=Retry, 2=Orion, 3=Council, 4=Human
  "last_update": "2025-12-07T10:40:22Z",
  
  // Metadata
  "acceptance_criteria": [
    "Reject empty email",
    "Password >= 8 characters"
  ],
  "tests_required": true
}
```

---

## 5. Workflow: The Local Factory (Git Worktrees)

To allow true parallelism without cloud latency, we use **Local Git Worktrees** sharing a single repository.

### The Workstations
1.  **Orion (Master):** `C:\Coding\CM`
    *   Role: Orchestration, Merging, Deployment.
    *   Active Branch: `master` or `subtask/{id}-base`.
2.  **Tara (Tester):** `C:\Coding\CM-tara`
    *   Role: Writing Tests, Verification.
    *   Active Branch: `feature/{id}-tests`.
3.  **Devon (Implementer):** `C:\Coding\CM-devon`
    *   Role: Implementation, Refactoring.
    *   Active Branch: `feature/{id}-impl`.

### The Flow (Topology)

**1. Setup (Orion)**
*   Creates `subtask/{id}-base` from `master`.
*   (No push to origin yet).

**2. Red Phase (Tara)**
*   Checks out `feature/{id}-tests`.
*   Writes Tests. Commits.
*   **Merges** `feature/{id}-tests` -> `subtask/{id}-base` (Locally).

**3. Green Phase (Devon)**
*   Checks out `subtask/{id}-base` (Instantly sees Tara's work).
*   Checks out `feature/{id}-impl`.
*   Writes Code. Commits.
*   **Merges** `feature/{id}-impl` -> `subtask/{id}-base` (Locally).

**4. Completion (Orion)**
*   Checks out `master`.
*   **Merges** `subtask/{id}-base` -> `master`.
*   **Pushes** `master` -> Origin.

**5. Cleanup (Mandatory)**
*   Orion commands Tara/Devon to checkout `master` (Release branches).
*   Orion deletes `feature/{id}-tests`.
*   Orion deletes `feature/{id}-impl`.
*   Orion deletes `subtask/{id}-base`.

### Advantages
*   **Speed:** No network latency for intermediate steps.
*   **Isolation:** Worktrees prevent file clobbering.
*   **Cleanliness:** Origin only sees the finished product.
