# CodeMaestro MVP — Consolidated Specification

Version: 2.1 (Consolidated + XState)
Owner: Adam (Architect)
Status: Implementation-Ready
Timebox: 4–6 weeks

---

## 1. Vision & Objective

**CodeMaestro** is a multi-agent AI platform that automates full-stack software development. Ship a usable loop where:

- **Orion (Architect/Liaison)** converts human intent → FRD/PRD + concrete change plans
- **Tara (Tester)** generates/updates tests and runs them from the dashboard
- **Devon (Developer)** proposes/diff-applies code changes, guided by tests
- All actions are visible in a dashboard with **Plan/Act + Approve/Reject** controls
- Results in auditable git commits

**Tagline:** "Orchestrate AI, automate development, ship faster."

---

## 2. Scope

### In-Scope (MVP)
- Orion chat + FRD/PRD drafting in chat; save to Markdown on Act
- Tara test generation/update + test execution via backend API
- Devon deterministic code edits (scaffold/patch patterns) with changed-files view
- Plan/Act, Stop, Approve/Reject, activity log, and clean commit flow
- Single vertical slice: brief → plan → code + tests → test run → commit → activity log
- **XState Machine:** Core governance engine to enforce transitions and gates

### Out of Scope (MVP)
- Full multi-agent autonomy with human approvals
- Complex memory, knowledge retrieval, or enterprise RBAC
- Advanced dashboard visualizations (graphs, coverage dashboards)
- Self-optimization/learning loops
- Enterprise features (multi-tenant, SSO)

---

## 3. Architecture

### High-Level Stack

```
Frontend (Vue 3 SPA, Vite)
├─ Chat Panel (agent conversation)
├─ Activity Log (structured events)
├─ Status Panel (current step/result)
└─ Controls (Plan/Act, Stop, Approve/Reject)

Backend (Node.js / Express)
├─ Orchestrator Service (XState Machine) <-- CORE GOVERNANCE
├─ Project API (create/fetch)
├─ Planning API (brief → minimal plan)
├─ Generate API (code + tests)
├─ Test API (run Jest/Vitest)
├─ Git API (commit on approval)
└─ Activity API (poll/log stream)

Agent Integration (DeepSeek)
└─ Prompt templates (brief → plan, code hints, test hints)

Persistence (Currently YAML/Markdown → Future: PostgreSQL)
├─ Agents/manifest.yml — subtask status, branches, links
├─ Agents/logs/<id>.yml — detailed task state
└─ Projects/<projectId>/Docs — FRD/PRD storage

Git
└─ Local repo with branch-per-subtask workflow
```

### Agent Roles

| Agent | Responsibility | Scope |
|-------|---------------|-------|
| **Orion** | Architect/Liaison | Converts intent → FRD/PRD, coordinates workflow |
| **Tara** | Tester | Creates/updates tests, runs suites, flags flakiness |
| **Devon** | Developer | Implements code to satisfy tests, follows TDD |

### Role Boundaries
- Devon edits implementation code only (`src/**`, components, services, controllers)
- Tara edits test artifacts only (`__tests__/`, `*.spec.*`, `*.test.*`, fixtures, mocks)
- Orion coordinates but does NOT author code or tests
- One subtask → One branch → One PR

---

## 4. User Experience

