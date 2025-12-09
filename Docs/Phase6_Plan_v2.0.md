# Phase 6 v2.0: Body, Process & Context Intelligence

**Status:** Planning (Supersedes Phase6_Plan.md v1.0)
**Prerequisites:**
- Phase 5 tools working, acceptance tests passing
- 5-10 (Stabilization) and 5-11 (Project Context API) completed
- WebSocket server initialized (backend/src/socket)

**High-level Goal:**
Bring CodeMaestro closer to a Cline-class coding agent by giving Orion & team:
- A **reliable Body** (sensory-motor control over tools and environment)
- A **strict Process** (OBSERVE–THINK–ACT–WAIT loop with validation)
- **Proprioception & Context Intelligence** (knowing where they are and what changed)
- **Observability** (Activity Log & Response Panel wired to real agent behavior)

This document focuses on the most impactful Phase 6 tasks we discussed:
- 6-6: Body Interface (Sensory-Motor Middleware)
- 6-7: Agent FSM & Strict Loop
- 6-8: Proprioception & Context Wiring
- 6-9: Real-time Activity Log & Response Panel
- 6-10: TDD/CI Hardening for Autonomous Execution

Earlier 6-1 .. 6-5 objectives (Context API, Response Panel, Onboarding, Suggestions) remain valid, but this v2.0 plan **reorders and deepens** them around Body/Process as architectural pillars.

---

## 1. Architectural Pillars (v2.0)

### 1.1 The Body (Sensory & Motor Control)

**Goal:** Replace "blind" tool execution with a unified Body that:
- Wraps all tool calls (FileSystem, Git, Shell, Project, Database, Memory)
- Captures **sensory feedback** (STDOUT/STDERR, file diffs, git status)
- Maintains **proprioception** (working directory, active files, last commands)
- Normalizes **cross-platform behavior** (Windows/Unix paths)

**Key Components:**
- `BodyInterface` (backend/src/body/BodyInterface.js)
- Sensory Streaming Adapter (tool output capture)
- Proprioception hooks into FileSystemTool, ShellTool, GitTool
- WebSocket bridge to frontend ActivityLog/Response Panel

---

### 1.2 The Process (Thinking & Restriction)

**Goal:** Enforce a predictable OBSERVE–THINK–ACT–WAIT loop for agents:

1. **OBSERVE** – Gather context (project context, proprioception state, last outputs)
2. **THINK** – LLM must output a THOUGHT + ACTION plan (strict JSON/schema)
3. **ACT** – Execute actions via BodyInterface
4. **WAIT** – Capture results, verify, decide whether to continue or stop

**Key Components:**
- Agent FSM (backend/src/machines/AgentFSM.js or similar)
- Enhanced AgentExecutor (backend/src/services/AgentExecutor.js)
- TacticalAdapter prompt/schema updates
- Verification gates (post-edit checks, safety rules)

---

### 1.3 Context & Memories (Project Intelligence)

**Goal:** Make every agent run with rich project context and long-term memory:
- Load project context (6-1/6-3) on session start/project switch
- Enrich with **proprioception** (where we are, what changed)
- Surface key memories (past subtasks, recent issues) into Orion’s system prompt

**Key Components:**
- Project Context API (6-1, already planned)
- AgentContextLoader (6-3, already planned)
- ProprioceptionService (new) feeding into context/memory

**When to work on this:**
- First pass of Context API & Orion context loading is already Phase 6 core
- This plan adds **6-8** to wire Body/Proprioception into those existing context/memory systems

---

### 1.4 Observability (Activity Log & Response Panel)

**Goal:** Make the internal Body/Process **visible** to the user:
- Real-time Activity Log for agent actions, tool calls, state changes
- Response Panel for structured outputs (tool results, summaries, tables)

**Key Components:**
- ActivityLog.vue (already scaffolded with mock data)
- ResponsePanel.vue stack (6-2 v1.0)
- WebSocket client + Pinia store for activity/events

---

