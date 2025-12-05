# CodeMaestro — Future Features & Vision

Version: 2.1 (Consolidated)
Owner: Adam (Architect)
Status: Planning (Post-MVP)

---

## 1. Vision Beyond MVP

Transform CodeMaestro from a **human-coordinated** multi-agent system into a **largely autonomous** AI development platform where:

- Human provides direction ("Build feature X")
- Agents autonomously execute the full cycle
- Human intervenes only for high-risk approvals and escalations
- System continuously improves from outcomes

**The Goal:** From "human-in-the-loop" to "human-on-the-loop" — you direct, agents execute.

---

## 2. Phase Overview

### Phase A — Multi-Agent Orchestrator Foundation
**Focus:** Evolve from manual coordination to automated agent handoffs

**Capabilities:**
- Workflow Orchestration Service (event-driven handoffs)
- Ready Queue / dependency resolver using `Agents/Subtasks/manifest.yml` + logs
- State machine with validated transitions
- Role separation enforcement at system level
- Automatic retry loops on failure
- Agent session tracking (claim/release)
- Visible orchestration timeline in dashboard

**Deliverables:**
- State diagram and control panel
- Test-green gates before "Act"
- Retry/circuit breaker policies
- Agent-to-agent handoff automation

### Phase B — Pro Dashboard (Visibility & QA)
**Focus:** Turn the dashboard into a control room

**Capabilities:**
- **Feature Branch Workflow:** Move from single-branch to `feature/xyz` branches merging into main.
- Workflow visualization (job timelines, stacked state history)
- Code diff viewer with inline comments
- Test results panel with coverage summary and flaky test detector
- Project/task board: status, dependencies, ETA, owners
- Git panel: branches, commits, pending approvals
- Performance panels (throughput, error rates)
- Search and filter across activity logs and artifacts

**Deliverables:**
- Live views with drill-downs
- Real-time progress tracking
- Visual dependency graphs

### Phase C — Memory & Self-Optimization
**Focus:** Teach the system to improve itself

**Capabilities:**
- Memory tiers (Critical/Important/Routine/Ephemeral)
- Memory browser in dashboard (search, pinning, retention)
- Self-optimization loop:
  - Observe success/failure metrics
  - Suggest prompt/workflow tweaks
  - Simulate changes in sandbox
  - Human approve → apply
- State-change briefings (one-line summaries and audit trails)
- Context budget tracking and optimization

**Deliverables:**
- Optimization proposals panel
- Sandbox runner and promotion workflow
- Learning from past successes/failures

### Phase D — Enterprise & Scale
**Focus:** Team-ready and enterprise-safe

**Capabilities:**
- Multi-tenant projects, org/workspace switching
- RBAC (admin/author/reviewer/reader)
- Secrets/config management (env matrix)
- Compliance and audit exports
- External knowledge lookup (docs/web search) with guardrails
- SSO integration
- API rate limiting per tenant

**Deliverables:**
- Access control UI
- Auditable artifacts and usage metrics
- Integration points (SSO, SCM providers, ticketing)

---

## 3. Critical Infrastructure Gaps (from System Analysis)

### 3.1 Agent-to-Agent Handoff Mechanism

**Current:** Human triggers each agent manually

**Future:** Event-driven handoffs

| Trigger Event | Expected Action |
|---------------|-----------------|
| Orion marks FRD/PRD as `complete` | Tara auto-receives task to generate tests |
| Tara marks tests as `ready` | Devon auto-receives task to implement |
| Devon marks implementation as `complete` | Test runner auto-executes |
| Tests pass | PR auto-created or queued for approval |
| Tests fail | Devon auto-notified with failure context |

### 3.2 State Machine for Task Lifecycle

**Proposed State Machine:**
```
pending → in-progress → [testing] → ready-for-review → completed
                ↓              ↓
              blocked        failed → retrying → [testing]
```

