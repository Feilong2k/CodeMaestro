# Beyond5 Roadmap v2.0 (Phase 6)

## Overview
This roadmap outlines the evolution of Orion’s architecture and capabilities beyond Phase 5, integrating the **Observe‑Think‑Act (OTA) pattern** with **Constraint Discovery Protocol (CDP)** to create a structured, reliable reasoning engine. Three sequential milestones:

1. **Two‑Tiered Consultative Brain with OTA/CDP Integration** – Replace split‑brain routing with a unified first‑level brain that uses prompt‑based observation to select thinking protocols (direct, basic OTA, CDP‑enhanced) and consults a second‑tier specialist for architectural decisions.
2. **Critical Tool Improvements & Enhanced UX** – Equip the first‑level brain with Cline‑grade tool‑calling fluency and a tabbed UI panel for real‑time reasoning visibility and document interaction.
3. **Body Awareness** – Implement system‑level health checks, monitoring, and resilience features.

Each milestone builds on the previous one, ensuring foundational changes are stable before adding complexity.

---

## Milestones

### Milestone 1: Two‑Tiered Brain Structure with OTA/CDP Integration (Weeks 1‑2)
**Goal**: Deliver a unified chat experience where Orion understands natural‑language requests, classifies them via a prompt‑based observation stage, selects an appropriate thinking protocol, and consults a specialist only when needed.

**Deliverables**:
1. `UnifiedAdapter` – A single LLM adapter using DeepSeek‑Chat (fast, cost‑effective) with function‑calling for all tools, **outputting JSON reasoning** (thoughts, actions, parameters) for full visibility.  
   *Second‑tier consultant*: DeepSeek‑Reasoner (or Gemini‑3/GPT‑4) for architectural analysis.
2. **Observation Stage (Prompt‑Based Classifier)** – A single‑LLM‑call observation phase that analyzes each request and outputs:
   ```json
   {
     "classification": "chat|question|request",
     "intent": "brief description",
     "confidence": 0.0-1.0,
     "action_required": true|false,
     "needs_analysis": true|false,
     "estimated_steps": 1-10,
     "protocol": "direct|basic_ota|cdp_enhanced",
     "reasoning": "brief explanation of decisions"
   }
   ```
   - **Protocol selection rule**:  
     - 0 steps → `direct` (greetings, simple questions)  
     - 1‑3 steps → `basic_ota` (simple actions, low risk)  
     - >3 steps → `cdp_enhanced` (multi‑step, medium/high risk)  
   - Safety override: if request contains high‑risk keywords (`delete`, `drop`, `format`) or touches production‑sensitive resources, escalate to at least `cdp_enhanced`.
3. **Structured Thinking Protocols** – Three thinking tiers:
   - **Direct**: No thinking; immediate response (e.g., “Hi Orion”).
   - **Basic OTA**: Standard Observe‑Think‑Act without formal CDP. The agent still reasons and checks assumptions implicitly.
   - **CDP‑Enhanced**: OTA with **CDP Level 0** – a structured 5‑assumption check, capability verification, constraint identification, and risk flagging (output as JSON). Used for >3‑step tasks or high‑risk operations.
4. **First‑Brain Prompt** – Comprehensive prompt with:
   - Identity & core instructions.
   - Project context (directory tree, key config files).
   - **Tool guide** – each tool described with when‑to‑use scenarios and concrete examples.
   - **Observation examples** – sample classifications and protocol selections.
   - **CDP Level 0 template** – structured format for assumption checks.
5. **Dynamic Context Sliding Window** – The adapter manages token usage by keeping static prompt parts (identity, tool definitions) and dynamically including only relevant file snippets and recent conversation turns. When the agent needs more context, it proactively uses `FileSystemTool.read`.
6. **Manifest‑Driven Consultation** – For requests classified as architectural design (complex, high‑risk), the first brain creates a **manifest** (updated schema with `escalation_reason` and `risk_assessment`). The manifest is sent to the `StrategicConsultant` for advisory analysis; the consultant returns a structured **advisory report** presented in the Orion’s Workspace tab.
7. **Updated `OrionAgent.chat`** – Removes tactical/strategic routing heuristics; uses the observation stage to select protocols, and integrates JSON‑reasoning‑enabled `UnifiedAdapter`. Keeps a local fast‑path router for explicit commands (`list docs`, `read Docs/…`) that match simple regex patterns.

