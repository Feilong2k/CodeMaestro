# Phase 4 Architecture: Self-Evolution & Advanced Capabilities

## 1. Vision
CodeMaestro transitions from a "Static Tool" (executing pre-defined prompts) to a "Dynamic System" (learning from execution and optimizing its own logic).

## 2. Core Components (MVP)

### 2.1 Pattern Library (The Memory)
*   **Role:** Long-term storage for solved problems, code snippets, and bug fixes.
*   **Storage Strategy:** PostgreSQL (Relational + JSONB).
*   **Retention Policy:** "Data is Gold".
    *   Global Patterns (`project_id: null`) persist forever.
    *   Project-Specific Patterns (`project_id: 123`) are archived (not deleted) when a project is removed.
*   **Data Structure:**
    *   `patterns` table:
        *   `id`: UUID
        *   `project_id`: UUID (Nullable)
        *   `type`: `snippet` | `bug_fix` | `architecture`
        *   `title`: String
        *   `problem`: Text (Nullable) - The error message or symptom.
        *   `solution`: Text (Not Null) - The fix or code snippet.
        *   `description`: Text (Context/Why)
        *   `metadata`: JSONB `{ language: "js", tags: ["auth", "vue"], framework: "express" }`
        *   `embedding`: vector(1536) (Reserved for future)
*   **Taxonomy:**
    *   **Dynamic:** Tags are not hardcoded. Agents propose tags; system consolidates them later.

### 2.2 Split-Brain Orchestration (The Brain)
*   **Role:** Optimizing cost and intelligence by routing tasks to the right model.
*   **Model Assignment (MVP Configuration):**
    *   **Orion Strategic (Brain):** `Gemini 1.5 Pro` (Planning, Architecture, Complex Debugging).
    *   **Orion Tactical (Ops):** `DeepSeek V3` (Git, Status Updates, Simple Routing).
    *   **Devon (Developer):** `DeepSeek V3` (Implementation).
    *   **Tara (Tester):** `DeepSeek R1 (Reasoner)` (Test Design & Edge Cases).
*   **Routing Hierarchy (Deterministic First):**
    1.  **Explicit Override:** User says "Plan this" -> Strategic. User says "Devon, run tests" -> Tactical.
    2.  **Task Type Rules (Source of Truth):**
        *   **Strategic (High Risk / Complexity):**
            *   **Architecture:** Design docs, system flow.
            *   **Data / Schema:** Migrations, SQL, Data Models.
            *   **Security / Auth:** Login, Permissions, Keys.
            *   **DevOps / Config:** Build tools, Docker, `package.json`.
            *   **Debugging:** Finding root causes (Level 2).
            *   **Review:** Auditing code quality.
        *   **Tactical (Low Risk / Execution):**
            *   **Implementation:** Writing functions/components (once planned).
            *   **UI / CSS:** Styling, Layout, Text.
            *   **Testing:** Writing unit/integration tests.
            *   **Refactoring:** Cleanup, renaming.
            *   **Docs:** Readme, comments.
        *   **Operations (Scripted):**
            *   Linting, Running Tests, Installing Packages.
*   **Escalation Protocol:**
    *   **Level 1 (Self-Correction):** Agent retries (Tactical).
    *   **Level 2 (Orchestrator):** Agent fails -> Orion reviews (Internal Knowledge/Strategic).
    *   **Level 3 (Research):** Orion/Agent searches the **Web** for external solutions.
    *   **Level 4 (Council):** Complex failure -> Multi-Agent Debate (Strategic).
    *   **Level 5 (Human):** User intervention required.

### 2.2.1 Decision Framework (Beyond Bugs)
This escalation ladder also applies to **Self-Improvement** and **Feature Proposals**:
*   **Tactical:** "I can optimize this loop." (Local scope).
*   **Strategic:** "I want to add a Security Scan step." (System scope).
*   **Research:** "Should we switch to Rust? Let me search benchmarks." (Validation).
*   **Council:** "Rewriting the Core Engine." (High Risk debate).

### 2.3 Dynamic Workflows (The Process)
*   **Role:** Moving "Rules" from hardcoded files (`.clinerules`) to a database/engine.
*   **Mechanism:**
    *   Workflows are stored as **JSON State Machines** in the DB (`workflows` table).
    *   **Structure:** XState-inspired JSON (States, Events, Guards).
        ```json
        {
          "name": "Standard TDD",
          "states": {
            "red": {
              "on": { "TEST_PASS": "green", "TEST_FAIL": "red" }
            }
          }
        }
        ```
        ```json
        {
          "name": "Standard TDD",
          "states": {
            "red": {
              "on": { "TEST_PASS": "green", "TEST_FAIL": "red" }
            }
          }
        }
        ```
*   **Key Logic:**
    *   **Strict Guards:** Transitions blocked if conditions (e.g. `test_result == PASS`) aren't met.
    *   **Edge Case Handling:**
        *   **False Red:** If tests pass initially -> Reject/Warn.
        *   **Bad Red:** If implementation fails due to bad test -> Agent triggers `APPEAL` -> Strategic Review.

## 3. Integration & Data Flow

### Scenario: "Fix a Bug"

1.  **User Request:** "Fix the import error in project.js."
2.  **Split-Brain Router:**
    *   Analyzes request -> Classifies as "Debugging" -> Routes to **Strategic Orion**.
3.  **Strategic Orion:**
    *   **Action:** Calls `search_patterns("import error pinia")`.
    *   **Pattern Library:** Returns "Fix: Use named import vs default import".
    *   **Planning:** Creates plan based on pattern.
    *   **Delegation:** Assigns "Implementation" to **Tactical Devon**.
4.  **Tactical Devon:**
    *   Executes the fix.
    *   Runs tests.
5.  **Completion:**
    *   Orion logs result.
    *   If successful, updates Pattern usage count.

## 4. Technical Stack Updates

*   **Database:** `patterns` table, `workflows` table.
*   **Backend API:** `/api/patterns`, `/api/router`.
*   **Agent Tools:** `search_knowledge_base`, `save_knowledge`, `get_workflow_steps`.

## 5. Implementation Roadmap (Hybrid)

1.  **4-0:** Architecture Definition (This Doc).
2.  **4-1:** Pattern Library (Build the Memory).
3.  **4-2:** Split-Brain Logic (Build the Decision Tree).
4.  **4-3:** Dynamic Workflows (Build the Engine).

