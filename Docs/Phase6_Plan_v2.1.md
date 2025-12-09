# Phase 6 v2.1: Web-App Oriented Body & Process

**Status:** Planning (Supersedes Phase6_Plan_v2.0.md for priorities)
**Prerequisites:**
- Phase 5 tools working, acceptance tests passing
- 5-3 (AgentExecutor baseline), 5-6 (ShellTool), 5-10/5-11 (Stabilization + Project Context API)
- WebSocket server initialized (backend/src/socket)

**High-level Goal (Web App Focus):**
Make CodeMaestro feel like a reliable, debuggable web-based coding assistant by prioritizing:

1. **Strict OBSERVE–THINK–ACT–WAIT Loop with Frontend Integration**  
   Predictable agent behavior, visible to the user.

2. **Body Interface for Cross-Platform Reliability**  
   Consistent behavior on Windows/macOS/Linux; no “works on my machine”.

3. **Sensory Feedback for Development Workflows**  
   Stream backend tool output (tests, builds, git) into the UI.

Context & memories (project intelligence) then build on top of this foundation.

---

## 1. Architectural Pillars (v2.1)

### 1.1 Process First: Strict Loop + UI

**Why first:** For a web app, user trust hinges on predictable, visible behavior. Users must see:
- That the agent is in a clear phase (Observing, Thinking, Acting, Waiting)
- What step it is on, and when it is safe to intervene

**Core Loop:**
1. **OBSERVE** – Gather context (project, proprioception, last outputs)
2. **THINK** – LLM emits `{thought, action}` JSON
3. **ACT** – Execute via Body/Tools
4. **WAIT** – Capture results, verify, decide next step

**Frontend:** Visualize the loop in the dashboard (status badges, progress indicators), fed via WebSocket events.

### 1.2 Body for Cross-Platform Reliability

**Why second:** Once the loop is visible, it must be stable across OS.  
Focus: path normalization, consistent error handling, and basic tool health checks.

### 1.3 Sensory Feedback for Dev Workflows

**Why third:** With a stable loop + body, streaming backend output (tests, builds, git) gives huge UX and debugging wins:
- Test pass/fail counts
- Build errors/warnings
- Git status/conflict messages

### 1.4 Context & Memories (Layered On Top)

Phase 6’s original context API and Orion context loading remain important, but they leverage the Body/Process foundation:
- Proprioception (cwd, active files, recent commands) augments project context
- Memories can answer “What did we try last time?” based on Body events

---

## 2. Task Breakdown (v2.1)

### 6-6: Strict Agent Loop & Frontend Integration 🔄

**id:** `6-6`  
**Owner:** Devon  
**Priority:** Critical  
**Depends On:** 5-3 (AgentExecutor), 5-4 (Output Parsers), 5-11 (Context API)

**Overview:**
Refactor the agent loop into a clear OBSERVE–THINK–ACT–WAIT FSM and surface its state in the frontend.

#### 6-6-1: AgentFSM Design & Implementation
- **Location:** `backend/src/machines/AgentFSM.js`
- **States:** `OBSERVE`, `THINK`, `ACT`, `WAIT`, `VERIFY`, `COMPLETE`, `ERROR`.
- **Features:**
  - Deterministic transitions
  - Step budget enforcement
  - Separate strategies per agent type (Orion/Devon/Tara if needed)

**Acceptance Criteria:**
- Unit tests cover all transitions (including error/timeout paths)
- Pure FSM tests can run without tools/LLM (mocked actions)

#### 6-6-2: AgentExecutor Integration with FSM
- **Location:** `backend/src/services/AgentExecutor.js`
- **Changes:**
  - Replace while-loop with FSM-driven loop
  - OBSERVE: build context snapshot (task + recent outputs)
  - THINK: call TacticalAdapter with strict JSON instructions
  - ACT: delegate to tools (initially direct registry → tools; later via BodyInterface)
  - WAIT: collect results and prepare next OBSERVE

**Acceptance Criteria:**
- Existing AgentExecutor tests updated and passing
- New tests assert one or more full loop cycles (OBSERVE→THINK→ACT→WAIT→COMPLETE)

#### 6-6-3: JSON Schema & Prompt Enforcement
- **Location:** `backend/src/llm/TacticalAdapter.js` (or a helper)
- **Requirements:**
  - Responses must match:
    ```json
    {
      "thought": "...",
      "action": {
        "tool": "FileSystemTool",
        "params": {"path": "..."}
      }
    }
    ```
  - Validate and either retry or surface error if malformed.

**Acceptance Criteria:**
- Unit tests: malformed responses (missing `thought` or `action`) are detected
- At least one happy-path test: LLM JSON → parsed → executed action

#### 6-6-4: Frontend Loop Visualization
- **Location:**
  - `frontend/src/components/AgentStatus.vue` (new)
  - `frontend/src/views/TaskDashboard.vue` integration
- **Features:**
  - Show current FSM state (Observing, Thinking, Acting, Waiting, Verifying)
  - Progress indicator for step count and budget

**Acceptance Criteria:**
- Frontend tests: component renders correct labels for given FSM state
- Integration test: simulated WebSocket events change UI state

#### 6-6-5: WebSocket Events for Loop State
- **Location:** `backend/src/socket/index.js` + AgentExecutor
- **Events:**
  - `agent_state_change` with `{ agent, state, step, subtaskId }`

**Acceptance Criteria:**
- WebSocket tests: events are emitted per state transition
- Frontend receives and updates AgentStatus correctly

---

### 6-7: Body Interface & Cross-Platform Reliability ⚙️

