# Phase 2: The "Brain" Task List

**Objective:** Build the backend orchestration layer — State Machine, Agent Services, Deepseek Integration, and real-time visibility.

**End State:** When Phase 2 is complete, you can assign a subtask and watch Orion → Tara → Devon execute the TDD workflow autonomously, with live updates in the Activity Log.

---

## Task 2-1: Backend Scaffold (Priority: High)
- [ ] **Setup:** Node.js + Express server in `/backend`
- [ ] **Structure:** Routes, services, middleware folders
- [ ] **Config:** Environment variables (.env), dotenv setup
- [ ] **Health Check:** `GET /api/health` returns `{ status: "ok" }`
- [ ] **Scripts:** `npm run dev` (nodemon), `npm run start`
- [ ] **Tests:** Jest setup for backend

## Task 2-2: PostgreSQL Database (Priority: High)
- [ ] **Connection:** pg driver + connection pool
- [ ] **Schema:** Tables for `subtasks`, `logs`, `agents`, `events`
- [ ] **Migrations:** Knex or raw SQL migrations
- [ ] **Seed Data:** Import existing YAML subtasks/logs
- [ ] **Queries:** Basic CRUD helpers

## Task 2-3: State Machine — XState (Priority: High)
- [ ] **States:** pending, in_progress, red, green, refactor, integration_red, integration_green, verification, completed, blocked, failed
- [ ] **Transitions:** Define all valid state changes
- [ ] **Guards:** Rules for each transition (e.g., "tests must exist before green")
- [ ] **Actions:** Side effects on transition (notify agent, log event)
- [ ] **Persistence:** Save state to DB on every transition
- [ ] **Service:** `OrchestratorService` wraps XState machine

## Task 2-4: Agent Framework (Priority: High)
- [ ] **Base Class:** `Agent` with `execute(context)` method
- [ ] **Prompt Loader:** Read from `.prompts/` folder
- [ ] **Context Builder:** Port `scripts/context.js` to service
- [ ] **Response Parser:** Extract actions from LLM output (file writes, status updates, questions)
- [ ] **Retry Logic:** Handle API failures gracefully

## Task 2-5: Deepseek Integration (Priority: High)
- [ ] **API Client:** `DeepseekClient` class
- [ ] **Model Adapter:** Abstract interface (swap for OpenAI/Anthropic later)
- [ ] **Config:** API key from env, model selection
- [ ] **Rate Limiting:** Respect API limits
- [ ] **Token Tracking:** Log usage per request
- [ ] **Error Handling:** Timeout, rate limit, auth errors

## Task 2-6: Orion Agent (Priority: Medium)
- [ ] **Role:** Orchestrator — assigns tasks, approves merges
- [ ] **Prompt:** Load from `.prompts/Orion_Orchestrator_v2.md`
- [ ] **Actions:** 
  - Assign subtask to Tara/Devon
  - Approve/reject PR
  - Escalate blockers
- [ ] **Integration:** Triggers state transitions

## Task 2-7: Tara Agent (Priority: Medium)
- [ ] **Role:** Tester — writes tests, verifies coverage
- [ ] **Prompt:** Load from `.prompts/Tara_Tester_v2.md`
- [ ] **Actions:**
  - Generate unit tests (Red phase)
  - Generate integration tests
  - Run coverage check
  - Report verification status
- [ ] **File Output:** Write test files to disk

## Task 2-8: Devon Agent (Priority: Medium)
- [ ] **Role:** Developer — implements code
- [ ] **Prompt:** Load from `.prompts/Devon_Developer_v2.md`
- [ ] **Actions:**
  - Implement code to pass tests (Green phase)
  - Refactor code
  - Fix failing tests
- [ ] **File Output:** Write implementation files to disk

## Task 2-9: WebSocket Events (Priority: Medium)
- [ ] **Setup:** Socket.io on backend
- [ ] **Events:** `state_change`, `agent_action`, `log_entry`, `error`
- [ ] **Broadcast:** Push events to all connected clients
- [ ] **Frontend:** Wire Activity Log to WebSocket feed
- [ ] **Status Bar:** Update traffic light based on events

## Task 2-10: REST API Endpoints (Priority: Medium)
- [ ] `GET /api/subtasks` — List all subtasks
- [ ] `GET /api/subtasks/:id` — Get subtask details + log
- [ ] `POST /api/subtasks/:id/start` — Trigger workflow for subtask
- [ ] `POST /api/subtasks/:id/approve` — Orion approves completion
- [ ] `GET /api/agents/status` — Current state of each agent
- [ ] `GET /api/events` — Recent event history

---

## Dependencies

```
2-1 (Backend) ────┬──► 2-2 (Database)
                  │
                  ├──► 2-3 (State Machine)
                  │
                  ├──► 2-4 (Agent Framework) ──► 2-5 (Deepseek)
                  │                                    │
                  │                                    ▼
                  │                              2-6, 2-7, 2-8 (Agents)
                  │
                  └──► 2-9 (WebSocket)

2-2 + 2-3 + 2-5 ──► 2-10 (REST API)
```

## Suggested Execution Order

1. **2-1** Backend Scaffold (unlocks everything)
2. **2-2** PostgreSQL (persistence)
3. **2-3** State Machine (core logic)
4. **2-4** Agent Framework (agent abstraction)
5. **2-5** Deepseek Integration (LLM calls)
6. **2-9** WebSocket (visibility)
7. **2-6, 2-7, 2-8** Agents (can parallelize)
8. **2-10** REST API (dashboard wiring)

---

## Success Criteria

- [ ] Backend runs with `npm run dev`
- [ ] State machine transitions logged to console
- [ ] Tara generates real tests via Deepseek
- [ ] Devon implements code via Deepseek
- [ ] Activity Log shows live events
- [ ] Status bar reflects system state
- [ ] Full TDD cycle completes autonomously for one subtask

