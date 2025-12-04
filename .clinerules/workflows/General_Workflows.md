# Cline Workflows — TDD + Git Branching/PR Policy

Version: 1.2
Owner: Orion (Orchestrator)
Status: Adopted

This document defines the workflows the assistants must follow when implementing subtasks in this repository.

---

## 1) TDD Workflow (per subtask)
Use this canonical loop for every subtask:

1. **Test (Tara)**: Write failing unit tests (scope: module/composable/service).
   - **Sad Path Mandate**: Must include at least one error/failure case (e.g., 500 error, invalid input).
2. **Implement (Devon)**: Implement to green (minimal code to satisfy tests).
3. **Refactor (Devon)**: Review code for clarity/duplication/structure. Improve implementation *without* breaking tests.
   - **Mandatory Step**: Even if "production ready", pause to evaluate structure.
4. **Integration (Tara)**: Write failing integration tests (scope: endpoint/flow).
5. **Implement (Devon)**: Adjust implementation to pass integration tests.
6. **Coverage Check (Tara)**: Ensure new code has ~80% coverage.
7. **Final Verification (Tara)**: Run the *full suite* in a clean environment to ensure no regressions.
   - **Gate**: If this fails, return to step 2/3. Do not proceed to PR.

### UI-First TDD Variant (Visual Progress)
For tasks where visual feedback is priority:
1.  **Build UI First**: Create the Vue component using hardcoded/mock data.
2.  **Verify Visually**: Check it in the browser.
3.  **Component Tests**: Write tests asserting the UI renders the mock data correctly.
4.  **Backend TDD**: Build the real API using the standard TDD loop above.
5.  **Integrate**: Replace mocks with real API calls.

### Execution checklist to include in PRs:
- [ ] Failing unit tests written (including Sad Path)
- [ ] Unit tests green
- [ ] Refactor step completed (Devon)
- [ ] Failing integration tests written
- [ ] Integration tests green
- [ ] Final Verification run (Tara) - Full suite green
- [ ] Coverage check (Tara) (≥80%)

References:
- Templates: .template/Implementation_Requirements_Template_Tester.md, .template/Implementation_Requirements_Template_Developer.md
- Naming: .template/Implementation_Requirements_Naming_Conventions.md

---

## 2) Git Discipline & Branching (per subtask)
The rule is: one subtask → one branch → one PR → merge to main.

Branch naming:
- `<subtask-id>-<slug>` (examples: `2-1-2-orion-chat-endpoint`, `2-1-3-ui-backend-integration`).

Commit rules:
- Keep commits atomic, use conventional commit messages, e.g.:
  - `feat(orion-chat): add /api/orion/chat endpoint with validation`
  - `test(orion-chat): add integration tests for 429/503`
  - `fix(orion-chat): correct history schema validation`
- Include subtask id in the body if helpful (links welcome).

PR rules:
- Open a PR from the subtask branch to `main` when the subtask checklist is green.
- PR description must link to:
  - The Tester/Developer Implementation Requirements for the subtask
  - Related task(s) in `.tasks/`
- CI must pass; at least one review (human) required before merge.
- Do not mix multiple subtasks in one PR.
- **Merge Authority**: Only the Architect/Orchestrator may merge PRs to `main`.

Main branch:
- Treated as protected; only merged via PR by Architect.
- Developers/Testers must NEVER commit directly to `main`.

Definition of Done (per subtask):
- Tests (unit + integration) passing; optional E2E if specified
- Code reviewed and PR merged to `main`
- Activity/notes updated where applicable (e.g., `.tasks` status)
- **Status → Completed**: Once marked completed, the task is immutable. New requirements = New Task (see `.clinerules/clineRules.md`).

---

## 3) Controls Alignment (Plan/Act + Approve/Reject)
- Plan mode: agents may analyze, plan, and converse (no file writes).
- Act mode: agents may implement changes and write files.
- Approve/Reject gates: larger or risky changes must be approved and merged via PR to main.
- Stop control: long-running operations must respect stop/cancel tokens.

---

## 4) Where to put artifacts
- Subtasks: `.tasks/Task2-1_Orion_Chat_Interface_Subtasks.md` (and future task lists)
- Implementation Requirements: `/Implementation/<subtask-id>-Implementation_Requirements_*.md`
- Roadmaps/Architecture: `/Docs/NewAgent/*`, `/Docs/Development/*`

---

## 5) Quickstart for a new subtask
1) Create branch: `git checkout -b <subtask-id>-<slug>`
2) Write tests → implement → refactor → iterate to green (see TDD loop)
3) Commit changes with conventional messages
4) Push and open PR; link Implementation Requirements
5) Ensure CI passes; request review; merge to `main`

---

## 6) References & Rules
- **Static Rules (Naming, Roles, Shell)**: See `.clinerules/clineRules.md`.
- **Branching Policy**: See `.clinerules/workflows/Branching_and_PR_Policy.md`.
- **Test Workflow**: See `.clinerules/workflows/Test_Workflows.md`.