## 2. Task Breakdown (v2.0)

### 6-6: Body Interface (Sensory-Motor Middleware) ⚙️

**id:** `6-6`
**Owner:** Devon
**Priority:** Critical
**Depends On:** 5-1, 5-6, 5-11, 6-2 (panel shell)

**Overview:**
Create a unified BodyInterface that wraps all tool usage, streams output, tracks state, and guarantees cross-platform behavior.

#### 6-6-1: BodyInterface Core
- **Goal:** Single entry point for agent → tool execution.
- **Location:** `backend/src/body/BodyInterface.js`
- **Responsibilities:**
  - `executeTool(toolName, action, params, options)` API
  - Pre-execution checks (role/tool permissions via registry)
  - Post-execution result enrichment (timestamps, cwd, affected files)
  - Graceful error handling (no unhandled rejections)

**Acceptance Criteria:**
- Unit tests cover happy/sad paths for at least FileSystemTool, ShellTool, GitTool
- AgentExecutor can delegate tool calls through BodyInterface without breaking existing behavior

#### 6-6-2: Sensory Streaming Adapter
- **Goal:** Capture STDOUT/STDERR and other rich outputs from tools.
- **Location:** `backend/src/body/StreamingAdapter.js` (or included in BodyInterface)
- **Responsibilities:**
  - Wrap ShellTool exec to collect stdout+stderr (chunked)
  - Optionally compute diffs for file writes (before/after snippets)
  - Emit structured events: `{ tool, action, chunk, isError, sequenceId }`

**Acceptance Criteria:**
- At least one integration test: long-running `npm test` or `echo` produces multiple output chunks
- Errors (non-zero exit code) are captured and marked in the stream

#### 6-6-3: Cross-Platform Path Normalization
- **Goal:** Remove Windows-vs-Unix friction in tool usage.
- **Location:** `backend/src/utils/pathNormalizer.js`; used by FileSystemTool, BodyInterface
- **Responsibilities:**
  - Convert Windows-style paths to normalized internal representation
  - Prevent path traversal (`..`) outside project root

**Acceptance Criteria:**
- Unit tests cover Windows-style (`C:\Users\User\project`) and POSIX (`/home/user/project`) paths
- Existing failing tests around Windows paths (Phase 5.5) are green

#### 6-6-4: WebSocket Bridge for Body Events
- **Goal:** Connect Body events to the existing WebSocket server.
- **Location:** `backend/src/body/WebSocketBridge.js`
- **Responsibilities:**
  - Subscribe to BodyInterface events (start/output/complete)
  - Broadcast via `broadcastToAll` / `broadcastToSubtask`
  - Event types: `body_tool_start`, `body_tool_output`, `body_tool_complete`

**Acceptance Criteria:**
- WebSocket integration tests confirm events are emitted for tool calls
- Frontend receives events and can log them (stubbed client)

---

### 6-7: Agent FSM & Strict Loop 🔒

**id:** `6-7`
**Owner:** Devon
**Priority:** Critical
**Depends On:** 5-3 (AgentExecutor), 5-4 (XML/Output parsers), 6-6

**Overview:**
Refactor AgentExecutor into an FSM-driven loop enforcing OBSERVE–THINK–ACT–WAIT with strict schemas.

#### 6-7-1: AgentFSM Design & Implementation
- **Location:** `backend/src/machines/AgentFSM.js`
- **States:** `OBSERVE`, `THINK`, `ACT`, `WAIT`, `VERIFY`, `COMPLETE`, `ERROR`.
- **Features:**
  - Deterministic transitions
  - Step budget enforcement
  - Pluggable strategies for different agent types

**Acceptance Criteria:**
- Unit tests for all state transitions, including error paths
- Can simulate a simple task with 2–3 loops without tools

#### 6-7-2: AgentExecutor Integration
- **Location:** `backend/src/services/AgentExecutor.js`
- **Changes:**
  - Replace ad-hoc while-loop with FSM loop
  - Integrate with BodyInterface for `ACT` state
  - Maintain backward compatibility for existing tasks