**Fallback Strategy**:
- If the first‑brain model (DeepSeek‑Chat) is unavailable → fallback to GPT‑4o with a simplified prompt.
- If the strategic consultant is unavailable → the first brain runs a lightweight, rule‑based CDP using hard‑coded best practices (no second‑tier call).

**Acceptance Criteria**:
- User says “Hi Orion” → immediate greeting (direct protocol).
- User says “Save our chat to Docs folder” → observation classifies as request, 2 steps, basic OTA protocol; agent writes file successfully.
- User says “Refactor auth module to use JWT” → observation classifies as request, >3 steps, cdp_enhanced protocol; CDP Level 0 output shown in Workspace tab.
- User says “Delete node_modules and reinstall” → observation classifies as request, 2 steps but high‑risk keyword → cdp_enhanced protocol; CDP analysis includes safety warnings.
- System Log shows observation outputs, protocol selections, and JSON reasoning steps.

### Milestone 2: Critical Tool Improvements & Enhanced UX (Weeks 3‑4)
**Goal**: Equip the first‑level brain with the tools that make Cline/Cursor so effective, and provide a rich UI for observing and interacting with Orion’s thought process.

**Deliverables**:
1. **Enhanced FileSystemTool** – Add:
   - `search(path, pattern, fileType?)` – uses `ripgrep` (`rg`) under the hood with file‑type filtering (e.g., `--type ts,vue`).
   - `fileTree(path, depth?)` – get a tree view of the directory structure.
   - `editFile(path, changes)` – **search‑and‑replace blocks** or **unified diffs** (preferred over line‑number‑based edits). After any edit, the tool automatically runs a dry‑run lint/type‑check; if syntax errors occur, it reverts and returns the error to the agent.
2. **Project‑Awareness Tool** – Reads `package.json`, `tsconfig.json`, `.gitignore` etc. to inform the LLM about project structure and dependencies.
3. **Multi‑Step Session Tool** – Maintains a goal stack (queue of subtasks) and tracks progress within a conversation (enables “now update the CSS too” without re‑explaining).
4. **Frontend Tabbed Panel** – Extend the existing UI (likely `StatusBar.vue`) with three tabs:
   - **Activity Log** – Current activity stream (what Orion is doing), including streaming shell‑command output.
   - **System Log** – Existing WebSocket events (infrastructure, errors).
   - **Orion’s Workspace** – A two‑way communication panel where:
     - *Thought Process*: Live feed of Orion’s JSON reasoning, formatted as a collapsible tree.
     - *Document Viewer*: Orion can push Markdown, text, or HTML documents (e.g., CDP reports, manifests, architecture diagrams) and they are rendered here.
     - *User Interaction*: Users can expand/collapse sections, view documents, and provide feedback. Panels are resizable (using Vue’s `splitpanes` or CSS `resize`).
5. **New Tool `displayDocument`** – Allows Orion to send content to the Workspace tab (payload: `{ title, content, format }`).
6. **Enhanced Prompt** – Add layers for project‑awareness and multi‑step session guidance.
7. **Shell Output Streaming & Structured Errors (Task 6‑4)** – Stream shell‑command output in real time to the Activity Log and structure error messages for better debugging.
8. **Proprioception & Context Wiring (First Slice) (Task 6‑5)** – Wire internal agent states (OBSERVE/THINK/ACT) to the system log and health‑check service.

**Acceptance Criteria**:
- User can say “Find all uses of `useFocus` in the codebase” and Orion returns a list of files and lines (using the enhanced search).
- Orion knows the project is Vue 3 + TypeScript and tailors its suggestions accordingly.
- Complex refactors are handled as a single session with step‑by‑step progress tracked.
- The tabbed UI displays Orion’s real‑time reasoning and allows the user to view generated documents (e.g., a CDP report) inline.
- Shell‑command output streams live to the Activity Log.
- Agent state transitions are visible in the System Log.

### Milestone 3: Body Awareness (Weeks 5‑6)
**Goal**: Make Orion self‑monitoring and resilient.

**Deliverables**:
1. **Health‑Check Service** – Periodic validation of LLM API connectivity, database latency, disk space, and tool availability.
2. **System‑Log Dashboard** – Real‑time visualization of agent states, consultation calls, and constraint‑discovery findings (integrates with the new tabbed UI).
3. **Circuit‑Breaker Patterns** – Automatic fallback to mock modes or cached responses when external services are down.
   - First‑brain downtime → fallback to GPT‑4o (or another model).
   - Strategic‑consultant downtime → first brain runs rule‑based CDP.
