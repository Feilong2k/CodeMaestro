# CodeMaestro Development Roadmap (Technical)

**Goal:** Implement the "Cybernetic Factory" architecture to support the User Roadmap.

---

## Phase 1: The "Control Panel" (Frontend Shell)
**Focus:** Vue 3 + Tailwind/CSS Grid + Pinia State (Mocked).

1.  **Project Shell:**
    *   `App.vue`: CSS Grid layout (Header, Sidebar/Chat, Main/Log, Footer/Status).
    *   `TopBar.vue`: Project Dropdown (mock list), Plan/Act Toggle (UI only).
2.  **Chat Interface:**
    *   `ChatPanel.vue`: Scrollable list, Markdown rendering (`markdown-it`), Input area (autosizing).
    *   `useChatStore`: Pinia store for message history.
3.  **Activity Monitor:**
    *   `ActivityLog.vue`: List of events with color-coded tags.
    *   `LogItem.vue`: Click-to-expand details (JSON view).
4.  **Mock Data:**
    *   Seed Pinia with fake projects and sample chat history to validate UX.

## Phase 2: The "Engine Room" (Backend Foundation)
**Focus:** Node/Express + XState + API Contract.

1.  **Server Setup:**
    *   Express scaffolding with JSON body parser and CORS.
    *   `logger.middleware.js`: Request/Response logging with Trace IDs.
2.  **State Machine (XState):**
    *   `orchestrator.machine.js`: Define states:
        *   `idle` (Start)
        *   `planning` (Drafting FRD)
        *   `awaiting_plan_approval` (Human Gate 1)
        *   `implementing` (The TDD Loop: Code <-> Test)
        *   `verifying` (Final Full Suite Run)
        *   `awaiting_commit_approval` (Human Gate 2)
    *   Define transitions and guards.
3.  **Control API:**
    *   `POST /api/control/transition`: Endpoint to send events to the machine.
    *   `SSE /api/stream`: Server-Sent Events to push state changes to Frontend.
4.  **Agent Stubs:**
    *   Classes for `Orion`, `Tara`, `Devon` that currently just log "I am here".

## Phase 3: The "Brain" (LLM Integration)
**Focus:** OpenAI/DeepSeek API + Context Management.

1.  **LLM Adapter:**
    *   `llm.service.js`: Generic wrapper for API calls with retries/timeouts.
2.  **Orion Agent:**
    *   `agents/orion.js`: Logic to construct the "Architect" system prompt.
    *   `context.manager.js`: Helper to build the prompt context (Project Brief + History).
3.  **Chat API:**
    *   `POST /api/chat`: Connects Frontend -> Orion Agent -> LLM -> Frontend.
4.  **Project Persistence:**
    *   `project.service.js`: CRUD for Projects (FileSystem or MongoDB Lite).

## Phase 4: The "Hands" (Tooling Integration)
**Focus:** File System (fs/promises) + Child Processes (exec).

1.  **File Ops:**
    *   `file.service.js`: Safe wrapper for `writeFile`, `readFile`, `mkdir`.
    *   **Safety:** Path traversal protection (must be inside project root).
2.  **Devon Agent (Writer):**
    *   Implement `generateCode(requirements)` -> calls LLM -> parses code blocks -> calls `file.service`.
3.  **Test Runner Adapter:**
    *   `test.service.js`: Spawns `npm test` or `npx jest`.
    *   Captures `stdout`/`stderr` and parses Pass/Fail result.
4.  **Tara Agent (Verifier):**
    *   Logic to interpret test failures and suggest fixes.

## Phase 5: The "Autopilot" (Orchestration Loop)
**Focus:** Connecting the loop + Git Operations.

1.  **The Loop Logic:**
    *   Update XState machine to auto-cycle in `implementing` state (Write -> Test -> Fail -> Refactor -> Pass).
    *   Auto-transition to `verifying` when subtask requirements met.
2.  **Git Adapter:**
    *   `git.service.js`: Wrappers for `git init`, `add`, `commit`, `status`.
    *   **Subtask Logic:** Auto-commits on Green tests during `implementing`.
3.  **Approval Gate:**
    *   Implement `awaiting_commit_approval` state.
    *   Unlock `POST /api/git/squash` (or final commit) only when in this state.
4.  **E2E Integration:**
    *   Verify the full flow: User Prompt -> Plan -> Agents Work (Loop) -> Final Review -> Done.

---

## References
*   **User View:** `Docs/Roadmap_User_View.md`
*   **Architecture:** `Docs/CodeMaestro_MVP_Consolidated.md`

