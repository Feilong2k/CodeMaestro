# Phase 6: Self-Service & Context Intelligence

**Status:** Planning (Post Phase 5 Acceptance)
**Prerequisites:** Phase 5 tools working, acceptance tests passing
**Goal:** Enable Orion to understand and leverage project-specific context, and establish a "Body" and "Process" for autonomous execution.

---

## Architectural Pillars

### 1. The Body (Sensory & Motor Control)
To be truly autonomous, Orion needs a reliable "body" to interact with the world:
- **Motor Control (Tools):** Robust, cross-platform tools (Shell, FileSystem, Git) that don't fail on minor issues (like path separators).
- **Sensory Input (Feedback):** Streaming STDOUT/STDERR from shell commands back to the context in real-time.
- **Proprioception (State):** Awareness of current directory, active project, and modified files.

### 2. The Process (Thinking & Restriction)
We restrict CodeMaestro's behavior into a safe, predictable loop using FSMs and Strict Prompting:
- **The Loop:** OBSERVE -> THINK -> ACT -> WAIT -> REPEAT.
- **Restrictions:**
    - Strict JSON output (no loose text).
    - Mandatory verification steps after edits.
    - Finite State Machine (FSM) enforcement for workflow transitions.

---

## Subtasks

### 6-1: Project Context API
**Owner:** Devon
**Priority:** Critical

**Description:**
Create API endpoints for managing project-specific context in the memories table.

**Endpoints:**
```
GET  /api/projects/:id/context          - Get all context for project
GET  /api/projects/:id/context/:key     - Get specific context key
POST /api/projects/:id/context          - Save context (key/value in body)
DELETE /api/projects/:id/context/:key   - Delete context key
```

**Implementation:**
- File: `backend/src/routes/projectContext.js`
- Uses: `MemoryService.saveContext()`, `MemoryService.getContext()`

**Context Keys (Standard):**
```json
{
  "tech_stack": { "frontend": "Vue", "backend": "Node", "db": "PostgreSQL" },
  "conventions": { "naming": "camelCase", "testing": "TDD", "branching": "feature/*" },
  "team": { "architect": "Lei Wang", "agents": ["Orion", "Devon", "Tara"] },
  "preferences": { "verbosity": "low", "auto_commit": false }
}
```

**Tests:**
- [ ] GET returns 404 for non-existent project
- [ ] GET returns context object for valid project
- [ ] POST saves new context key
- [ ] POST updates existing context key
- [ ] DELETE removes context key

---

### 6-2: Orion Response Panel (Frontend)
**Owner:** Devon
**Priority:** High

**Description:**
Add a collapsible panel to the dashboard for displaying Orion's structured responses (The "Sensory" Interface).

**Location:** Right sidebar of chat view

**Features:**
- Collapsible/expandable
- Displays structured data (JSON, tables, trees)
- History of recent responses (stackable)
- Pin important responses
- Copy/export functionality

**Implementation:**
```
frontend/src/components/
├── ResponsePanel.vue        - Main panel container
├── ResponseStack.vue        - Stacked response history
├── ResponseItem.vue         - Individual response card
└── renderers/
    ├── JsonRenderer.vue     - JSON tree view
    ├── TableRenderer.vue    - Table display
    └── CodeRenderer.vue     - Syntax-highlighted code
```

**Response Types:**
| Type | Renderer | Example |
|------|----------|---------|
| `tool_list` | Tree | Tool registry listing |
| `file_content` | Code | File read results |
| `query_result` | Table | Database query results |
| `git_status` | Custom | Git status display |
| `error` | Alert | Error messages |

**Backend Response Format:**
```javascript
{
  chat_message: "Here are your tools. [View in Panel →]",
  panel_data: {
    id: "uuid",
    type: "tool_list",
    title: "Tool Registry",
    content: { ... },
    timestamp: "2025-12-08T...",
    pinnable: true
  }
}
```

**Tests:**
- [ ] Panel renders when panel_data present
- [ ] Panel collapses/expands
- [ ] History stacks correctly
- [ ] Pin functionality works
- [ ] Copy to clipboard works

---

### 6-3: Orion Context Loading (Proprioception)
**Owner:** Devon
**Priority:** High

**Description:**
When Orion starts working on a project, automatically load project context into memory so he knows "where" and "who" he is.

**Trigger:** Project switch or session start

**Implementation:**
- File: `backend/src/services/AgentContextLoader.js`

