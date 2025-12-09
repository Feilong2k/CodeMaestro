# Phase 6: Self-Service & Context Intelligence

**Status:** Planning (Post Phase 5 Acceptance)
**Prerequisites:** Phase 5 tools working, acceptance tests passing
**Goal:** Enable Orion to understand and leverage project-specific context

---

## Overview

Phase 6 focuses on making CodeMaestro **context-aware**. Currently, Orion has tools but lacks deep understanding of individual projects. This phase adds:

1. **Project Context API** - Load/save project-specific settings
2. **Orion Response Panel** - Better UX for structured outputs
3. **Context Loading** - Orion auto-loads project context on switch

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
Add a collapsible panel to the dashboard for displaying Orion's structured responses.

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

### 6-3: Orion Context Loading
**Owner:** Devon
**Priority:** High

**Description:**
When Orion starts working on a project, automatically load project context into memory.

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

### 6-6: Automatic Pattern Harvesting
**Owner:** Devon
**Priority:** Medium

**Description:**
Automatically detect and save reusable patterns discovered during development.

**Trigger:** Agent debrief phase after task completion

**Flow:**
```
1. Agent completes a task
2. Debrief phase: "Did we learn anything reusable?"
3. Agent proposes pattern: { title, problem, solution, tags }
4. Orion reviews and approves/rejects
5. If approved → POST /api/patterns
6. Pattern Library updated automatically
```

**Implementation:**
- File: `backend/src/services/PatternHarvester.js`
- Methods:
  - `detectPattern(taskResult)` - Analyze task for reusable patterns
  - `proposePattern(pattern)` - Create pattern proposal
  - `approvePattern(patternId)` - Orion approves pattern

**Pattern Detection Heuristics:**
- Code that solves a recurring problem
- Workarounds for LLM limitations (like XML escaping)
- Error handling patterns
- Common utility functions

**Tests:**
- [ ] Pattern detected from task result
- [ ] Pattern proposal created with correct format
- [ ] Orion approval triggers save
- [ ] Pattern appears in Pattern Library

**Note:** First pattern to add: "XML Entity Escaping" from subtask 5-4 (see Pending Patterns below)

---

### 6-7: Integration & E2E Test Suite
**Owner:** Tara
**Priority:** High

**Description:**
Add integration tests that verify the full stack (Frontend → API → Service → DB) works together.

**Why Needed:**
Unit tests mock dependencies and don't catch:
- Route registration issues
- Database connection problems
- API response format mismatches
- CORS configuration errors

**Test Types:**

**A. Integration Tests (Backend)**
```
backend/src/__tests__/integration/
├── projects.integration.test.js    - Projects API with real DB
├── patterns.integration.test.js    - Patterns API with real DB
├── tasks.integration.test.js       - Tasks API with real DB
└── features.integration.test.js    - Features API with real DB
```

**B. E2E Tests (Full Stack)**
```
e2e/
├── dashboard.spec.js       - Dashboard loads, shows data
├── patterns.spec.js        - Create/view patterns
├── projects.spec.js        - Project CRUD flow
└── workflows.spec.js       - Workflow visualization
```

**Implementation:**
- Integration: Jest + Supertest + Real PostgreSQL (test DB)
- E2E: Playwright (browser automation)

**Setup:**
```bash
# Test database
DATABASE_URL_TEST=postgresql://localhost/codemaestro_test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

**Tests:**
- [ ] Integration tests connect to real test DB
- [ ] All API endpoints return expected status codes
- [ ] E2E tests run in CI/CD pipeline
- [ ] Test coverage includes happy path + error cases

---

### 6-8: API Contract Tests
**Owner:** Tara
**Priority:** Medium

**Description:**
Ensure Frontend and Backend agree on API request/response formats.

**Problem Solved:**
| Frontend Expects | Backend Returns | Result |
|------------------|-----------------|--------|
| `{ data: [...] }` | `[...]` | 💥 Crash |
| `{ id: 123 }` | `{ _id: 123 }` | 💥 Undefined |
| `createdAt` | `created_at` | 💥 Missing field |

**Implementation:**

**A. Define Contracts (Shared)**
```javascript
// shared/contracts/projects.contract.js
module.exports = {
  'GET /api/projects': {
    response: {
      status: 200,
      body: {
        type: 'array',
        items: {
          required: ['id', 'name', 'status'],
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            status: { enum: ['active', 'deleted'] }
          }
        }
      }
    }
  },
  'POST /api/projects': {
    request: {
      body: { required: ['name'] }
    },
    response: {
      status: 201,
      body: { required: ['id', 'name'] }
    }
  }
};
```

**B. Backend Contract Tests**
```javascript
// backend/src/__tests__/contract/projects.contract.test.js
const contract = require('shared/contracts/projects.contract');