**Acceptance Criteria:**
- Existing AgentExecutor unit tests updated and passing
- New tests assert FSM sequences for common flows (e.g., read → edit → verify)

#### 6-7-3: Schema & Prompt Enforcement
- **Location:** `backend/src/llm/TacticalAdapter.js` and/or new prompt template
- **Requirements:**
  - LLM responses must follow schema:
    ```json
    { "thought": "...", "action": { "tool": "FileSystemTool", "params": {...} } }
    ```
  - Reject or retry responses that do not match schema

**Acceptance Criteria:**
- Unit tests: malformed responses are detected and handled
- At least one golden-path test: LLM response → parsed JSON → tool call

#### 6-7-4: Verification Gates
- **Goal:** Enforce "you must verify your work after every edit".
- **Location:** AgentFSM + BodyInterface + Tools
- **Mechanics:**
  - After file edits, run a verification step (e.g., syntax check, tests)
  - If verification fails, record and surface clearly in ActivityLog/Response Panel

**Acceptance Criteria:**
- Integration test: failing verification blocks completion and surfaces errors
- Verification steps are logged via WebSocket/ActivityLog

---

### 6-8: Proprioception & Context Wiring 🧭

**id:** `6-8`
**Owner:** Devon
**Priority:** High
**Depends On:** 5-11 (Project Context API), 6-6, 6-7

**Overview:**
Connect the Body’s runtime state (proprioception) into the existing Context & Memory systems so Orion "knows where and what" they’re working on.

#### 6-8-1: ProprioceptionService
- **Location:** `backend/src/services/ProprioceptionService.js`
- **State Tracked:**
  - Current working directory per project/session
  - Active/open files and last edit times
  - Recent commands and their outcomes

**Acceptance Criteria:**
- Unit tests: saving, updating, and retrieving state
- Can query proprioception for a project and see latest cwd + active files

#### 6-8-2: Context & Memory Integration
- **Location:** `backend/src/services/projectContextService.js`, `AgentContextLoader`
- **Responsibilities:**
  - Enrich `/api/projects/:id/context` with proprioception summaries
  - Inject proprioception summary into Orion’s system prompt:
    ```
    [PROPRIOCEPTION]
    Working Directory: ...
    Files Touched: [...]
    Last Command: ... (success/failure)
    [END PROPRIOCEPTION]
    ```

**Acceptance Criteria:**
- Integration tests: project context API includes proprioception data
- Orion responses demonstrably reference recent state (e.g., "You recently edited X")

#### 6-8-3: Memory Hooks
- **Location:** `backend/src/services/memoryExtractionService.js`
- **Responsibilities:**
  - Include proprioception events as candidates for extraction
  - Support queries like "What files did we touch for task 5-9?"

**Acceptance Criteria:**
- At least one test case: query memory returns recent file edits & commands

---

### 6-9: Real-time Activity Log & Response Panel 🎛️

**id:** `6-9`
**Owner:** Devon (frontend + backend glue)
**Priority:** High
**Depends On:** 6-6-4, existing ActivityLog + ResponsePanel shells

**Overview:**
Wire the existing ActivityLog and planned Response Panel to actual WebSocket events from BodyInterface and AgentFSM.

#### 6-9-1: WebSocket Client & Activity Store
- **Location:**
  - `frontend/src/composables/useSocket.js`
  - `frontend/src/stores/activityLog.js`
- **Responsibilities:**
  - Connect to backend Socket.IO
  - Subscribe to `agent_action`, `log_entry`, `body_tool_*` events
  - Maintain a reactive list of activity entries

**Acceptance Criteria:**
- Frontend unit tests: store updates on mock socket events

#### 6-9-2: ActivityLog.vue Realtime Integration
- **Location:** `frontend/src/components/ActivityLog.vue`
- **Changes:**
  - Replace mock rows with data from activityLog store
  - Display agent, action, status, time-ago from real events

