# Tester Workflows & Rules — Tara (QA)

Version: 1.0
Owner: Adam (Architect)
Status: Adopted

This document defines how testers create and stabilize tests per subtask so tests fail for the right reasons and provide clear, actionable feedback.

---

## 0) Scope & Role Boundaries (recap)
- Testers may create/modify **test artifacts only**:
  - `__tests__/`, `*.test.js|ts`, `*.spec.js|ts`, fixtures under `__fixtures__/`, mocks under `__mocks__/`, and test setup files (e.g., `jest.setup.js`).
- Testers must **not** edit implementation/source files (services, controllers, routes, UI components). Request changes via the Developer subtask or PR comments.
- See also: `.clinerules/clineWorkflows.md` (Role Boundaries section).

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