test('GET /api/projects matches contract', async () => {
  const res = await request(app).get('/api/projects');
  expect(res.status).toBe(contract['GET /api/projects'].response.status);
  expect(res.body).toMatchSchema(contract['GET /api/projects'].response.body);
});
```

**C. Frontend Contract Validation**
```javascript
// frontend/src/api/client.js
import { validateResponse } from 'shared/contracts/validator';

async function get(endpoint) {
  const response = await axios.get(endpoint);
  if (process.env.NODE_ENV === 'development') {
    validateResponse(endpoint, response); // Throws if mismatch
  }
  return response;
}
```

**Tools:**
- JSON Schema validation (ajv)
- Or Pact for consumer-driven contracts

**Tests:**
- [ ] All API endpoints have contracts defined
- [ ] Backend tests validate against contracts
- [ ] Frontend validates responses in dev mode
- [ ] Contract violations logged/alerted

---

## Dependency Graph

```
6-1 (Context API) ──┬── 6-3 (Context Loading)
                    │
                    └── 6-4 (Onboarding Flow) ── 6-5 (Smart Suggestions)

6-2 (Response Panel) ── Independent, can parallel with 6-1

6-6 (Pattern Harvesting) ── Independent, can parallel
```

---

## Acceptance Criteria

### Phase 6 Complete When:

- [ ] **6-1:** Project context API endpoints working
- [ ] **6-2:** Response panel displays structured data
- [ ] **6-3:** Orion loads context on project switch
- [ ] **6-4:** New projects can be onboarded with context
- [ ] **6-5:** Orion references context in responses
- [ ] **6-6:** Pattern Harvesting auto-saves patterns

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
| 6-6 | 1 day | None |
| 6-7 | 2 days | None |
| 6-8 | 1 day | None |
| 6-9 | 2 days | None |

**Total:** ~12-14 days

---

### 6-9: Agent Activity Log Integration
**Owner:** Devon
**Priority:** High

---

### 6-10: Project-Level File Isolation
**Owner:** Devon
**Priority:** Critical (Security)

**Description:**
Currently FileSystemTool allows access to the entire workspace (`C:\Coding\CM`). 
It should restrict access to the **active project's folder** only.

**Current Behavior:**
- Agent can read/write anywhere in `C:\Coding\CM/`
- No concept of "active project" in agent context

**Required Behavior:**
- Each session has an `activeProject` context
- FileSystemTool restricts to `projects/{activeProject}/`
- Switching projects changes the accessible folder

**Implementation:**
1. Add `activeProjectId` to agent session/context
2. Update `FileSystemTool.validatePath()` to use project root, not workspace root
3. Add API endpoint: `POST /api/session/project/:id` to switch active project
4. Store active project in session or memory

**Example:**
```javascript
// Current (insecure)
const projectRoot = process.cwd(); // C:\Coding\CM