### Single-Screen Dashboard Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ Top Bar: Project selector | New Project | State: [Planning] | Stop btn│
├───────────────────────┬───────────────────────────────────────────────┤
│ 1) Chat Panel         │ 2) Activity Log                               │
│  - Conversation       │  - Structured events with tags (plan/test/git)│
│  - Brief capture      │  - Filters: [All] [Plan] [Generate] [Test]    │
│  - Clarifications     │  - TraceId link (popover JSON)                │
├───────────────────────┴───────────────────────────────────────────────┤
│ 3) Status & Actions: Current Step | Last Result | Approve / Reject    │
└───────────────────────────────────────────────────────────────────────┘
```

### Core User Flows

**Flow A — New Project (Happy Path)**
1. User clicks "New Project"
2. Modal wizard: Name, one-line summary, "Generate scaffold"
3. Creates project and opens chat with system greeting
4. User sends brief; Orion replies with short plan preview
5. User approves plan (Transition: `APPROVE_PLAN` → `generating`)
6. Agent generates files (State: `generating`)
7. Agent runs tests (State: `testing`)
8. Tests pass → User Approve (Transition: `APPROVE_COMMIT` → `committing`)

**Flow B — Clarifications**
- Orion asks up to 3 clarifying questions (chips with quick answers)
- User answers; plan re-renders

**Flow C — Failure & Stop**
- Tests fail: State returns to `planning` or `generating` (retry)
- User clicks Stop: State transitions to `idle` or `stopped`

---

## 5. API Contracts

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/project` | Create project from brief |
| GET | `/api/project/:id` | Project details + latest run |
| POST | `/api/orion/chat` | Chat with Orion (message + history) |
| POST | `/api/control/transition` | Send event to XState machine (APPROVE, REJECT, STOP) |
| POST | `/api/plan` | Generate minimal plan from brief |
| POST | `/api/generate` | Produce scaffold files + tests |
| POST | `/api/test` | Run Jest/Vitest and return results |
| GET | `/api/activity/:projectId` | Recent activity events |

### Error Envelope

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "traceId": "uuid",
    "details": {}
  }
}
```

**Error Codes:** `VALIDATION_ERROR`, `CONTENT_FILTER_ERROR`, `RATE_LIMIT_ERROR`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`, `TEST_FAILED`, `GIT_ERROR`, `INVALID_TRANSITION`

---

## 6. Data Models

### XState Machine (Run Lifecycle)
*Core logic engine.*

```javascript
const runMachine = createMachine({
  id: 'run',
  initial: 'planning',
  states: {
    planning: {
      on: { APPROVE_PLAN: 'generating' }
    },
    generating: {
      on: { GENERATION_COMPLETE: 'testing' }
    },
    testing: {
      on: {
        TESTS_PASSED: 'awaiting_approval',
        TESTS_FAILED: 'planning' // or 'generating' for retry
      }
    },
    awaiting_approval: {
      on: {
        APPROVE_COMMIT: 'committing',
        REJECT: 'planning' // Rollback/Retry
      }
    },
    committing: {
      type: 'final'
    }
  }
});
```

### Activity Event
```yaml
projectId: string
runId: string
type: plan | generate | test | git | control | error
level: info | warn | error
message: "human-readable line"
payload: { ...context }
traceId: string
ts: ISO8601
```

### Subtask (manifest.yml)
```yaml
id: "2-2-8"
title: "Markdown Rendering"
status: pending | in_progress | ready-for-review | completed | blocked
branch: "2-2-8-markdown-rendering"
log: "Agents/logs/2-2-8.yml"
```

---

## 7. Milestones

### M1 — Orion Architect Chat (Week 1–1.5) ✅ COMPLETE
- `/api/orion/chat` with DeepSeek-backed `orionClient`
- FRD/PRD templates in chat, clarifications loop
- Activity events for requests/responses

### M2 — Orchestrator & State Machine (Week 2–2.5)
- **Implement XState service in backend**
- Plan mode: Orion plans/responds only
- Act mode: allowed to write FRD/PRD markdown
- Save to `Projects/<projectId>/Docs/`
- Activity log + run updates; Approve/Reject visible

### M3 — Tara (Tester) Services (Week 3–3.5)
- `/api/test/run` executes Jest + Vitest
- `/api/test/generate` proposes/updates tests
- Test results panel (status card + logs)

### M4 — Devon (Developer) Code Edits (Week 4–4.5)
- `/api/generate/changes` proposes deterministic diffs
- Changed-files panel + diff viewer
- Approve applies changes into workspace

### M5 — End-to-End Loop (Week 5–5.5)
- Full flow: Orion → FRD → PRD → Tara tests → Devon changes → tests green → commit
- Stop, rollback (Reject), and error flows validated
- Documented run with screenshots/logs and commit hash

### M6 — Polish, CI, Deploy (Week 5.5–6)
- CI for backend tests
- PM2 + build scripts
- README and troubleshooting
- A11y pass on critical UI

---

## 8. TDD Workflow

