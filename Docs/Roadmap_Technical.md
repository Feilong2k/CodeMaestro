# CodeMaestro Technical Roadmap

**Status:** Living Document aligned with `Agents/Subtasks/manifest.yml`

---

## Phase 4: Orchestration & Intelligence (The Brain)

This phase builds the autonomous "Manager" layer (Orion) that coordinates "Worker" agents.

| ID | Feature | Status | Tech Stack | Description |
| :--- | :--- | :--- | :--- | :--- |
| **4-1** | **Split-Brain Foundation** | ✅ Done | Node.js, Adapter Pattern | Infrastructure to route prompts to Gemini (Strategic) vs DeepSeek (Tactical). |
| **4-3** | **Routing Logic** | ✅ Done | Regex/Classification | Logic to analyze user intent and select the correct model/agent. |
| **4-4** | **Escalation Protocol** | ✅ Done | Event Bus | Rules for when a Tactical agent fails and needs Strategic help. |
| **4-5** | **Dynamic Workflows (Data)** | ✅ Done | PostgreSQL, JSONB | Schema (`workflows` table) to store State Machines instead of hardcoded rules. |
| **4-6** | **Workflow Engine** | ✅ Done | XState-lite | The execution engine that transitions states (Start -> Plan -> Code -> Review). |
| **4-9** | **Orchestrator Automation** | ✅ Done | Locking Service | **Critical:** Implements "Concern-Based Locking" to prevent agent conflicts. |
| **4-7** | **Persistent Memory** | ✅ Done | PostgreSQL, Vector | Long-term storage for User Preferences, Project Context, and "Reflexes". |
| **4-10** | **Workflow API & Viewer** | ✅ Done | Vue.js, Express | **UI:** Read-only view of active workflows and their current states. |
| **4-11** | **Context Pruning** | 🚧 Pending | Tokenizer, Summarization | **Optimization:** Smartly compressing chat history to save tokens/cost. |
| **4-12** | **Constraint Enforcement** | 🚧 Pending | "Phase Zero" Logic | **Safety:** Automated checks for physical constraints (Ports, Git Locks). |

---

## Phase 5: Autonomous Execution (The Hands)

This phase builds the `AgentExecutor` that allows LLMs to interact with the OS.

| ID | Feature | Status | Tech Stack | Description |
| :--- | :--- | :--- | :--- | :--- |
| **5-1** | **Tool Registry** | 📅 Next | JSON Schema | Defining valid tools (`fs.write`, `exec`, `git.commit`) for Agents. |
| **5-2** | **Agent Loop** | 📅 Planned | `while(true)` | The recursive loop: `Observation -> Thought -> Action -> Result`. |
| **5-3** | **Task Queue System** | 📅 Planned | Redis/PG | A persistent queue for "Fire and Forget" task assignment. |
| **5-4** | **Output Parsers** | 📅 Planned | Regex/AST | Robust parsing of LLM code blocks into file writes. |

---

## Phase 6: Ecosystem & Evolution

| ID | Feature | Status | Tech Stack | Description |
| :--- | :--- | :--- | :--- | :--- |
| **6-1** | **Maestro Studio** | 🔮 Future | Vue.js Builder | Drag-and-drop UI to create new Workflows. |
| **6-2** | **Self-Evolution** | 🔮 Future | Meta-Prompting | System analyzes failure logs and updates its own System Prompts. |