// Fixed (secure)
const projectRoot = path.join(process.cwd(), 'projects', activeProject.path);
// C:\Coding\CM\projects\MyProject
```

**Tests:**
- [ ] Agent cannot access files outside active project
- [ ] Switching projects changes accessible files
- [ ] Error thrown when no project is active

---

### 6-11: Conversation History for Agent Mode
**Owner:** Devon
**Priority:** High

**Description:**
Currently each chat message is sent to the LLM independently with no context.
When user says "Yes, proceed", Orion doesn't remember what he proposed.

**Problem:**
```
User: "Create folder X and update project path"
Orion: "I'll do steps 1 and 2. Confirm?"
User: "Yes, proceed"
Orion: [doesn't know what was proposed - no history]
```

**Solution:**
Pass conversation history to the LLM (last N messages).

**Implementation:**
```javascript
// OrionAgent.chat()
async chat(message, mode = 'tactical', conversationHistory = []) {
  // Include last 5 messages as context
  const context = conversationHistory.slice(-5);
  const result = await AiService.generate(message, mode, context);
  // ...
}

// TacticalAdapter.generate()
async generate(prompt, mode, history = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: prompt }
  ];
  // ...
}
```

**Frontend:**
- Store messages in chat store
- Pass history array with each API call

**Tests:**
- [ ] "Yes proceed" after proposal executes the proposed actions
- [ ] History is limited to last N messages (memory safety)
- [ ] System prompt is not duplicated

---

### 6-12: Function Calling API Support
**Owner:** Devon
**Priority:** Critical

**Description:**
Replace XML-based tool parsing with native LLM Function Calling API.
This dramatically improves action selection accuracy.

**Current Problem:**
```
User: "Update project 1 path to Projects/CodeMaestro"
LLM: <tool name="ProjectTool"><action>list</action></tool>  ← WRONG!
```

**Solution:**
Use OpenAI-compatible function calling (DeepSeek supports this):

```javascript
// Define tools as functions
const tools = [
  {
    type: "function",
    function: {
      name: "ProjectTool_update",
      description: "Update a project's details (name, description, path)",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "integer", description: "Project ID to update" },
          path: { type: "string", description: "New path for the project" },
          name: { type: "string", description: "New name (optional)" }
        },
        required: ["projectId"]
      }
    }
  },
  // ... other tools
];

// Call with function calling
const response = await client.chat.completions.create({
  model: "deepseek-chat",
  messages: [...],
  tools: tools,
  tool_choice: "auto"
});

// Response contains structured tool calls
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];
  // toolCall.function.name = "ProjectTool_update"
  // toolCall.function.arguments = '{"projectId": 1, "path": "Projects/CodeMaestro"}'
}
```

**Benefits:**
- LLM returns structured JSON, not free-form XML
- No parsing errors
- Much higher accuracy for action selection
- Native support in DeepSeek, OpenAI, Anthropic

**Implementation:**
1. Convert tool registry to function definitions
2. Update TacticalAdapter to use function calling API
3. Update AgentExecutor to handle function call responses
4. Remove XML parsing (keep as fallback for models without function calling)

**Tests:**
- [ ] "Update project X" correctly calls ProjectTool_update
- [ ] "Delete project X" correctly calls ProjectTool_delete  
- [ ] Multi-step tasks chain function calls correctly
- [ ] Fallback to XML for unsupported models

---

### 6-13: WebSocket Project Sync
**Owner:** Devon
**Priority:** Medium

**Description:**
When projects are created/updated/deleted via agent mode (Orion), the frontend dropdown 
doesn't update because it only fetches on mount. Add WebSocket events to sync state.

**Problem:**
- User asks Orion: "Create project Test-Alpha"
- Orion creates it via ProjectTool
- Frontend dropdown doesn't show it (needs manual refresh)

**Solution:**
1. Backend broadcasts WebSocket event after project changes
2. Frontend listens and refreshes project store

**Implementation:**

Backend (ProjectTool.js):
```javascript
// After createProject
const io = require('../socket').getIO();
io.emit('project_created', newProject);

// After deleteProject  
io.emit('project_deleted', { id: projectId });
```

Frontend (stores/project.js):
```javascript
// In useSocket composable
socket.on('project_created', (project) => {
  projectStore.projects.push(project);
});

socket.on('project_deleted', ({ id }) => {
  projectStore.fetchProjects(); // Refresh list
});
```

**Tests:**
- [ ] Creating project via chat triggers dropdown update
- [ ] Deleting project via chat removes from dropdown
- [ ] Multiple browser tabs stay in sync

---

### 6-12: Agent Activity Log Integration

**Description:**
Connect agent mode actions (LLM responses, tool calls, results) to the Activity Log view. 
Make logs persistent, clickable, and filterable.

**Features:**
1. **Persistent Storage** - Store agent actions in `agent_activity_log` table
2. **Activity Log View** - Dedicated UI showing all agent activity
3. **Clickable Details** - Click to expand and see full LLM response, params, results
4. **Filtering** - By agent, tool, date, status (success/error)
5. **Link to Chat** - Click to jump to related chat message

**Database Schema:**
```sql
CREATE TABLE agent_activity_log (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(50),
  agent VARCHAR(20) NOT NULL,
  action_type VARCHAR(50) NOT NULL,  -- 'llm_response', 'tool_call', 'tool_result', 'error'
  tool_name VARCHAR(50),
  params JSONB,
  result JSONB,
  error TEXT,
  step_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Retention policy
  retention_days INTEGER DEFAULT 14,  -- Configurable: debug=7, errors=90
  expires_at TIMESTAMP GENERATED ALWAYS AS (created_at + (retention_days || ' days')::INTERVAL) STORED
);

