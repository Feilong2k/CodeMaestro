# CodeMaestro Development Roadmap (User View)

**Goal:** Build a system where you describe an app, and AI agents build it for you step-by-step.

---

## Phase 1: The "Control Panel" (Completed)
**Objective:** Build the dashboard where you sit and give orders.
*   **Outcome:** A dark-mode dashboard with Chat, Activity Log, and Project Context switching.

## Phase 2: The "Engine Room" (Completed)
**Objective:** Install the logic that makes the system run safely.
*   **Outcome:** Backend logic (Node/Express) enforcing rules like "Cannot Act without a Plan."

## Phase 3: The "Split-Brain" (Completed)
**Objective:** Make the AI smarter and cost-effective.
*   **Outcome:**
    *   **Strategic Brain (Gemini):** Handles planning and complex logic.
    *   **Tactical Brain (DeepSeek/GPT):** Handles coding and fast tasks.

## Phase 4: The "Nervous System" (Current Focus)
**Objective:** Automate the coordination between agents so you don't have to micromanage.
*   **Dynamic Workflows:** The system follows "State Machines" (Rules of the Road) stored in the DB.
*   **Orchestrator Automation:** "Orion" automatically assigns tasks, locks files, and manages branches.
*   **Persistent Memory:** The system remembers your preferences and project context.
*   **Workflow Viewer:** A UI to visualize exactly what the agents are doing and where they are in the process.

## Phase 5: The "Hands" (Next Up)
**Objective:** Give the agents the ability to actually *do* the work autonomously.
*   **Tool Execution:** Agents can write files, run terminal commands, and execute Git commits.
*   **The Loop:** A continuous cycle of `Code -> Test -> Fix` that runs until the task is done.
*   **Task Queue:** A prioritized list of work that agents pull from automatically.

## Phase 6: The "Evolution" (Future)
**Objective:** The system improves itself.
*   **Self-Correction:** Agents analyze their own mistakes and update their prompt reflexes.
*   **Maestro Studio:** A visual editor for you to create new workflows and rules.
