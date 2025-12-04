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
