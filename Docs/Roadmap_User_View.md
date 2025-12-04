# CodeMaestro Development Roadmap (User View)

**Goal:** Build a system where you describe an app, and AI agents build it for you step-by-step.

---

## Phase 1: The "Control Panel" (Days 1–3)
**Objective:** Build the dashboard where you will sit and give orders. It won't "work" yet, but it will look real.

1.  **Visual Shell:** A dark-mode web page with 2 main panels + Header:
    *   **Header:** Project Dropdown (Context Switcher) + "New Project" button + **Plan/Act Safety Toggle**.
        *   *Detail:* The "Act" side is grayed out/locked until planning is complete.
    *   **Chat (Left):** Where you talk to Orion.
    *   **Activity Log (Right):** Where you see agents working ("Tara is testing...").
        *   *Detail:* Rows are clickable to show raw output (e.g., error messages).
    *   **Status (Bottom/Overlay):** A traffic light system (Planning, Working, Done).
2.  **Interaction:** You can switch "Projects" in the dropdown and see the name change.
3.  **Outcome:** A clean, spacious interface focused on the work.

## Phase 2: The "Engine Room" (Days 4–6)
**Objective:** Install the logic that makes the buttons work and defines the "Rules of the Road."

1.  **The Rulebook (XState):** We program the "Traffic Laws" into the backend.
    *   *Rule:* "Cannot switch to Act mode unless Plan is approved."
    *   *Rule:* "Cannot commit code if tests fail."
2.  **The Workers:** We set up the digital desks for Orion, Tara, and Devon.
    *   We verify they can talk to the system.
3.  **Outcome:** When you click "Start", the status light actually changes because the backend *logic* is now running.

## Phase 3: The "Brain" (Days 7–9)
**Objective:** Connect the Chat so Orion actually answers back and remembers what you said.

1.  **Project Setup:** You click "New Project", give it a name, and it saves.
2.  **Chat Connection:** You type "I want a trading app", and Orion replies "Okay, drafting requirements...".
3.  **Outcome:** A working chat interface that remembers your project details.

## Phase 4: The "Hands" (Days 10–12)
**Objective:** Give the agents the ability to write files on your computer.

1.  **File Writer:** When you say "Go", Orion generates the actual code files for a simple "Hello World" app.
2.  **Test Runner:** You see a green checkmark appear in the dashboard when the code works.
3.  **Outcome:** The system can build a *tiny* real app (like a blank webpage) and prove it works.

## Phase 5: The "Autopilot" Loop (Days 13–15)
**Objective:** Connect it all into the continuous loop you envisioned.

1.  **The Loop (Subtasks):**
    *   You: "Build the Login Page."
    *   Orion: "Okay, starting Subtask 1..."
    *   *Agents Cycle:* Code -> Test -> Code -> Test (Auto-saving progress).
2.  **The Gate (Task Completion):**
    *   Orion: "All subtasks done. Final tests Green. Ready to finish?"
    *   You: "Approve."
    *   *Orion executes final save (Git) and marks task Complete.*
3.  **Outcome:** The full "Cybernetic Factory" experience. You give orders, agents execute the messy work, you sign off on the result.

---

## Technical Reference (For Future)
*See `Docs/CodeMaestro_MVP_Consolidated.md` for the engineering details behind this.*
