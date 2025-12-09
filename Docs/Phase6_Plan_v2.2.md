# Phase 6 v2.2: Integration-First Body & Process (With Human Checks)

**Status:** Planning (Supersedes Phase6_Plan_v2.1.md)

**Core Principle:** Every subtask must have **end-to-end integration** (DB → API → UI) where applicable, and include a **concrete human verification flow** that does not require reading code.

We introduce a **Task 6-0** to establish the UI + WebSocket foundation and a renamed/renumbered sequence 6-0 .. 6-5.

---

## 0. Pre-requisites

- Phase 5 tools working, acceptance tests passing
- 5-3 (AgentExecutor baseline), 5-6 (ShellTool), 5-10/5-11 (Stabilization + Project Context API)
- WebSocket server available at backend (`backend/src/socket`)

---

## 1. Task 6-0: UI & WebSocket Foundation + 3-Panel Layout

**id:** `6-0`  
**Owner:** Devon (frontend + backend glue)  
**Priority:** Critical  
**Depends On:** 5-6 (ShellTool), WebSocket server basic setup

### 6-0 Overview

Goal: Establish a **three-panel layout** and real-time WebSocket connection so you can see:
- Chat on the **left** (primary interaction)
- System/Debug Panel in the **middle** (system messages, tool output, errors)
- Activity Log on the **right** (agent actions)

This creates a **visual dashboard** for everything the system is doing.

### 6-0 Subtasks

#### 6-0-1: Layout Restructuring (3-Panel Grid)
- Update `MainLayout.vue` to:
  - Use a 3-column grid on desktop: Chat (2/4), System Panel (1/4), Activity (1/4)
  - Expose slots: `left`, `center`, `right`
- Update `App.vue` to:
  - Place ChatPanel in `left` slot
  - New SystemLogPanel in `center` slot
  - ActivityLog in `right` slot

**Integration:** UI-only (no DB) but must still render correctly on real app.

**Human check:**
1. Open the web app in your browser.
2. Confirm the layout shows **three main columns**:
   - Left: Chat
   - Middle: empty or placeholder System Panel
   - Right: Activity Log.
3. Resize the window smaller and larger; layout should remain readable, with Chat still the largest area.

---

#### 6-0-2: SystemLogPanel Component
- Create `frontend/src/components/SystemLogPanel.vue`.
- Features:
  - List view of messages (time, type, message text)
  - Visual distinction for error / warning / info (colors or icons)
  - Auto-scroll to latest messages

**Integration:** UI-only at this stage, but designed to accept real-time data later.

**Human check:**
1. Open the app; you should see a **System Log** middle panel with a heading (e.g., "System Log").
2. If no messages yet, you should see a clear empty state message (e.g., "No system messages yet").

---

#### 6-0-3: Frontend WebSocket Connection
- Create `frontend/src/composables/useWebSocket.js` (or similar).
- Responsibilities:
  - Connect to backend WebSocket (e.g., `ws://localhost:4000` or Socket.IO equivalent).
  - Subscribe to events: `system_message`, `tool_output`, `agent_action`, `error`.
  - Update a Pinia store (e.g., `useSystemLogStore`, `useActivityLogStore`).

**Integration:**
- UI ↔ WebSocket, no DB yet.

**Human check:**
1. Start the backend server.
2. Open the frontend app.
3. You should see at least one **system message** in the System Log (e.g., "WebSocket connected" or similar).
4. If you stop the backend, you should see a **disconnection or error message** appear.

---

#### 6-0-4: Backend WebSocket Event Emission (Basic)
- Ensure backend emits real events for:
  - `system_message` when server starts or health checks run.
  - `agent_action` when an agent starts/finishes a task.
- Use existing `backend/src/socket/index.js` and/or AgentExecutor hooks.

**Integration:**
- Backend events → WebSocket → Frontend SystemLogPanel/ActivityLog.

**Human check:**
1. Trigger an agent task (e.g., ask Orion to plan something).
2. Watch the right Activity Log and middle System Log:
   - You should see new entries **appear as the agent works**.
   - No need to refresh the page.

---

#### 6-0-5: Minimal DB/API/WebSocket Health Integration
- Backend:
  - Add an endpoint `/api/websocket-status` that returns:
    - current connection count
    - last event timestamp
- (Optional) Store last WebSocket status in a DB table `websocket_health` for basic auditing.

**Integration:** DB → API → UI check.

**Human check:**
1. Call `/api/websocket-status` via browser or Postman; confirm JSON response is non-empty and changes when you connect/disconnect the frontend.
2. (If UI added) A small indicator in System Panel shows the number of connected clients.

---

## 2. Task 6-1: Agent FSM Core + DB Logging

**id:** `6-1`  
**Owner:** Devon  
**Priority:** Critical  
**Depends On:** 5-3, 6-0

### 6-1 Overview

Goal: Implement the core AgentFSM (OBSERVE–THINK–ACT–WAIT–VERIFY–COMPLETE–ERROR) and log its transitions to the database.

### 6-1 Integration Requirements
- **DB:** New table `agent_fsm_log` with columns: `id`, `subtask_id`, `agent`, `from_state`, `to_state`, `timestamp`.
- **Backend:** AgentFSM and AgentExecutor write a row per state change.
- **API:** Endpoint `/api/agent-fsm-log/:subtaskId` returns logs.
- **UI:** SystemLogPanel displays these logs when viewing a subtask.

### 6-1 Human check
1. Trigger an agent task for a known subtask ID (e.g., `5-9`).
2. Use a DB viewer or simple script to run:  
   `SELECT * FROM agent_fsm_log WHERE subtask_id = '5-9';`