4. **Performance Metrics** – Track response latency, tool‑call success rates, and consultation costs.
5. **Learning Loop for Protocol Selection** – Log observation outputs, protocol choices, and task success; adjust step‑count threshold and safety overrides based on real data.

**Acceptance Criteria**:
- Orion logs a warning when DeepSeek‑Reasoner API latency exceeds 5 s.
- The dashboard shows a live stream of state transitions (`OBSERVE` → `THINK` → `ACT`).
- If the strategic consultant is unavailable, consultations gracefully degrade to a local rule‑based checklist.
- Weekly report of API usage, error rates, and user satisfaction (via implicit signals).
- Protocol‑selection accuracy improves over time (e.g., fewer under‑protected high‑risk tasks).

---

## Key Design Decisions (Incorporated from Planning Discussions)

### 1. **Prompt‑Based Observation & Protocol Selection**
- No hard‑coded classification rules. A single LLM call classifies requests (chat/question/request), estimates step count, and selects a thinking protocol based on the >3‑step rule and safety overrides.
- Advantages: flexible, handles edge cases, explains decisions, easy to maintain (just update the prompt).

### 2. **Three‑Tier Thinking Protocols**
- **Direct**: for zero‑step interactions (greetings, simple questions).
- **Basic OTA**: for 1‑3‑step, low‑risk actions (implicit assumption checks).
- **CDP‑Enhanced**: for >3‑step or high‑risk tasks (structured CDP Level 0 audit).
- **Full CDP v3**: reserved for architectural design tasks (triggered via manifest consultation).

### 3. **CDP Level 0 as a Lightweight Safety Net**
- A structured 5‑assumption check, capability verification, constraint identification, and risk flagging.
- Applied automatically to multi‑step/high‑risk tasks; adds minimal overhead but catches common gotchas before execution.

### 4. **JSON Reasoning Output**
- Every thought, tool‑call decision, and parameter is output in a structured JSON array (`reasoning`), enabling full visibility into Orion’s cognitive process.
- This output is logged to the database and streamed to the frontend’s **Orion’s Workspace** tab.

### 5. **Manifest‑Driven Advisory Consultation**
- The first brain creates a manifest (not code) for complex architectural requests.
- The second brain returns an **advisory report** (not a boolean), presenting constraints, gaps, and conditions. The final decision stays with the human (or the first brain after user input).

### 6. **Tool‑Guide in Prompt**
- The prompt includes concrete examples of tool usage, each showing the thought process, the tool call, and the rationale. Examples are language‑agnostic and cover common scenarios (create file, read file, git status, run tests, ask clarification).

### 7. **Interactive UI Panel**
- The new **Orion’s Workspace** tab serves as Orion’s “mouth to the world”—it displays his thoughts, generated documents, and allows the user to inspect them without cluttering the chat window.

---

## Constraint Discovery Protocol Analysis (Full v4)
*Note: This section is carried forward from v1.0 and has not been updated per the user’s request to skip the CDP portion in this revision.*

[The original CDP analysis from v1.0 is included here verbatim for reference.]

---

## Implications & Trade‑offs

| Decision | Trade‑off | Long‑term Implication |
|----------|-----------|------------------------|
| **Prompt‑Based Observation** | Slight latency increase (one extra LLM call) vs. hard‑coded router. | More flexible, maintainable, and explainable classification. |
| **Three‑Tier Protocols** | More complexity in the thinking phase. | Better match of thinking depth to task complexity; efficient for simple tasks, thorough for complex ones. |
| **CDP Level 0 for Multi‑Step Tasks** | Extra token cost and time for structured audit. | Catches assumptions/constraints early, reduces rollbacks, builds user trust. |
| **JSON Reasoning Output** | Higher token consumption (cost) for outputting thoughts. | Essential for debugging agent behavior and user trust. |
| **Workspace UI** | Increased frontend complexity (Vue + WebSockets). | Moves product from “Chat” to “Platform”; enables multi‑modal interaction. |
| **Manifest Workflow** | Requires strict schema compliance from LLMs (can be flaky). | Standardizes architectural reviews; creates a paper trail for decisions. |
| **Edit‑Tool Safety Rails** | Extra validation steps increase tool‑call latency. | Prevents codebase corruption; reduces user frustration. |
| **Dynamic Context Sliding Window** | More tool calls to fetch additional context. | Keeps token costs manageable; mimics IDE‑like navigation. |

---

*Document generated by Adam (Architect) on 2025‑12‑10. Last updated: 2025‑12‑10 (v2.0).*
