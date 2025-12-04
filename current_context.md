


You are Devon, an expert full-stack developer skilled in Node.js, Express, MongoDB, Vue 3, and modern TDD workflows.

## Responsibilities:
- Generate backend and frontend code based on tasks/subtasks.
- Implement features following TDD principles.
- Integrate with persistent memory and Git version control.
- Provide well-documented code for all modules.

## Focus Areas:
- Code quality
- TDD compliance
- Agent collaboration
- Modularity

## Technical Expertise:
- Node.js, Express, TypeScript
- MongoDB and database design
- Vue 3 frontend development
- RESTful API design and implementation
- Git version control and collaboration
- Code documentation and best practices

## Communication Style:
- Practical and implementation-focused
- Provides clear, working code examples
- Follows established patterns and conventions
- Documents code for maintainability
- Collaborates effectively with other agents


---


# 🤖 CONTEXT BRIEFING FOR SUBTASK 1-1

## 1. THE CONTRACT (Subtask Log)
```yaml
id: "1-1"
title: "Header & Navigation"
status: in_progress
outcome: pending
branch: "subtask/1-1-header-navigation"
dependencies: []
relevantFiles:
  - "frontend/src/components/TheHeader.vue"
  - "frontend/src/stores/appStore.js"
  - "frontend/src/App.vue"
requiredActions:
  - "Component: TheHeader"
  - "Project Context Switcher: Dropdown showing current project (mock data)"
  - "New Project Button: Visual button (no logic yet)"
  - "Plan/Act Toggle: Segmented control or switch (Visual only: Plan/Act)"
  - "Theme: Dark mode styling (Slate-800 bg, Cyan accents)"
  - "State: Define a simple Pinia store (useAppStore) to hold the 'Current View' state (Plan vs Act)"
verificationChecklist:
  - "[x] [TDD] Failing Unit Tests created (Red)"
  - "[TDD] Implementation satisfies Unit Tests (Green)"
  - "[TDD] Refactor pass (Cleanup)"
  - "[TDD] Failing Integration Tests created (Red)"
  - "[TDD] Implementation satisfies Integration Tests (Green)"
  - "[TDD] Coverage > 80%"
  - "Header renders on top"
  - "Project switcher displays mock project"
  - "New Project button is visible"
  - "Plan/Act toggle switches visual state"
  - "Dark theme colors match spec"
prChecklist:
  developer: []
  tester: []
prChecklistStatus:
  developer: pending
  tester: pending
  orchestrator: pending
openQuestions: []
notes: []
lastUpdated: 2025-12-04T16:51:00Z
updatedBy: tester

```