**Features:**
- Validates transitions (can't skip states)
- Triggers side effects on transitions
- Handles failure states properly

### 3.3 Tiered Approval Model

| Risk Level | Example | Gate |
|------------|---------|------|
| **Low** | Fix typo, update doc, add test case | Auto-approve if tests pass |
| **Medium** | New endpoint, UI component | Human review before merge |
| **High** | Schema change, security-related, infra | Explicit human approval before Act |

### 3.4 Autonomous Retry Loop

```
Tests fail → Devon receives failure context → Devon proposes fix → 
Tests re-run → [repeat up to N times] → Escalate if exhausted
```

**Parameters:**
- Max retry count (default: 3)
- Exponential backoff or cooldown
- Full failure context passed to agent
- Automatic escalation to human

### 3.5 Context Briefing API

**Endpoint:** `GET /api/agent/briefing/:subtaskId`

**Returns:**
```json
{
  "subtask": { /* manifest entry */ },
  "log": { /* full log */ },
  "requirements": { "developer": "...", "tester": "..." },
  "relevantFiles": [ /* paths + snippets */ ],
  "recentActivity": [ /* last 10 events */ ],
  "openQuestions": [ /* unresolved items */ ]
}
```

**Benefit:** Reduces context gathering from 5+ file reads to one API call.

---

## 4. Additional Agent Roles (Future)

### QA / Breaker Agent
- Writes adversarial test cases
- Looks for security vulnerabilities
- Thinks like a malicious user
- Finds logic holes

### DevOps Agent
- Dockerfile generation
- CI/CD pipeline setup
- Environment configuration
- Production readiness checks

### Prompt Engineer Agent
- Designs and optimizes prompts for other agents
- Structures function calling / tools
- Reduces hallucination with better context

### Product Manager Agent
- Expands unclear requirements
- Finds missing features/edge cases
- Defines acceptance criteria
- Controls scope creep

---

## 5. Database Migration (YAML → PostgreSQL)

### Current State
- `Agents/manifest.yml` — subtask status
- `Agents/logs/<id>.yml` — detailed task state
- No validation, no queries, merge conflicts possible

### Future State
- PostgreSQL with proper schema
- Queries: "Show all blocked subtasks"
- Validation: Enum constraints on status
- Transactions: Atomic updates
- Indexes: Fast lookups by status, project, date

### Migration Path
1. Design schema with version field
2. Build migration script (YAML → PostgreSQL)
3. Update services to use database
4. Keep YAML as human-readable export option
5. Add audit logging to database

---

## 6. Advanced Dashboard Features

### Workflow Visualization
- Gantt-style timeline for subtasks
- Dependency graph (what blocks what)
- Critical path highlighting
- ETA predictions based on historical data

### Code Intelligence
- Full diff viewer with syntax highlighting
- Side-by-side comparisons
- Inline commenting for review
- Git blame integration

### Test Analytics
- Coverage trends over time
- Flaky test detection and tracking
- Test duration analysis
- Failure pattern recognition

### Performance Monitoring
- Agent response times
- Success/failure rates by agent
- Cost tracking (API calls)
- Throughput metrics (tasks/day)

---

## 7. MCP / Inter-Agent Protocol

### Purpose
Enable true parallel agent execution with shared state

### Options
- **Model Context Protocol (MCP):** Standard for AI tool communication
- **Redis Pub/Sub:** Simple event bus for state changes
- **Custom Protocol:** Lightweight JSON messages over WebSocket

### Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Orion     │     │   Tara      │     │   Devon     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┴───────────────────┘
                   │
          ┌────────▼────────┐
          │  Message Bus    │
          │  (State Store)  │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Orchestrator   │
          │   Service       │
          └─────────────────┘
```

---

## 8. Self-Improvement System

### Level 0 — Manual Human Control
- Human drives all decisions
- AI suggests, human executes
- Current state for sensitive operations

### Level 1 — Assisted Automation
- AI proposes changes
- Human reviews and approves
- System executes on approval

### Level 2 — Supervised Automation
- AI executes low-risk tasks autonomously
- Human notified of actions
- Human can intervene/rollback

### Level 3 — Autonomous with Guardrails
- AI handles most tasks independently
- Human approval only for high-risk
- Automatic rollback on failures

### Level 4 — Self-Optimizing
- AI suggests process improvements
- Sandbox testing of optimizations
- Human approves promotions

### Level 5 — Fully Autonomous
- AI manages its own operations
- Human sets goals and constraints
- System achieves outcomes independently

---

## 9. Security & Compliance (Enterprise)

### Authentication & Authorization
- SSO integration (SAML, OIDC)
- Multi-factor authentication
- API key management
- Session management

### Role-Based Access Control
- Admin: Full system access
- Author: Create/edit projects
- Reviewer: Approve changes
- Reader: View only

### Audit & Compliance
- Complete audit trail
- Data retention policies
- Export capabilities (for compliance)
- Activity logging with immutable records

### Secrets Management
- Environment-specific secrets
- Rotation policies
- No secrets in logs/code
- Encrypted storage

---

## 10. Integration Points

### Source Control
- GitHub, GitLab, Bitbucket
- Branch protection rules
- PR automation
- Webhook triggers

### CI/CD
- GitHub Actions
- Jenkins, CircleCI
- Deployment pipelines
- Environment promotion

### Project Management
- Jira, Linear, Asana
- Task sync
- Status updates
- Sprint integration

### Communication
- Slack, Discord, Teams
- Notifications
- Escalation alerts
- Daily summaries

---

## 11. Non-Goals (Explicitly Out of Scope)

- "Fully autonomous" code merging without human review (safety guardrails always required)
- Unbounded internet write access (no silent side-effects)
- Non-deterministic backdoor channels between agents
- Replacing human judgment on critical business decisions
- Training on customer data without explicit consent

---

## 12. Metrics (Post-MVP)

### Operational
- Workflow throughput (tasks/week)
- Pass rate (first-time success)
- Time-to-green (from start to tests passing)
- Human intervention rate

### Quality
- Rollback rate post-commit
- Bug escape rate
- Test coverage trends
- Technical debt metrics

### Efficiency
- Agent response time
- Context token usage
- API cost per task
- Human time saved

### Learning
- Suggested vs. accepted optimizations (Phase C)
- Prompt improvement effectiveness
- Error pattern reduction over time

---

## 13. Phase Acceptance Criteria

### Phase A — Multi-Agent Orchestrator
- [ ] State machine visible in dashboard
- [ ] Roles separated at system level
- [ ] Retries and circuit breaker enforced
- [ ] Agent session tracking prevents conflicts
- [ ] Unit tests for state transitions

### Phase B — Pro Dashboard
- [ ] **Feature Branch support** (Phase B git workflow)
- [ ] Live workflow visualizations
- [ ] Code diff viewer functional
- [ ] Test/coverage summaries displayed
- [ ] Git panel shows branches and commits
- [ ] Searchable logs with filters

### Phase C — Memory & Self-Optimization
- [ ] Memory tiers implemented
- [ ] Retrieval UI functional
- [ ] Optimization proposals with sandbox
- [ ] State-change briefings automated
- [ ] Learning metrics tracked

### Phase D — Enterprise & Scale
- [ ] RBAC enforced
- [ ] Multi-tenant isolation verified
- [ ] Secrets management secure
- [ ] Audit export functional
- [ ] SSO/SCM integrations working

---

## 14. Prioritized Backlog

### High Priority (Do First)
1. **Workflow Orchestration Service** — removes human as bottleneck
2. **State Machine Implementation** — enables automation
3. **PostgreSQL Migration** — enables queries and validation
4. **Retry/Failure Loops** — self-healing reduces debugging

### Medium Priority (Next Phase)
5. **Tiered Approvals** — unlocks autonomy for low-risk
6. **Context Briefing API** — speeds up agent startup
7. **Agent Session Tracking** — prevents conflicts
8. **Dashboard Visualizations** — better visibility

### Lower Priority (Later)
9. **Quality Gates** — nice-to-have, tests cover most cases
10. **Memory System** — requires stable foundation first
11. **Enterprise Features** — after core is solid
12. **Self-Optimization** — requires Phase B/C complete

---

## 15. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase A (Orchestrator) | 2–3 weeks | MVP complete |
| Phase B (Dashboard) | 2–3 weeks | Phase A stable |
| Phase C (Memory) | 3–4 weeks | Phase B metrics |
| Phase D (Enterprise) | 4–6 weeks | Phase A–C complete |

**Total:** ~12–16 weeks post-MVP for full vision

---

## 16. Agent Team Scaling (Phase 5)

### Vision
Scale from single-agent-per-role to **multi-agent teams** for true parallel development.

### Proposed Team Structure

| Role | Count | Scope | Territory (File Ownership) |
|------|-------|-------|---------------------------|
| **Orion** | 1 | Orchestration, status, PRs, coordination | `Agents/`, manifests, logs |
| **Tara-FE** | 1 | Frontend tests (Vitest) | `frontend/__tests__/`, `*.spec.ts` |
| **Tara-BE** | 1 | Backend tests (Jest) | `backend/__tests__/`, `*.test.js` |
| **Devon-FE** | 1 | Vue components, stores, composables | `frontend/src/` |
| **Devon-BE** | 1 | Express routes, services, DB | `backend/src/` |

### Why Single Orion?
- **Single source of truth** for task status
- Prevents conflicting assignments
- Coordinates merge order to avoid git conflicts
- Human escalation point

### Why Split Tara/Devon?
- **No file conflicts** — each agent has a dedicated territory
- **True parallelism** — FE and BE work can happen simultaneously
- **Specialized context** — agents maintain domain expertise
- **Faster throughput** — multiple subtasks progress at once

### Rate Limit Considerations

| Scenario | Agents Active | Est. RPM Needed | Deepseek Tier |
|----------|---------------|-----------------|---------------|
| Sequential | 1 | ~10 | Free tier OK |
| Light parallel | 2-3 | ~30 | Free tier OK |
| Full team | 5 | ~50 | Paid tier recommended |

### Architecture Requirements

1. **Task Queue System**
   - Orion pulls unblocked tasks from dependency graph
   - Assigns to idle agents based on territory
   - Tracks agent availability (idle/busy/blocked)

2. **Territory Enforcement**
   - Hard rule: Agents can only edit files in their territory
   - Prevents merge conflicts
   - Enforced at orchestration level

3. **Agent Status Tracking**
   ```yaml
   agents:
     orion:
       status: idle
       current_task: null
     tara-fe:
       status: busy
       current_task: "2-3"
     devon-be:
       status: busy  
       current_task: "2-2"
   ```

4. **Merge Coordination**
   - Orion sequences PRs to avoid conflicts
   - FE merges don't block BE merges (different files)
   - Only block when dependencies exist

### Workflow Example

```
Time 0:  Orion assigns 2-2 (BE) to Devon-BE
         Orion assigns 2-3 (FE) to Tara-FE
Time 1:  Devon-BE working, Tara-FE working (parallel)
Time 2:  Tara-FE done → Orion assigns 2-3 to Devon-FE
         Devon-BE still working
Time 3:  Devon-FE working, Devon-BE done
         Orion assigns 2-2 tests to Tara-BE
Time 4:  All 4 agents working in parallel (peak throughput)
```

### Cost Projection

| Team Size | Tasks/Hour | API Calls/Hour | Est. Daily Cost |
|-----------|------------|----------------|-----------------|
| 1 (current) | 1-2 | ~100 | ~$0.50 |
| 3 (light) | 3-5 | ~300 | ~$1.50 |
| 5 (full) | 5-8 | ~500 | ~$2.50 |

*Based on Deepseek pricing (~$0.001/1K tokens)*

### Implementation Phases

1. **Phase 5a:** Add second Tara (FE/BE split)
2. **Phase 5b:** Add second Devon (FE/BE split)  
3. **Phase 5c:** Task queue and agent status tracking
4. **Phase 5d:** Territory enforcement and conflict prevention

### Success Metrics

- **Throughput:** 3-4x improvement in tasks/day
- **Parallelism:** Average 2-3 agents active simultaneously
- **Conflicts:** Zero git merge conflicts from agent work
- **Quality:** No regression in test pass rate

---

## 17. Distribution & Business Models

### BYOK (Bring Your Own Key) — Recommended Launch Strategy

**Why BYOK first:**
- Zero API cost to you
- No enterprise deals needed — ship immediately
- Privacy selling point ("Your keys, your data")
- Open source friendly

**Who does BYOK:**
- Cline, Continue.dev, Aider, LM Studio
- Cursor (originally, before subscription)

### Business Model Options

| Model | How It Works | When to Use |
|-------|--------------|-------------|
| **BYOK Only** | Users provide their own keys | MVP, open source |
| **Usage-Based** | Route through your backend, charge margin | After traction |
| **Subscription** | Flat fee, you pay providers | After enterprise deals |
| **Hybrid** | Free = BYOK, Pro = bundled | Growth phase |
| **Enterprise** | Teams, RBAC, SLA, support | B2B sales |

### Cline's Playbook (Reference)

1. **Open source extension** → Massive adoption (free)
2. **Optional managed routing** → Usage-based fees
3. **Cline Teams** → Enterprise features (free through 2025, paid 2026+)
4. **Land grab strategy** → Grow first, monetize later

### CodeMaestro Revenue Path

```
Phase 1-5: Free / Open Source (BYOK)
           └── Build product, prove value
           
Phase 6:   Usage-Based Option
           └── "Easy Mode" — we manage keys, small markup
           └── Revenue: API margin (~10-20%)
           
Phase 7:   Pro Tier
           └── Advanced dashboard, priority support
           └── Revenue: $20-50/mo subscription
           
Phase 8:   Enterprise / Teams
           └── Centralized billing, RBAC, audit logs
           └── SSO, SLA, dedicated support
           └── Revenue: $X/seat/month
```

---

## 18. IDE Extension Strategy (Phase 6+)

### Why Extensions Win

1. **Zero friction** — Users stay in their IDE
2. **File access** — Direct read/write to workspace
3. **Terminal integration** — Run commands natively
4. **Git integration** — Branch/commit from extension
5. **Marketplace distribution** — One-click install (30M+ VSCode users)

### Target Platforms

| Platform | Type | Priority | Notes |
|----------|------|----------|-------|
| **VSCode** | Extension | P0 | Largest market, also works in Cursor/Windsurf |
| **JetBrains** | Plugin | P1 | IntelliJ, WebStorm, PyCharm — enterprise |
| **Neovim** | Plugin | P2 | Power users, CLI-native |
| **GitHub Codespaces** | Extension | P1 | Cloud IDE, enterprise |
| **Gitpod** | Extension | P2 | Cloud IDE |

### Extension Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VSCode Extension                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Sidebar     │  │  Commands    │  │  Status Bar  │  │
│  │  (Webview)   │  │  Palette     │  │  Agent Info  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┼─────────────────┘          │
│                           │                             │
│              ┌────────────▼────────────┐               │
│              │   Extension Host        │               │
│              │   • File operations     │               │
│              │   • Terminal commands   │               │
│              │   • Git operations      │               │
│              └────────────┬────────────┘               │
└───────────────────────────┼─────────────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │  CodeMaestro Core   │
                 │  (Embedded/Local)   │
                 │  • Agent Framework  │
                 │  • State Machine    │
                 │  • LLM Integration  │
                 └─────────────────────┘
```

### Extension Features

**Sidebar Panel (Webview):**
- Task list with status
- Agent activity log
- Chat interface for commands
- Current task details

**Command Palette:**
- `CodeMaestro: Start Task`
- `CodeMaestro: Check Status`
- `CodeMaestro: Assign to Tara/Devon`
- `CodeMaestro: Approve PR`
- `CodeMaestro: View Dependencies`

**Status Bar:**
- Current agent working
- Task progress (e.g., "2-2: 3/5 checks")
- Quick actions

**Output Channel:**
- Real-time agent logs
- Test results
- Git operations

### Implementation Phases

```
Phase 6a: Basic Extension Shell
          └── Webview with existing dashboard
          └── Command palette basics
          
Phase 6b: Native IDE Integration
          └── File operations via Extension API
          └── Terminal integration
          └── Git via Extension API
          
Phase 6c: Polish & Publish
          └── Marketplace listing
          └── Documentation
          └── Onboarding flow
          
Phase 6d: Multi-IDE
          └── JetBrains plugin
          └── Neovim plugin
```

### Competitive Positioning

| Tool | Model | Strength | CodeMaestro Differentiator |
|------|-------|----------|---------------------------|
| **Copilot** | Bundled | Autocomplete | We do orchestration, not autocomplete |
| **Cline** | BYOK | Full autonomy | We have structured TDD workflow |
| **Continue** | BYOK | Customizable | We have multi-agent roles |
| **Cursor** | Standalone | Full control | We're an extension, not a fork |
| **Aider** | CLI | Git-native | We have GUI + process governance |

**CodeMaestro's unique value:** Not just "AI writes code" but **"AI team follows your process"** — TDD workflow, role separation, quality gates.

---

## 19. Auto-Generated Task Checklists

### Inspiration
Cline automatically generates step-by-step checklists for complex tasks, giving visibility into progress. CodeMaestro should do the same.

### Concept

```
┌─────────────────────────────────────────────────────┐
│  2-5 Deepseek Integration                    [3/7]  │
├─────────────────────────────────────────────────────┤
│  [x] Create DeepseekClient class                    │
│  [x] Implement chat() method                        │
│  [x] Add API key config from .env                   │
│  [ ] Implement rate limit handling                  │
│  [ ] Add timeout handling                           │
│  [ ] Implement token tracking                       │
│  [ ] Create ModelAdapter interface                  │
└─────────────────────────────────────────────────────┘
```

### Generation Approaches

| Approach | Source | Complexity | Accuracy |
|----------|--------|------------|----------|
| **From Log** | Parse `requiredActions` from task log | Low | High (pre-defined) |
| **LLM-generated** | Agent analyzes task → creates steps | Medium | Variable |
| **Hybrid** | Start with log, agent adds sub-steps | Medium | Best of both |

### Implementation

**Backend:**
```javascript
// Auto-parse requiredActions into checklist
function generateChecklist(taskLog) {
  return taskLog.requiredActions.map((action, idx) => ({
    id: `step-${idx}`,
    text: action,
    completed: false,
    completedAt: null,
    completedBy: null
  }));
}
```

**Frontend Display Locations:**

| Location | Display | Purpose |
|----------|---------|---------|
| **Activity Log** | Collapsible checklist per task | Detailed progress |
| **Status Bar** | Progress indicator "2-5: 3/7" | Quick glance |
| **Task Panel** | Full checklist with timestamps | Task management |
| **Chat Panel** | Agent reports step completion | Real-time updates |

### Agent Integration

When an agent completes a step, it updates the checklist:
```javascript
// Agent marks step complete
await orchestrator.completeStep(taskId, stepId, {
  completedBy: 'devon',
  notes: 'Implemented with retry logic'
});

// WebSocket broadcasts to UI
socket.emit('step_complete', { taskId, stepId, progress: '4/7' });
```

### LLM-Assisted Breakdown

For complex tasks, the agent can request breakdown:
```
Agent: "This task is complex. Breaking into sub-steps..."

LLM Response:
1. Research Deepseek API documentation
2. Create client class with constructor
3. Implement authentication header
4. Add chat completion method
5. Handle streaming responses
6. Implement error handling
7. Add rate limit retry logic
8. Write usage tracking
9. Create adapter interface
```

### Benefits

- **Visibility** — See exactly where an agent is in a task
- **Resumability** — If agent times out, new session knows what's done
- **Estimation** — Track average time per step for ETAs
- **Debugging** — Know which step failed

### Phase

Add to **Phase B (Pro Dashboard)** — enhances visibility and task management.

---

## References

- System Analysis: `Docs/Development/CodeMaestro_System_Analysis_and_Recommendations.md`
- MVP Spec: `Docs/CodeMaestro_MVP_Consolidated.md`
- Workflow Improvements (Phase 1): `Docs/Workflow_Improvements_Phase1.md`
- RFCs:
  - `Docs/Architecture/RFCs/RFC-0001_Auth_Tenancy.md`
  - `Docs/Architecture/RFCs/RFC-0002_BYOK_Secrets_and_Metering.md`
  - `Docs/Architecture/RFCs/RFC-0003_Model_Adapter_Policy.md`