3. You should see multiple rows, each representing a state change.
4. In the UI System Panel, you should see corresponding state-change messages (e.g., "Orion: OBSERVE → THINK").

---

## 3. Task 6-2: AgentExecutor Integration + JSON Schema Enforcement

**id:** `6-2`  
**Owner:** Devon  
**Priority:** Critical  
**Depends On:** 6-1

### 6-2 Overview

Goal: Replace the old while-loop in AgentExecutor with the FSM and enforce a strict JSON schema for LLM outputs `{thought, action}`.

### 6-2 Integration Requirements
- **Backend:**
  - AgentExecutor uses AgentFSM for all runs.
  - TacticalAdapter enforces JSON schema:
    ```json
    {
      "thought": "...",
      "action": { "tool": "FileSystemTool", "params": {"path": "..."} }
    }
    ```
- **DB:** Extend `agent_fsm_log` to include a `metadata` column for storing last action summary.
- **UI:** SystemLogPanel shows a readable summary per THINK/ACT step (e.g., "Thinking: plan next edit"; "Acting: FileSystemTool.read on src/App.vue").

### 6-2 Human check
1. Trigger a non-trivial agent task (e.g., "Update the header text in App.vue").
2. Watch SystemLogPanel:
   - You should see messages like "Thinking: ..." and "Acting: FileSystemTool.read(...)".
3. Trigger a deliberately confusing request (e.g., nonsense text) and ensure:
   - The agent either refuses with a clear error or asks for clarification.
   - You do **not** see random tool calls with nonsense parameters.

---

## 4. Task 6-3: BodyInterface Core (Tools Wrapper)

**id:** `6-3`  
**Owner:** Devon  
**Priority:** High  
**Depends On:** 5-1, 5-6, 6-2

### 6-3 Overview

Goal: Introduce `BodyInterface` as the central gateway for all tool executions, with uniform pre/post processing and error handling.

### 6-3 Integration Requirements
- **Backend:**
  - `BodyInterface.executeTool(toolName, action, params, options)` is used by AgentExecutor.
  - Logs each tool call (tool, params summary, success/failure) to a `tool_execution_log` table.
- **DB:** `tool_execution_log` with columns: `id`, `tool`, `action`, `params_summary`, `success`, `error_message`, `timestamp`.
- **API:** `/api/tool-executions/:subtaskId` returns recent tool calls.
- **UI:** SystemLogPanel shows a simplified feed of tool calls.

### 6-3 Human check
1. Trigger a task that involves file operations and git commands.
2. In SystemLogPanel, you should see entries like:
   - "FileSystemTool.read: src/App.vue – success"
   - "GitTool.status – success"
3. If a tool fails (e.g., git not installed), you should see a clear error message that names the tool and the problem.

---

## 5. Task 6-4: Shell Output Streaming & Structured Errors

**id:** `6-4`  
**Owner:** Devon  
**Priority:** High  
**Depends On:** 6-3, 6-0

### 6-4 Overview

Goal: Provide real-time streaming of ShellTool output into the SystemLogPanel, with structured error summaries.

### 6-4 Integration Requirements
- **Backend:**
  - `StreamingAdapter` wraps ShellTool and emits `shell_output` events.
  - `errorFormatter` converts stderr into `{type, summary, details, hints}`.
- **DB:** Optionally store summarized errors in `tool_execution_log`.
- **UI:**
  - SystemLogPanel shows streaming output lines during long-running commands.
  - On failure, a short summary appears at the top with expandable details.

### 6-4 Human check
1. Ask the agent to run `npm test` (backend or frontend).
2. Watch the System Log:
   - You should see lines of output scrolling as tests run.
   - If tests fail, you should see a short summary (e.g., "3 tests failed in backend"), plus detailed log lines.

---

## 6. Task 6-5: Proprioception & Context Wiring (First Slice)

**id:** `6-5`  
**Owner:** Devon  
**Priority:** Medium  
**Depends On:** 5-11, 6-3

### 6-5 Overview

Goal: Connect the Body’s runtime state (current working directory, active files, recent commands) into the existing Project Context API so Orion can speak about "where we are" and "what changed".

### 6-5 Integration Requirements
- **Backend:**
  - `ProprioceptionService` tracks `cwd`, last N files touched, last N commands.
  - Project Context API (`/api/projects/:id/context`) includes a `proprioception` section.
- **DB:** Store proprioception snapshots in a small table `proprioception_state` keyed by project.
- **UI:** A context sidebar or panel (could be part of System Panel) shows current cwd and recent files.

### 6-5 Human check
1. Run a few tasks that edit different files.
2. Call `/api/projects/:id/context` (or use a simple UI view) and check the `proprioception` section:
   - It should list the current working directory and recent files touched.
3. Ask Orion a question like: "What files have we been working on for this task?"  
   - The answer should reference the same files shown in the context/proprioception view.

---

## 7. Phase 6 v2.2 Summary

In v2.2, Phase 6 is driven by these integration-focused tasks:

- **6-0**: UI/WebSocket foundation with 3 panels (Chat, System Log, Activity)
- **6-1**: AgentFSM core + DB logging
- **6-2**: AgentExecutor + JSON schema enforcement (OBSERVE–THINK–ACT–WAIT)
- **6-3**: BodyInterface core with tool execution logging
- **6-4**: Shell output streaming + structured error reporting
- **6-5**: Proprioception wired into Project Context API

Each task includes:
- DB changes (where appropriate)
- Backend logic
- API endpoints
- UI surfaces
- **Concrete human verification flows** you can follow without reading code.

Existing `6-12` (Function Calling API Support) remains valid and can be treated as completed or parallel work, since it primarily enhances how tools are selected rather than the integration pipeline.