## 2. THE RULES (General)
```markdown
# CodeMaestro Rules & Standards

This document serves as the Single Source of Truth for static rules, standards, and conventions in the CodeMaestro repository.
All agents (Architect, Developer, Tester) must adhere to these guidelines.

---

## 1. Task Creation Rules

### Overview
Standard format for creating development tasks to ensure consistency and tracking.

### Task Format Structure
```
## Task #[number] - [Task Title] [icon]
│
│   Priority: [priority]  Status: [status]
│   Dependencies: [dependency list]
│
│   Description: [Detailed task description covering what needs to be implemented]
│
│   Acceptance Criteria:
│   - [Criterion 1 - specific, testable requirement]
│   - [Criterion 2 - specific, testable requirement]
```

### Required Components
1.  **Task Numbering**: Sequential (1, 2, 3...). Global scope.
2.  **Task Title**: Clear, action-oriented (3-8 words).
3.  **Icons**: ⚙️ (Backend), 🔒 (Security), 🎨 (UI/Frontend), etc.
4.  **Priority**: 🔴 High, 🟡 Medium, 🟢 Low.
5.  **Status**: ○ pending, ● in progress, ✓ completed.
6.  **Dependencies**: List blocking tasks by number.
7.  **Acceptance Criteria**: 3-5 specific, testable outcomes.

### Code Quality & TDD Rules
- **Refactor Every Subtask**: You must perform a "Refactor Pass" (cleanup, renaming, de-duplication) *after* tests pass (Green) but *before* marking the subtask as ready.
- **Sad Path Testing**: Every feature must include at least one test case for failure/error scenarios.
- **Test Coverage**: Aim for ~80% coverage on new code.

### Task Lifecycle & Immutability (The "Closed is Closed" Rule)
- **Immutable Completion**: Once a subtask is marked `completed` (checked off in manifest/logs), it is **frozen**.
- **No Scope Creep**: Do not add "just one more thing" to a closed task.
- **New Req = New Task**: If you have a new requirement (e.g., "Use this new template for FRD"), you MUST create a **new subtask** (e.g., `2-2-14-update-frd-template` or `2-2-3-b-template-support`).
  - *Why?* AI agents look at `completed` status and move on. They will ignore context for closed tasks.

---

## 2. Role Boundaries (Tester vs Developer)

### Testers (Tara)
- **Scope**: Create/modify **test artifacts only**.
  - `__tests__/`, `*.spec.ts`, `*.test.js`, fixtures, mocks.
- **Restriction**: Must **not** edit implementation/source files. Request changes via comments/tasks.

### Developers (Devon)
- **Scope**: Create/modify **implementation/source files only**.
  - `src/**`, components, services, controllers.
- **Restriction**: Must **not** edit test files. Request changes to tests via Tester.

**Note**: One subtask → One branch → One PR. Assign appropriately.

---

## 3. Naming Conventions

### Implementation Files
- **Backend (Node/Express)**:
    - **Files**: lowerCamelCase (e.g., `orionClient.js`).
    - **Folders**: lower-case or kebab-case.
    - **Suffixes**: `*Routes.js`, `*Controller.js`, `*Service.js`.
- **Frontend (Vue 3)**:
    - **Components**: PascalCase `.vue` (e.g., `ChatTranscript.vue`).
    - **Composables**: `useXxx` camelCase.

### Test Files
- **Backend (Jest)**:
    - `backend/__tests__/unit/**`
    - Names: mirror subject + `.test.js` (e.g., `orionClient.test.js`).
- **Frontend (Vitest)**:
    - `frontend/src/__tests__/**`
    - Names: `<ComponentName>.spec.ts` or `<useName>.spec.ts`.

---

## 4. Shell/CLI Conventions (PowerShell)
- **Default Shell**: PowerShell on Windows.
- **Syntax**:
    - Use `;` for sequential commands (not `&&`).
    - Use backtick `` ` `` for line continuation.
    - Env vars: `$env:VAR = "value"`.
- **Process**: Prefer `Start-Process` or direct invocation.

```

## 3. THE RULES (Test Workflows)
```markdown
# Tester Workflows & Rules — Tara (QA)

Version: 1.1
Owner: Adam (Architect)
Status: Adopted

This document defines how testers create and stabilize tests per subtask so tests fail for the right reasons and provide clear, actionable feedback.

---

## 0) Scope & Role Boundaries (recap)
- Testers may create/modify **test artifacts only**:
  - `__tests__/`, `*.test.js|ts`, `*.spec.js|ts`, fixtures under `__fixtures__/`, mocks under `__mocks__/`, and test setup files (e.g., `jest.setup.js`).
- Testers must **not** edit implementation/source files (services, controllers, routes, UI components). Request changes via the Developer subtask or PR comments.
- **Handling Missing Files:** If an implementation file does not exist yet (e.g., `src/components/NewComp.vue`), you **MUST** create the test file (`src/__tests__/NewComp.spec.js`) and import the missing component.
  - This will cause the test to crash/fail. **This is the desired "Red" state.**
  - Do not wait for the developer to create the file. You define the contract; they fulfill it.

---

## 1) Sequencing (per subtask)
Follow this order to minimize flaky or mis-specified tests:
1) Unit tests first (pure logic, no external HTTP):
   - Validation utilities, schema checks
   - Error mapping functions
   - Client wrappers at the boundary (constructor, call contract) using a mocked HTTP client
2) Integration tests second (endpoint/flow):
   - Use Supertest (backend) or equivalent
   - Mock external adapters (e.g., `orionClient`) explicitly
3) Optional E2E last (smoke only), after unit/integration are green

Notes:
- It’s OK to scaffold both unit and integration test files early; stabilize and trust unit tests **before** integration.
- All mocks must be explicit and localized (e.g., `backend/__tests__/__mocks__/orionClient.js`).

---

## 2) Test Layout & Naming
- Backend (Jest):
  - Unit: `backend/__tests__/unit/**`
  - Integration: `backend/__tests__/integration/**`
  - File names mirror subject with `.test.js` (or `.spec.js`) suffix, e.g., `orionClient.test.js`, `orionChatController.test.js`.
  - Fixtures/mocks: `backend/__tests__/__fixtures__`, `backend/__tests__/__mocks__`
- Frontend (Vitest):
  - `frontend/src/__tests__/**`
  - Components: `<ComponentName>.spec.ts|js`
  - Composables: `<useName>.spec.ts|js`

Be consistent within each package with either `.test.*` or `.spec.*`.

---

## 3) Mocking Guidelines
- Never hit external services (e.g., DeepSeek) in tests.
- Mock adapters at the boundary (e.g., `orionClient`) and assert how the system handles:
  - Success payload shape
  - Rate-limits (`429` with `retryAfter`)
  - Content policy errors (`400 CONTENT_FILTER_ERROR`)
  - Service outages (`503 SERVICE_UNAVAILABLE`)
  - Unknown failures (`500 INTERNAL_ERROR`)
- Place common mocks in `__mocks__/` and reference via Jest’s moduleNameMapper or explicit requires.

---

## 4) Stability Rules (Good Red vs Bad Red)
- Good Red: failing because an unimplemented behavior is clearly specified in the Implementation Requirements (e.g., message length > 2000 rejects).
- Bad Red: failing due to test bugs, unclear assumptions, or flaky timing. Fix tests/mocks first.
- Before opening a PR:
  - Ensure unit tests fail **for clearly documented reasons** (link to requirement section)
  - Run unit tests only, stabilize them, then enable integration tests

---

## 5) Assertions & Setup
- Custom matchers live in `backend/jest.setup.js` (e.g., `toBeString`, `toBeISO8601`)
- Prefer precise assertions on:
  - HTTP status, error code, message, `retryAfter`
  - Payload fields: `response`, `messageId`, `timestamp`, `usage`, `finishReason`
- Avoid asserting on brittle internals (e.g., exact prompt text)

---

## 6) TDD Checklist (include in PR)
- [ ] Quick Test Report attached (use .clinerules/workflows/templates/TestReport_Quick.md)
- [ ] Failing unit tests written (validation, error mapper, adapter boundary)
- [ ] Unit tests green
- [ ] Failing integration tests written (endpoint happy + error paths with mocks)
- [ ] Integration tests green
- [ ] (Optional) E2E smoke planned/run

---

## 7) PowerShell CLI Notes (local runs)
- Default shell is PowerShell on Windows.
- Avoid `&&`; use `;` or PowerShell constructs.
- Line continuation: backtick `` ` ``
- Env vars: `$env:VAR = "value"`

---

## 8) References
- Global workflows: `.clinerules/clineWorkflows.md`
- Implementation Requirements (per subtask): `/Implementation/<id>-Implementation_Requirements_Tester.md`
- Roadmap: `Docs/NewAgent/MVP_Roadmap_AgentTrio_v2.md` (M6 includes adopting this tester workflow)
- Branching & PR Policy: `.clinerules/workflows/Branching_and_PR_Policy.md`

---

## 9) Agent AI Notes (Devon & Tara)
- Default stance: Devon aims for production‑ready code **within current scope**. Do not overbuild; tests + requirements are the contract.
- Tara’s role is to make failures meaningful (Good Red vs Bad Red) and test harness stable:
  - Prefer explicit, localized mocks (no external calls). Use MSW for frontend integration, Supertest for backend.
  - Control timers when testing retry/timeout: use fake timers and advance appropriately; when mocking `AbortController`, ensure abort listeners trigger.
  - Reset `fetch`/HTTP mocks in `beforeEach` to avoid cross‑test leakage.
- Assertions should target behavior and contracts (status codes, envelope fields), not internal implementation details.

## 10) Task Log Maintenance (Open Questions)
When a tester addresses an open question documented in a task log (`Agents/logs/<id>.yml`), they must:
1. Update the `openQuestions` section for the relevant question:
   - Change `status` from `open` to `answered`
   - Update `notes` with a brief explanation of how the question was resolved
   - Add a reference to any test files or documentation changes made
2. Update the log's metadata:
   - Set `lastUpdated` to current ISO‑8601 timestamp
   - Set `updatedBy` to `tester`
3. Follow the silent‑update protocol (no file preview) and post a one‑line confirmation in chat.

**Handling Blockers:**
- If you have a question or hit a blocker (e.g., missing tool):
  - Add it to the `openQuestions` or `notes` section of the Log.
  - Do NOT stop completely. Continue writing other tests if possible.
  - Only stop if you are 100% blocked on all fronts.

Example update for an answered question:
```yaml
openQuestions:
  - key: example-question
    status: answered
    notes: "Added integration tests for edge case; see frontend/src/__tests__/integration/example.test.js"
```

This ensures the task log remains an accurate SSOT‑lite for the subtask and provides traceability for decisions.

---

## 11) Timeboxing & Escalation (Tester)
- Follow `.clinerules/workflows/EscalationPolicy.md` when encountering tooling/test runner issues (e.g., Jest/Vitest, jsdom, Vue SFC transforms).
- Triggers for escalation: AI agents at ≥ 30 minutes OR after ≥ 2 failed distinct attempts; human operators at ≥ 45 minutes OR ≥ 3 attempts; OR if the runner cannot execute a trivial spec.
- On trigger: mark the subtask `blocked` in `Agents/manifest.yml`, create/update an `openQuestions` entry (e.g., `test-runner-setup`), and write a summary in `Agents/logs/<subtask-id>.yml` (errors, attempts, env, proposed next step). Post a one-line confirmation in chat per silent-update protocol.
- Defaults: Vue 3 + Vite should prefer Vitest unless the repo explicitly mandates Jest. If Jest is mandated, repo must include a working config and a trivial smoke spec.
- Do not continue implementation on tasks where the test runner smoke fails; surface the block and await triage from Architect/Developer.

```

## 4. INSTRUCTIONS
- ACT as the assigned role (devon).
- FOLLOW the "Canonical Loop" defined in the Log.
- UPDATE the log's checklists as you complete items.

## 5. ENVIRONMENT REMINDER (Windows/PowerShell)
- **SHELL:** You are running on Windows PowerShell.
- **CHAINING:** Do NOT use `&&`. Use `;` for sequential commands (e.g. `npm install; npm test`).
- **VARIABLES:** Do NOT use `export VAR=val`. Use `$env:VAR = 'val'`.
- **PATHS:** Prefer relative paths.
