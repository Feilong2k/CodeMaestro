# Phase 5: Autonomous Execution (The Hands) - Technical Plan

## Goal
Enable Agents to autonomously execute tasks through a `Think -> Act -> Observe` loop, driven by a persistent Task Queue.

## Architecture Decisions
1.  **Task Queue:** PostgreSQL-backed (`tasks` table).
    *   **Why:** ACID compliance, atomic locks (SKIP LOCKED), unified infrastructure, simpler backups/migrations.
    *   **Downside (Mitigated):** Slightly higher latency than Redis (ms vs µs), but irrelevant for LLM tasks taking seconds/minutes. polling overhead (negligible for our scale).

2.  **Tool Safety:** "Sandboxed" Execution.
    *   Agents can only write to `cwd` (Project Root).
    *   Command execution allowlist (e.g., `npm test`, `git`, `node`).
    *   **Phase Zero Check:** Verify `cwd` is not `/` or `~`.

## Subtasks Breakdown

### 5-1: Tool Registry & Safety
*   **Objective:** specific classes for `FileTool`, `ShellTool`, `GitTool`.
*   **Requirements:** 
    *   Input validation (Zod schemas).
    *   Safety checks (Path traversal prevention).
    *   **Role-Based Access Control (RBAC):**
        *   **Tara:** Can edit `tests/`, `__tests__/`. Read-only `src/`.
        *   **Devon:** Can edit `src/`, `package.json`. Read-only `tests/`.
        *   **Orion:** Can edit `Agents/`, `Docs/`. Git `merge/push`.
    *   Standardized output format `{ success: boolean, data: any, error: string }`.

### 5-2: Task Queue System (Postgres)
*   **Objective:** Create `tasks` table and `TaskQueueService`.
*   **Schema:** `id`, `type`, `payload` (JSON), `status` (pending, running, completed, failed), `worker_id`, `created_at`, `started_at`, `completed_at`.
*   **Methods:** `enqueue()`, `dequeue()` (with atomic locking), `complete()`, `fail()`.

### 5-3: The Agent Loop (Executor)
*   **Objective:** The `while(true)` loop for Workers.
*   **Logic:**
    1.  `queue.dequeue()` -> Get Task.
    2.  `context = buildContext(task)` (uses 4-11 Pruner).
    3.  `plan = ai.plan(context)`.
    4.  `action = ai.decideAction(plan)`.
    5.  `result = tools.execute(action)`.
    6.  `ai.observe(result)`.
    7.  **Step Budget Check:** If steps > 20, abort and fail task (prevent infinite loops).
    8.  Repeat until `task.done`.

### 5-4: Output Parsers
*   **Objective:** Convert LLM text to Actions.
*   **Challenge:** LLMs are chatty.
*   **Solution:** Strict XML or JSON framing for actions. e.g., `<tool name="writeFile">...</tool>`.

## Dependencies
*   Requires **4-11 (Context Pruner)** to manage the loop's history.
*   Requires **4-9 (Orchestrator)** to lock resources while tasks run.