### Canonical Loop (per subtask)
1. Write failing unit tests (scope: module/composable/service)
2. Implement to green (minimal code to satisfy tests)
3. Refactor (cleanup without breaking tests)
4. Write integration tests (scope: endpoint/flow)
5. Implement/adjust to green
6. Coverage check (~80%)
7. Optional E2E smoke

### Execution Checklist (for PRs)
- [ ] Failing unit tests written (including Sad Path)
- [ ] Unit tests green
- [ ] Refactor step completed
- [ ] Failing integration tests written
- [ ] Integration tests green
- [ ] Coverage check (≥80%)
- [ ] (Optional) E2E scenario run

### Test Locations
- **Backend (Jest):** `backend/__tests__/unit/**`, `backend/__tests__/integration/**`
- **Frontend (Vitest):** `frontend/src/__tests__/**`

---

## 9. Git & Branching

### Branch Naming
- `<subtaskId>-<slug>` (e.g., `2-2-8-markdown-rendering`)

### Commit Messages
- Conventional commits: `feat(scope): description`, `test(scope): description`, `fix(scope): description`
- Include subtask ID in body if helpful

### PR Rules
- One subtask → One branch → One PR
- PR description links to:
  - Subtask log (`Agents/logs/<id>.yml`)
  - Implementation Requirements (if applicable)
- CI must pass
- Devon checks developer items; Tara checks tester items
- Only Orchestrator merges to `main`

### Definition of Done (per subtask)
- PR includes prChecklist (Dev + Tester) and links to SSOTs
- verificationChecklist items checked in log
- Both test suites green (CI + local)
- prChecklistStatus: developer=complete, tester=complete, orchestrator=verified
- Status advanced and merged to main

---

## 10. FRD/PRD Output Templates

### FRD (Functional Requirements Document)
1. Context & Goal
2. Objectives (3–6 bullets)
3. Scope (In/Out)
4. Users & Primary Flows
5. Requirements (numbered with acceptance criteria)
6. Non-Functional Requirements
7. Constraints & Assumptions
8. Open Questions
9. Risks

### PRD (Product Requirements Document)
1. Overview & Goals
2. Users, Personas & Flows
3. Feature Breakdown → Tasks/Subtasks
4. Data & State
5. API Contracts
6. UX Notes
7. Test Plan (TDD)
8. Non-Functional & Operational
9. Dependencies & Risks

---

## 11. Visual Design (Dark Theme)

### Design Principles
- Clean first, "futuristic/robotic" as flavor
- Dark-mode-first, legible on standard monitors
- Minimal glow, restrained gradients, crisp geometry
- Strong visual hierarchy, generous spacing

### Activity Tags
- PLAN (blue), GENERATE (purple), TEST (green), GIT (black), CONTROL (gray), ERROR (red)

### Typography
- Sans-serif for UI
- Monospace for logs/code samples

---

## 12. Environment & Config

### Required Environment Variables
```env
MONGO_URI=mongodb://...
DEEPSEEK_API_KEY=sk-...
GIT_REPO_PATH=/path/to/repo
API_KEY=optional-backend-key
```

### Security
- No secrets in code/logs
- CORS: allow dev frontend origin only
- Rate limiting on `/api/*`
- No secrets in client bundle

---

## 13. KPI Targets

- One end-to-end improvement to CodeMaestro per day after M5
- < 5 min median run time for small changes (excluding human review)
- < 5% rollback rate post-commit (with Approve gate)

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Agent hallucinations | Keep prompts short; deterministic examples; human approval required |
| Git environment failures | Validate repo path early; surface errors; allow retry |
| Test flakiness | Keep tests trivial and deterministic; CI seeds fixed |
| UI confusion | One page, labeled steps, link events to traceId |

---

## 15. Quick Reference

### Status Transitions
```
pending → in-progress → ready-for-review → completed
                ↓
              blocked (with escalation payload)
```

### File Locations
- **Manifest:** `Agents/manifest.yml`
- **Logs:** `Agents/logs/<id>.yml`
- **Rules:** `.clinerules/`
- **Projects:** `backend/Projects/<projectId>/`

### Commands
- Start subtask: Read manifest + log; derive checklist; proceed
- Prepare PR: Include links to SSOTs; paste prChecklist; ensure suites green
- Mark blocked: Attach payload (errors, attempts, env, proposed next step)