**Flow:**
```
1. User selects project OR session starts
2. AgentContextLoader.loadProjectContext(projectId)
3. Fetch from /api/projects/:id/context
4. Inject into Orion's system prompt or memory
5. Orion now "knows" the project
```

**Context Injection Format:**
```
[PROJECT CONTEXT]
Project: CodeMaestro
Tech Stack: Vue (frontend), Node/Express (backend), PostgreSQL (db)
Conventions: TDD, camelCase, feature branches
Your Role: Orchestrator - you plan, delegate, and verify
User Preferences: Direct communication, low verbosity, checklist-oriented
[END PROJECT CONTEXT]
```

**Tests:**
- [ ] Context loads on project switch
- [ ] Context appears in Orion's responses
- [ ] Missing context handled gracefully
- [ ] Context refreshes on update

---

### 6-4: Project Onboarding Flow
**Owner:** Devon
**Priority:** Medium

**Description:**
Add a guided flow for setting up project context when a new project is created.

**UI Flow:**
```
1. Create Project → "Would you like to set up project context?"
2. Tech Stack selector (checkboxes for common frameworks)
3. Team/Agent assignment
4. Conventions preferences
5. Save to project context
```

**Implementation:**
- File: `frontend/src/components/ProjectOnboarding.vue`
- Modal wizard with 4 steps

**Tests:**
- [ ] Wizard opens on new project
- [ ] All steps navigable
- [ ] Context saved on completion
- [ ] Skip option works

---

### 6-5: Context-Aware Suggestions
**Owner:** Devon
**Priority:** Low

**Description:**
Orion uses project context to provide smarter suggestions.

**Examples:**
- "This project uses Vue, shall I generate a Vue component?"
- "Your conventions say TDD - I'll create tests first."
- "Based on your tech stack, I recommend PostgreSQL for this."

**Implementation:**
- Enhance Orion's system prompt with context awareness
- Add context-checking in tool execution

**Tests:**
- [ ] Suggestions reference project tech stack
- [ ] Conventions are respected in generated code
- [ ] User preferences honored

---

## Dependency Graph

```
6-1 (Context API) ──┬── 6-3 (Context Loading)
                    │
                    └── 6-4 (Onboarding Flow) ── 6-5 (Smart Suggestions)

6-2 (Response Panel) ── Independent, can parallel with 6-1
```

---

## Acceptance Criteria

### Phase 6 Complete When:

- [ ] **6-1:** Project context API endpoints working
- [ ] **6-2:** Response panel displays structured data
- [ ] **6-3:** Orion loads context on project switch
- [ ] **6-4:** New projects can be onboarded with context
- [ ] **6-5:** Orion references context in responses

### Integration Test:
1. Create new project "Test-Phase6"
2. Complete onboarding wizard (set Vue + Node stack)
3. Switch to project
4. Ask Orion: "What tech stack does this project use?"
5. Orion responds with Vue + Node (from context)
6. Response appears in Response Panel

---

## Files to Create

| Path | Purpose |
|------|---------|
| `backend/src/routes/projectContext.js` | Context API routes |
| `backend/src/services/AgentContextLoader.js` | Context loading service |
| `frontend/src/components/ResponsePanel.vue` | Response panel |
| `frontend/src/components/ProjectOnboarding.vue` | Onboarding wizard |
| `Agents/Subtasks/Logs/6-1.yml` | Subtask log |
| `Agents/Subtasks/Logs/6-2.yml` | Subtask log |
| `Agents/Subtasks/Logs/6-3.yml` | Subtask log |
| `Agents/Subtasks/Logs/6-4.yml` | Subtask log |
| `Agents/Subtasks/Logs/6-5.yml` | Subtask log |

---

## Estimated Effort

| Subtask | Effort | Dependencies |
|---------|--------|--------------|
| 6-1 | 1 day | None |
| 6-2 | 2-3 days | None |
| 6-3 | 1 day | 6-1 |
| 6-4 | 1 day | 6-1 |
| 6-5 | 1 day | 6-3 |

**Total:** ~6-7 days

---

## Notes for CodeMaestro

When implementing this phase:
1. Start with 6-1 (API) and 6-2 (Panel) in parallel
2. Then 6-3 (Loading) which depends on 6-1
3. Then 6-4 (Onboarding) 
4. Finally 6-5 (Suggestions)

Use TDD: Create tests first, then implement.

Reference existing patterns:
- API routes: See `backend/src/routes/features.js`
- Services: See `backend/src/services/FeaturesService.js`
- Vue components: See `frontend/src/views/FeaturesView.vue`