-- Index for cleanup job
CREATE INDEX idx_activity_log_expires ON agent_activity_log(expires_at);
```

**Retention Policy:**
- Debug logs (LLM responses, params): 7-14 days
- Tool results (success): 14 days  
- Errors: 90 days (keep longer for debugging)
- Cleanup job runs daily: `DELETE FROM agent_activity_log WHERE expires_at < NOW()`

**API Endpoints:**
```
GET /api/activity                    - List all activity (paginated)
GET /api/activity/:sessionId         - Get activity for a session
GET /api/activity/agent/:agentName   - Filter by agent
```

**Frontend Components:**
- `ActivityLogView.vue` - Main view with filters
- `ActivityLogItem.vue` - Expandable log entry
- Integration with existing Activity panel in sidebar

**Tests:**
- [ ] Actions are saved to database
- [ ] Filtering by agent works
- [ ] Clicking entry shows full details
- [ ] Pagination works for large logs

---

---

## 6-14: Tiered Memory Retrieval System

**Owner:** Orion  
**Priority:** High  
**Dependencies:** 6-12 (Function Calling), 6-13 (Conversation History)

### Overview

Implement a 4-tier memory system that allows Orion to remember and retrieve context across conversations without overwhelming the LLM context window.

### The 4 Memory Tiers

| Tier | Name | Retention | Context Strategy | Examples |
|------|------|-----------|------------------|----------|
| **1** | **Critical** | Forever | Always in prompt | Project purpose, core architecture decisions |
| **2** | **Important** | Long-term (1yr) | Always in prompt (summary) | Tech stack, user preferences, key decisions |
| **3** | **Routine** | Medium-term (30d) | Search on demand | Past conversations, discussion context |
| **4** | **Ephemeral** | Short-term (24h) | Current session only | Current task details, temp context |

### Database Schema

```sql
-- Add tier and searchability to memories table
ALTER TABLE memories ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'routine';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_memories_search ON memories USING GIN(search_vector);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_memories_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.key, '') || ' ' || COALESCE(NEW.value::text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_search_update
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_memories_search_vector();
```

### MemoryTool Functions

```javascript
// Function definitions for Orion
{
  name: "MemoryTool_search",
  description: "Search past conversations and stored memories",
  parameters: {
    query: { type: "string", description: "Keywords to search for" },
    tier: { type: "string", enum: ["critical", "important", "routine", "all"], default: "all" }
  }
},
{
  name: "MemoryTool_save",
  description: "Save an important fact or decision to memory",
  parameters: {
    key: { type: "string", description: "Short identifier for this memory" },
    value: { type: "string", description: "The content to remember" },
    tier: { type: "string", enum: ["critical", "important", "routine"], default: "important" }
  }
},
{
  name: "MemoryTool_list",
  description: "List memories by tier or project",
  parameters: {
    tier: { type: "string", enum: ["critical", "important", "routine", "all"], default: "all" }
  }
}
```

### Context Injection Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ SYSTEM PROMPT                                               │
├─────────────────────────────────────────────────────────────┤
│ [Base Orion Instructions]                                   │
│                                                             │
│ === CRITICAL MEMORIES (Tier 1) ===                          │
│ • Project purpose: Multi-AI TDD platform                    │
│ • Architecture: Vue 3 + Express + PostgreSQL                │
│                                                             │
│ === IMPORTANT MEMORIES (Tier 2 - Summary) ===               │
│ • User prefers TypeScript                                   │
│ • Naming convention: camelCase for functions                │
│ • 5 other important facts...                                │
│                                                             │
│ === RECENT CONTEXT (Last 10 messages) ===                   │
│ [Chat history from chat_messages]                           │
│                                                             │
│ === AVAILABLE TOOLS ===                                     │
│ [Function definitions including MemoryTool_search]          │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Memory Extraction

After each conversation, extract and save important facts:

```javascript
// Run after conversation ends or every N messages
async function extractMemories(projectId, messages) {
  const prompt = `
    Review these messages and extract any important facts that should be remembered:
    - Project decisions
    - User preferences  
    - Technical choices
    - Requirements mentioned
    
    Return JSON: [{ key: "...", value: "...", tier: "important|routine" }]
  `;
  
  const memories = await llm.extract(messages, prompt);
  for (const memory of memories) {
    await memoryService.save(projectId, memory);
  }
}
```

### Retention Policy Jobs

```javascript
// Daily cleanup job
async function cleanupExpiredMemories() {
  // Ephemeral: 24 hours
  await db.query(`DELETE FROM memories WHERE tier = 'ephemeral' AND created_at < NOW() - INTERVAL '24 hours'`);
  
  // Routine: 30 days
  await db.query(`DELETE FROM memories WHERE tier = 'routine' AND created_at < NOW() - INTERVAL '30 days'`);
  
  // Important: 1 year
  await db.query(`DELETE FROM memories WHERE tier = 'important' AND created_at < NOW() - INTERVAL '1 year'`);
  
  // Critical: Never deleted
}
```

### Implementation Phases

**Phase A: Basic Search (MVP) ✅ COMPLETED**
- [x] MemoryTool_search with PostgreSQL full-text search
- [x] Search chat_messages table
- [x] Add to Orion's function definitions
- [x] Increase chat history from 10 to 100 messages

**Phase B: Memory Storage & Auto-Extraction ✅ IMPLEMENTED (Dec 9, 2025)**
- [x] memoryExtractionService.js created
- [x] Auto-extraction every 50 messages
- [x] LLM-based fact extraction with structured JSON output
- [x] Saves to memories table with type='extracted'
- [x] JSONB format for PostgreSQL compatibility
- [ ] Add tier column to memories table (deferred)
- [ ] MemoryTool_save function (can use extraction service)
- [ ] MemoryTool_list function

**Phase C: ShellTool & Function Calling Fixes ✅ COMPLETED (Dec 9, 2025)**
- [x] ShellTool handles object params `{action, command}` from function calling
- [x] ShellTool defaults to PROJECT_ROOT instead of backend folder
- [x] Force `tool_choice: 'required'` for action keywords (clone, create, run, etc.)
- [x] Add ShellTool_execute to function calling prompt
- [x] nodemon.json ignores projects/ folder to prevent restart during clones

**Phase D: Optimizations (Future)**
- [ ] Vector embeddings for semantic search (pgvector)
- [ ] Memory summarization (compress old memories)
- [ ] Context budget tracking
- [ ] Tiered memory system (critical/important/routine/ephemeral)

### Implementation Details (Dec 9, 2025)

**Files Created:**
- `backend/src/services/memoryExtractionService.js` - Auto-extracts key facts from conversations
- `backend/nodemon.json` - Ignores projects folder to prevent restart loops

**Files Modified:**
- `backend/src/agents/OrionAgent.js` - Loads 100 messages, triggers extraction after responses
- `backend/src/llm/TacticalAdapter.js` - Added ShellTool to prompt, force tool_choice for actions
- `backend/src/tools/ShellTool.js` - Handle object params, use PROJECT_ROOT as cwd
- `backend/src/tools/functionDefinitions.js` - Added git_url to ProjectTool_update
- `backend/src/services/projectContextService.js` - Loads extracted memories into context
- `.gitignore` - Exclude Projects/ and cloned workspaces

**How Memory Extraction Works:**
1. After saving each assistant response, `checkAndExtract()` is called
2. Checks if 50+ messages since last extraction
3. Fetches messages, sends to LLM with extraction prompt
4. LLM returns JSON array of `{key, value}` facts
5. Facts saved to `memories` table with `type='extracted'`
6. Extracted memories loaded into project context for future conversations

**Known Issues:**
- Memory extraction JSONB format needs testing
- NaN in "since last extraction" counter needs fix

### Tests

- [ ] MemoryTool_search returns relevant results
- [ ] Memories are correctly tiered
- [ ] Retention policies work (items expire)
- [ ] Critical memories always in context
- [ ] Search doesn't timeout on large datasets

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