**Acceptance Criteria:**
- Integration tests: ActivityLog updates when simulated WebSocket messages arrive

#### 6-9-3: Response Panel Wiring
- **Location:** `frontend/src/components/ResponsePanel.vue` (and subcomponents)
- **Responsibilities:**
  - Render structured `panel_data` returned from backend
  - Show tool results (file content, git status, DB queries) using appropriate renderers

**Acceptance Criteria:**
- Component tests: JSON/code/table renderers work with sample payloads
- E2E test: run an operation and see both chat text + structured panel data

---

### 6-10: TDD & CI Hardening for Autonomous Execution ✅

**id:** `6-10`
**Owner:** Devon + Tara
**Priority:** Medium
**Depends On:** 6-6, 6-7, 6-8, 6-9

**Overview:**
Ensure the new Body/Process/Context system is fully covered by tests and integrated into CI.

#### 6-10-1: Test Matrix & Coverage
- Define required unit, integration, and E2E tests for 6-6 … 6-9
- Ensure ~80% coverage on new code

#### 6-10-2: CI Pipeline Updates
- Update GitHub Actions (or equivalent) to run:
  - Backend unit + integration tests
  - Frontend unit tests
  - Key E2E workflows (create project → agent work → activity log)

**Acceptance Criteria:**
- CI red if any of the new tests fail
- Documented in `Docs/Phase6_Plan_v2.0.md` and/or a dedicated CI doc

---

## 3. Dependency Graph (v2.0)

Rough sequencing:

```text
5-1, 5-6, 5-11          (Phase 5 foundations)
         │
         ├── 6-6 (Body Interface)
         │      └── 6-6-1..4
         │
         ├── 6-7 (Agent FSM & Strict Loop)
         │      └── 6-7-1..4
         │
         ├── 6-8 (Proprioception & Context Wiring)
         │      └── 6-8-1..3
         │
         ├── 6-9 (Activity Log & Response Panel Realtime)
         │      └── 6-9-1..3
         │
         └── 6-10 (TDD & CI Hardening)
                └── 6-10-1..2
```

---

## 4. Phase 6 v2.0 Acceptance Criteria

Phase 6 v2.0 is **complete** when:

1. **Body Interface**
   - All agent tool calls go through BodyInterface
   - STDOUT/STDERR and key outputs are capturable and streamable
   - Cross-platform path issues are resolved for primary workflows

2. **Process FSM**
   - AgentExecutor uses an FSM with OBSERVE–THINK–ACT–WAIT
   - LLM outputs are schema-enforced (THOUGHT + ACTION)
   - Post-edit verification is enforced and logged

3. **Context & Proprioception**
   - Project context includes runtime state (cwd, active files, recent commands)
   - Orion’s responses demonstrate awareness of recent actions/files

4. **Observability**
   - Activity Log shows real-time agent actions & tool events
   - Response Panel displays structured tool outputs when appropriate

5. **TDD & CI**
   - New components covered by unit, integration, and E2E tests
   - CI pipeline runs and enforces these tests on every PR/merge

---

## 5. Notes for CodeMaestro (Orion/Devon/Tara)

- **Orion (Architect/Coordinator):**
  - Use this plan to create/update subtask logs (e.g., `Agents/Subtasks/Logs/6-6.yml`, etc.)
  - Enforce no scope creep on closed subtasks; new requirements → new subtasks

- **Devon (Developer):**
  - Treat each major section (6-6, 6-7, 6-8, 6-9, 6-10) as a feature slice
  - Follow TDD: Red → Green → Refactor for every subtask

- **Tara (Tester):**
  - Own test artifacts for each subtask (unit, integration, E2E)
  - Ensure sad-path tests (tool failures, schema violations, verification failures)

This `Phase6_Plan_v2.0.md` supersedes the original Phase 6 plan for implementation details, while preserving the original high-level goals (Context, Response Panel, Onboarding, Suggestions) as outcomes of the new Body/Process architecture.