**id:** `6-7`  
**Owner:** Devon  
**Priority:** High  
**Depends On:** 5-1 (Tool Registry), 5-6 (ShellTool), 5-11, 6-6

**Overview:**
Introduce a BodyInterface that standardizes tool execution and makes behavior consistent across OSs.

#### 6-7-1: BodyInterface Core
- **Location:** `backend/src/body/BodyInterface.js`
- **Responsibilities:**
  - `executeTool(toolName, action, params, options)`
  - Centralized pre-checks (role/tool permissions via registry)
  - Centralized error handling and logging
  - Return enriched result `{ success, data, cwd, touchedFiles, startedAt, finishedAt }`

**Acceptance Criteria:**
- Unit tests mocking tools confirm pre/post behavior
- AgentExecutor can switch to BodyInterface with minimal change

#### 6-7-2: Cross-Platform Path Normalization
- **Location:** `backend/src/utils/pathNormalizer.js`; used by FileSystemTool & BodyInterface
- **Responsibilities:**
  - Normalize Windows-style paths to internal format
  - Guard against `..` escapes

**Acceptance Criteria:**
- Tests cover Windows (e.g., `C:\Users\Lei\Coding\CM`) vs POSIX
- Previously failing Windows path tests (from 5-10/5-12) are green

#### 6-7-3: Tool Health Checks
- **Location:** `backend/src/body/ToolHealthService.js` (new)
- **Responsibilities:**
  - Check presence/versions of critical tools (git, node, npm)
  - Provide a health summary endpoint `/api/tools/health`

**Acceptance Criteria:**
- Unit tests simulate missing tools and degraded states
- Endpoint returns clear JSON the frontend can display (optional Phase 6 UI use)

---

### 6-8: Sensory Feedback & Network Telemetry 📡

**id:** `6-8`  
**Owner:** Devon  
**Priority:** High  
**Depends On:** 6-7, 6-6

**Overview:**
Stream backend activity (ShellTool, builds, tests, LLM calls, external APIs) to the UI in a structured, user-friendly way.

#### 6-8-1: ShellTool Output Streaming
- **Location:**
  - `backend/src/body/StreamingAdapter.js`
  - integration in ShellTool & BodyInterface
- **Responsibilities:**
  - Capture stdout+stderr from long-running commands (tests, builds)
  - Emit chunked WebSocket events `shell_output` with `{ command, chunk, isError, seq }`

**Acceptance Criteria:**
- Integration test: running a sample command results in multiple `shell_output` events
- Errors are clearly flagged (`isError: true`)

#### 6-8-2: Structured Error Display
- **Location:**
  - Backend formatting helper (e.g., `backend/src/utils/errorFormatter.js`)
  - Frontend components in Response Panel
- **Responsibilities:**
  - Parse common tool errors into more actionable messages (e.g., "git not found", "npm not found")
  - Map them to UI-friendly summary + raw detail view

**Acceptance Criteria:**
- Tests for mapping raw stderr to structured error objects
- UI shows both human-readable summary and expandable raw log

#### 6-8-3: Network I/O Telemetry
- **Location:**
  - `backend/src/body/TelemetryService.js`
  - hooks in TacticalAdapter, DB layer, and any external APIs
- **Responsibilities:**
  - Log latency and success/failure for:
    - LLM API calls (DeepSeek)
    - External services (GitHub, registries, etc.)
    - Database queries
  - Expose metrics via an internal API or logs for now

**Acceptance Criteria:**
- Tests ensure basic latency and status tracking works
- At least one dashboard-friendly JSON endpoint (for future UI)

---

### 6-9: Proprioception & Context Wiring 🧭 (Follows 6-6..6-8)

**id:** `6-9`  
**Owner:** Devon  
**Priority:** Medium  
**Depends On:** 5-11, 6-6, 6-7, 6-8

**Overview:**
Wire Body-derived state into the project context and memory subsystems so Orion can reason about "where we are" and "what we did".

(Structure mirrors 6-8 in v2.0, but scheduled after the top 3 web-app priorities.)

---

### 6-10: TDD & CI Hardening ✅

**id:** `6-10`  
**Owner:** Devon + Tara  
**Priority:** Medium  
**Depends On:** 6-6, 6-7, 6-8, 6-9

Same as v2.0: ensure robust test coverage and CI integration for all new components.

---

## 3. Updated Dependency / Priority View (v2.1)

Implementation priority for web app UX & reliability:

```text
5-3, 5-6, 5-11 foundations
   │
   ├── 6-6: Strict Agent Loop & Frontend Integration (highest)
   │      └── FSM, AgentExecutor, JSON schema, UI state, WS events
   │
   ├── 6-7: Body Interface & Cross-Platform Reliability (second)
   │      └── BodyInterface core, path normalization, tool health
   │
   ├── 6-8: Sensory Feedback & Network Telemetry (third)
   │      └── Shell output streaming, structured errors, telemetry
   │
   ├── 6-9: Proprioception & Context Wiring (after top 3)
   │
   └── 6-10: TDD & CI Hardening
```

---

## 4. Where Context & Memories Fit

- 6-6 gives you a disciplined loop and UI visibility.
- 6-7 ensures this loop behaves reliably across platforms.
- 6-8 adds the rich sensory data that makes logs and panels meaningful.
- **6-9 (later)** then connects this sensory/proprioceptive data to:
  - Project context (so Orion knows the current working set)
  - Long-term memories (so Orion recalls past attempts and decisions).

This sequencing keeps user-facing reliability and debuggability front-and-center while still converging on the original Phase 6 vision of context-aware, self-reflective agents.
