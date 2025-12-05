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

## 16b. Elastic Agent Scaling (Auto-Scale)

### Vision

Automatically spawn or retire agents based on queue depth — like cloud auto-scaling but for AI workers.

### Auto-Scale Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORION MONITOR                             │
│          (watches queue depths every 30 seconds)             │
└───────────────────────────────┬─────────────────────────────┘
                                │
             Queue depth vs threshold?
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
       ┌─────────────┐                     ┌─────────────┐
       │  SCALE UP   │                     │ SCALE DOWN  │
       │ Spawn agent │                     │Retire agent │
       └─────────────┘                     └─────────────┘
```

### Scaling Rules Configuration

```yaml
scaling:
  tara:
    min: 1                      # Always have at least 1 Tara
    max: 3                      # Never more than 3 Taras
    scaleUpThreshold: 5         # Queue > 5 for 2 min → add Tara
    scaleDownThreshold: 0       # Queue empty for 5 min → remove extra
    cooldownSeconds: 120        # Wait between scale actions
    
  devon:
    min: 1
    max: 3
    scaleUpThreshold: 3         # Devon tasks take longer, lower threshold
    scaleDownThreshold: 0
    cooldownSeconds: 120
```

### Agent Registry

```javascript
const agentRegistry = {
  orion: { 
    id: 'orion', 
    status: 'active', 
    permanent: true    // Never scale down
  },
  
  tara: [
    { id: 'tara-1', status: 'active', permanent: true },   // Always on
    { id: 'tara-2', status: 'idle', permanent: false },    // Can retire
    { id: 'tara-3', status: 'offline', permanent: false }, // Spawnable
  ],
  
  devon: [
    { id: 'devon-1', status: 'active', permanent: true },
    { id: 'devon-2', status: 'offline', permanent: false },
    { id: 'devon-3', status: 'offline', permanent: false },
  ]
};
```

### Scale Up Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [10:00:00] System: TaraQueue depth: 6 items                │
│  [10:02:00] System: TaraQueue depth: 7 items (2 min)        │
│                                                              │
│  🚀 [10:02:01] ORION: Scaling up - spawning Tara-2          │
│     (reason: queue > 5 for 2 minutes)                        │
│                                                              │
│  [10:02:02] Tara-2: Online, pulling from TaraQueue          │
│  [10:02:03] Tara-1: Working on 3-3                           │
│  [10:02:03] Tara-2: Working on 3-4                           │  ← Parallel!
└─────────────────────────────────────────────────────────────┘
```

### Scale Down Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [10:30:00] Tara-2: Completed 3-8                            │
│  [10:30:01] System: TaraQueue depth: 0 items                │
│  [10:35:01] System: TaraQueue empty for 5 minutes           │
│                                                              │
│  💤 [10:35:02] ORION: Scaling down - retiring Tara-2        │
│     (reason: queue empty for 5 minutes)                      │
│                                                              │
│  [10:35:03] Tara-2: Offline (graceful shutdown)             │
│  [10:35:04] System: Active agents: Orion, Tara-1, Devon-1   │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Safeguards

| Safeguard | Description |
|-----------|-------------|
| **Cooldown** | Min 2 minutes between scale actions (prevent thrashing) |
| **Graceful Shutdown** | Agent finishes current task before retiring |
| **Min Agents** | Always keep at least 1 Tara, 1 Devon |
| **Max Agents** | Cap to prevent runaway scaling |
| **Rate Limit Awareness** | Pause scaling if API rate limit approaching |
| **Budget Cap** | Pause scaling if daily token budget exceeded |

### Cost-Aware Scaling

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ [11:00:00] ORION: Scale-up blocked                      │
│     (reason: API rate limit at 80%)                          │
│                                                              │
│  💰 [11:00:01] ORION: Daily budget: $2.50 / $5.00           │
│     (scaling paused until budget resets or increased)        │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Avg Queue Depth** | < 3 | Healthy flow, no backlog |
| **Scale Events/Day** | < 10 | Stable, not thrashing |
| **Agent Utilization** | > 70% | Agents are working, not idle |
| **Time to Scale** | < 5 sec | Fast response to demand |

### Implementation Phases

```
Phase 5e: Basic Elastic Scaling
          └── Queue depth monitoring
          └── Manual scale up/down commands
          └── Broadcast all scale events
          
Phase 5f: Auto-Scale Rules
          └── Threshold-based triggers
          └── Cooldown enforcement
          └── Graceful agent shutdown
          
Phase 5g: Cost-Aware Scaling
          └── Rate limit awareness
          └── Budget cap integration
          └── Cost per agent tracking
          
Phase 5h: Predictive Scaling (Future)
          └── Learn queue patterns
          └── Pre-scale before rush
          └── Optimize for cost vs speed
```

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

## 20. Multi-Model AI Council (Escalation System)

### Inspiration

Real-world observation: Different LLMs have different blind spots and strengths. When DeepSeek Reasoner gets stuck on a Lua problem, Gemini 3.0 might have the answer. When Gemini gets stuck, GPT 5.1 might solve it. **No single model knows everything.**

### Concept

When an agent gets stuck after multiple retries, escalate to a "council" of different AI models that collaborate to solve the problem.

```
┌─────────────────────────────────────────────────────────────┐
│                     ESCALATION TIERS                         │
├──────────┬─────────────────────┬────────────────────────────┤
│  Tier 0  │  Normal Operation   │  Agent solves independently │
│  Tier 1  │  Retry Loop         │  Same agent, 2-3 attempts   │
│  Tier 2  │  Orion Escalation   │  Orchestrator reviews       │
│  Tier 3  │  AI Council         │  Multiple LLMs consulted    │
│  Tier 4  │  Human Escalation   │  User intervention          │
└──────────┴─────────────────────┴────────────────────────────┘
```

### AI Council Architecture

```
              ┌─────────────────────┐
              │   Problem Context   │
              │   (Code + Error +   │
              │    Prior Attempts)  │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │DeepSeek │    │ Gemini  │    │   GPT   │    ← Parallel queries
    │Reasoner │    │  3.0    │    │  5.1    │
    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
              ┌─────────────────────┐
              │   Judge / Arbiter   │    ← Evaluates solutions
              │   (Claude/Orion)    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Winning Solution  │    → Back to original agent
              └─────────────────────┘
```

### Model Strengths (Observed)

| Model | Strengths | Best For |
|-------|-----------|----------|
| **DeepSeek Reasoner** | Cost-effective, good reasoning | Standard coding, logic |
| **Gemini 3.0** | Multimodal, broad knowledge | Obscure APIs, visual debugging |
| **GPT 5.1** | Deep coding knowledge, large context | Complex architecture, edge cases |
| **Claude** | Careful analysis, safety-aware | Code review, security, refactoring |
| **Codestral/Qwen** | Fast, specialized for code | Quick fixes, syntax issues |

### Council Workflow

```javascript
async function conveneCouncil(problem) {
  // 1. Prepare problem context
  const context = {
    code: problem.relevantCode,
    error: problem.errorMessage,
    priorAttempts: problem.failedSolutions,
    constraints: problem.requirements
  };

  // 2. Query council members in parallel
  const [deepseekResponse, geminiResponse, gptResponse] = await Promise.all([
    queryDeepSeek(context),
    queryGemini(context),
    queryGPT(context)
  ]);

  // 3. Collect solutions
  const solutions = [
    { model: 'deepseek', solution: deepseekResponse },
    { model: 'gemini', solution: geminiResponse },
    { model: 'gpt', solution: gptResponse }
  ];

  // 4. Judge evaluates solutions
  const winner = await judge.evaluate(solutions, context);

  // 5. Log council decision for learning
  await logCouncilDecision(problem.id, solutions, winner);

  return winner;
}
```

### Judging Criteria

| Criterion | Weight | Evaluation Method |
|-----------|--------|-------------------|
| **Code Correctness** | 40% | Syntax check, type check |
| **Reasoning Quality** | 25% | Explanation clarity, logical steps |
| **Test Pass Rate** | 20% | Run proposed solution against tests |
| **Confidence Score** | 15% | Model's stated confidence |

### Voting Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Majority Vote** | Pick solution most models agree on | Simple problems |
| **Weighted Vote** | Weight by model's historical accuracy | After learning data |
| **Best Reasoning** | Judge picks best-explained solution | Complex problems |
| **Test Winner** | Pick solution that passes most tests | When tests exist |
| **Consensus Build** | Combine best parts of multiple solutions | Architectural questions |

### Cost Management

| Configuration | Models Queried | Est. Cost/Council |
|---------------|----------------|-------------------|
| **Minimal** | DeepSeek + 1 other | ~$0.05 |
| **Standard** | 3 models | ~$0.15 |
| **Full** | 5 models | ~$0.30 |

**Cost Controls:**
- Council only convenes after Tier 1/2 failures
- Daily/weekly council budget cap
- Track council success rate to justify cost

### Learning from Council Decisions

```yaml
council_log:
  problem_id: "2-5-error-3"
  problem_type: "rate_limit_handling"
  models_queried: [deepseek, gemini, gpt]
  winner: gemini
  winner_reason: "Only model that knew Deepseek's specific rate limit headers"
  applied: true
  outcome: success
  
# Over time, learn:
# - Gemini is best for API-specific questions
# - GPT is best for complex architecture
# - DeepSeek is best for standard patterns
```

### Configuration

```yaml
# .env or config
COUNCIL_ENABLED=true
COUNCIL_MODELS=deepseek,gemini,gpt
COUNCIL_JUDGE=claude
COUNCIL_TRIGGER_AFTER_RETRIES=3
COUNCIL_DAILY_BUDGET=5.00
COUNCIL_TIMEOUT_MS=30000
```

### API Key Requirements (BYOK)

```yaml
# User provides keys for models they want in council
DEEPSEEK_API_KEY=xxx
GEMINI_API_KEY=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# Council uses whichever keys are available
# Gracefully degrades if some keys missing
```

### UI Integration

**Activity Log:**
```
[15:32:41] Devon stuck on rate limit handling (attempt 3/3)
[15:32:42] Escalating to AI Council...
[15:32:45] Council convened: DeepSeek, Gemini, GPT
[15:32:58] Gemini solution selected (best API knowledge)
[15:32:59] Applying solution...
[15:33:15] ✅ Tests passing — council successful
```

**Dashboard Panel:**
```
┌─────────────────────────────────────────────────────┐
│  AI Council                              [3 today]  │
├─────────────────────────────────────────────────────┤
│  Last Council: 15:32 — Rate limit handling          │
│  Winner: Gemini (API knowledge)                     │
│  Cost: $0.12                                        │
│                                                     │
│  Success Rate: 87% (13/15 this week)                │
│  Best Model: Gemini (5 wins) > GPT (4) > DS (4)    │
└─────────────────────────────────────────────────────┘
```

### Implementation Phases

```
Phase 7a: Basic Council
          └── Query multiple models in parallel
          └── Simple majority voting
          └── Manual trigger from Orion
          
Phase 7b: Intelligent Judging
          └── Automated judge evaluation
          └── Test-based winner selection
          └── Confidence scoring
          
Phase 7c: Learning & Optimization
          └── Track council outcomes
          └── Learn model strengths
          └── Auto-route by problem type
          
Phase 7d: Cost Optimization
          └── Smart model selection (don't always query all)
          └── Budget management
          └── Caching similar problems
```

### Benefits

- **No single point of failure** — If one model's knowledge has gaps, others fill in
- **Best-of-breed solutions** — Each model contributes its strengths
- **Self-improving** — Learn which models excel at what
- **Reduces human escalation** — Council solves 80%+ of stuck problems
- **BYOK friendly** — Works with whatever keys user provides

### Success Metrics

- **Council Success Rate:** % of problems solved without human escalation
- **Model Win Rate:** Which models provide winning solutions most often
- **Cost per Resolution:** Average council cost when successful
- **Time Saved:** Hours of human debugging avoided

---

## 21. Command Executor Safety (Phase 4)

### Problem

Commands can hang for various reasons:
- Database connections not closing
- Async operations never resolving
- Tests timing out
- Network requests waiting forever
- Commands expecting user input

### Solution: Output-Based Hang Detection

Instead of arbitrary timeouts, monitor command output:

| Pattern | Action |
|---------|--------|
| Continuous output | Working — let it run |
| Output every few seconds | Working — let it run |
| **No output for 30s** | Suspected hang — warn |
| **No output for 60s** | Definitely hung — kill + escalate |

### Implementation

```javascript
async function runCommandSafe(cmd, options = {}) {
  const silenceThreshold = options.silenceThreshold || 30000; // 30s
  const killThreshold = options.killThreshold || 60000; // 60s
  const maxRuntime = options.maxRuntime || 300000; // 5 min absolute max
  
  let lastOutputTime = Date.now();
  let output = '';
  
  const process = spawn(cmd);
  
  // Reset timer on any output
  process.stdout.on('data', (data) => {
    lastOutputTime = Date.now();
    output += data;
    broadcast({ type: 'command_output', cmd, data });
  });
  
  process.stderr.on('data', (data) => {
    lastOutputTime = Date.now();
    output += data;
  });
  
  // Monitor for silence
  const monitor = setInterval(() => {
    const silentFor = Date.now() - lastOutputTime;
    
    if (silentFor > killThreshold) {
      clearInterval(monitor);
      process.kill();
      escalate('Command hung', { cmd, silentFor, lastOutput: output.slice(-500) });
    } else if (silentFor > silenceThreshold) {
      broadcast({ type: 'command_warning', cmd, message: `Silent for ${silentFor/1000}s` });
    }
  }, 5000);
  
  // Absolute safety net
  const absoluteTimeout = setTimeout(() => {
    clearInterval(monitor);
    process.kill();
    escalate('Max runtime exceeded', { cmd, runtime: maxRuntime });
  }, maxRuntime);
  
  process.on('exit', () => {
    clearInterval(monitor);
    clearTimeout(absoluteTimeout);
  });
  
  return process;
}
```

### Preventive Measures Built-In

| Command Type | Safety Flag |
|--------------|-------------|
| Jest tests | `--forceExit --detectOpenHandles` |
| npm install | `--no-optional --prefer-offline` |
| Git operations | Timeout via config |
| Any interactive | `--yes`, `--no-input`, `-y` |

### Activity Log Integration

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [10:00:00] Devon: Running npm test...                       │
│  [10:00:05] System: ✓ Output received                        │
│  [10:00:10] System: ✓ Output received                        │
│  [10:00:15] System: ✓ Output received                        │
│  [10:00:45] System: ⚠️ No output for 30s - monitoring        │
│  [10:01:15] System: 🛑 Command hung (60s silent) - killing   │
│  [10:01:16] System: Escalating to Orion...                   │
└─────────────────────────────────────────────────────────────┘
```

### Escalation on Hang

When a hang is detected:
1. Kill the process
2. Capture last 500 chars of output (for debugging)
3. Log the hang with context
4. Notify Orion
5. Orion decides: retry, skip, or escalate to human

### Non-Blocking Execution (Agent Efficiency)

Agents shouldn't waste time waiting for long commands. If a command takes > 5 seconds:

```javascript
async function executeCommand(cmd, agent) {
  const quickTimeout = 5000; // 5 seconds
  
  const result = await Promise.race([
    runCommand(cmd),
    sleep(quickTimeout).then(() => 'STILL_RUNNING')
  ]);
  
  if (result === 'STILL_RUNNING') {
    // Command is slow — don't block agent
    backgroundMonitor.track(cmd, agent);
    
    broadcast({
      type: 'command_backgrounded',
      cmd,
      message: `Command running in background, ${agent} moving to next task`
    });
    
    // Agent moves on
    return { status: 'backgrounded', checkLater: true };
  }
  
  return result;
}

// Background monitor notifies when done
backgroundMonitor.on('complete', (cmd, result, agent) => {
  agentQueue.push(agent, {
    type: 'check_result',
    cmd,
    result
  });
  
  broadcast({
    type: 'command_complete',
    cmd,
    message: `Background command finished: ${result.success ? '✓' : '✗'}`
  });
});
```

### Activity Log Example

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [10:00:00] Devon: Running npm test for 3-8...              │
│  [10:00:05] System: Command still running, backgrounding    │
│  [10:00:06] Devon: Moving to 3-9 while 3-8 tests run        │
│  [10:00:10] Devon: Starting implementation for 3-9...       │
│  [10:00:45] System: ✓ 3-8 npm test complete (45s)           │
│  [10:00:46] Devon: 3-8 tests passed, continuing 3-9         │
└─────────────────────────────────────────────────────────────┘
```

### Benefits

| Benefit | Impact |
|---------|--------|
| **No wasted time** | Agent works while commands run |
| **Better parallelism** | Multiple commands can run simultaneously |
| **Faster throughput** | Don't block on slow operations |
| **Natural batching** | Start several commands, check results later |

### Commands That Benefit

| Command Type | Typical Time | Background? |
|--------------|--------------|-------------|
| `npm test` | 10-60s | ✅ Yes |
| `npm install` | 30-120s | ✅ Yes |
| `git push` | 5-30s | ✅ Yes |
| Lint | 2-10s | Maybe |
| Single file edit | <1s | No |

### Queue Task Creation: Callback-Based (No Polling)

**Key principle:** Don't poll — use callbacks. Only ONE task created when command completes.

```javascript
function backgroundCommand(cmd, agent, subtaskId) {
  const process = spawn(cmd);
  let output = '';
  
  process.stdout.on('data', (data) => output += data);
  process.stderr.on('data', (data) => output += data);
  
  // Callback fires ONCE when command exits
  process.on('exit', (code) => {
    // NOW add task to agent's queue
    agentQueue.push(agent.id, {
      type: 'check_command_result',
      subtaskId,
      success: code === 0,
      output: output.slice(-2000), // Last 2000 chars
      priority: 'high',
      timestamp: Date.now()
    });
    
    broadcast({
      type: 'background_complete',
      agent: agent.id,
      subtaskId,
      duration: Date.now() - startTime,
      success: code === 0
    });
  });
  
  // NO polling tasks created
  // NO periodic "check if done"
  // Just ONE callback → ONE queue task
}
```

**Why callback-based is better than polling:**

| Polling | Callback |
|---------|----------|
| Creates many "check if done" tasks | Creates ONE task when done |
| Redundant tasks pile up | No redundancy |
| Needs cleanup logic | Self-cleaning |
| Wastes CPU checking | Event-driven, efficient |

### What If Queue is Empty?

When agent finishes all tasks but background command still running:

```javascript
async function getNextTask(agent) {
  // 1. Own queue first
  let task = await agentQueue.pull(agent.id);
  if (task) return task;
  
  // 2. Global unblocked tasks pool
  const unblocked = await getUnblockedTasks();
  const available = unblocked.filter(t => 
    t.role === agent.role && !t.assignedTo
  );
  if (available.length > 0) {
    return assignAndReturn(available[0], agent);
  }
  
  // 3. Truly idle - wait for callback or new work
  agent.setStatus('idle', 'waiting_for_background');
  return null; // Woken by callback or new task assignment
}
```

**Agent stays productive:** Pulls from global pool if own queue empty. Only idles when truly nothing to do.

### Defense in Depth: Multiple Safety Layers

Command line operations are unreliable. Things go wrong. We need **multiple layers of protection**:

```
┌─────────────────────────────────────────────────────────────┐
│              DEFENSE IN DEPTH - COMMAND SAFETY               │
│                                                              │
│  Layer 1: OUTPUT MONITORING (30s silence = warning)         │
│           └── Detects hung commands early                    │
│           └── Kills process → triggers exit callback         │
│                                                              │
│  Layer 2: HANG DETECTION (60s silence = kill)               │
│           └── Force kills unresponsive process               │
│           └── Should trigger exit callback                   │
│                                                              │
│  Layer 3: EXIT CALLBACK                                      │
│           └── Normal path: adds result to queue              │
│           └── If this fires, we're good                      │
│                                                              │
│  Layer 4: ABSOLUTE SAFETY NET (5 min max)                   │
│           └── Runs regardless of other layers                │
│           └── If callback NEVER fired, force cleanup         │
│           └── Manually adds error task to queue              │
│           └── Escalates to Orion                             │
│                                                              │
│  Layer 5: PERIODIC HEALTH CHECK (every 60s)                 │
│           └── Scans ALL tracked background commands          │
│           └── Flags orphaned or stuck processes              │
│           └── Catches anything that slipped through          │
└─────────────────────────────────────────────────────────────┘
```

### Full Implementation with All Safety Layers

```javascript
class CommandExecutor {
  constructor() {
    this.activeCommands = new Map();
    
    // Layer 5: Periodic health check
    setInterval(() => this.healthCheck(), 60000);
  }
  
  async execute(cmd, agent, subtaskId) {
    const id = generateId();
    const startTime = Date.now();
    let callbackFired = false;
    let lastOutputTime = Date.now();
    let output = '';
    
    const process = spawn(cmd);
    
    // Track it
    this.activeCommands.set(id, {
      cmd, agent, subtaskId, process, startTime, lastOutputTime
    });
    
    // Capture output
    process.stdout.on('data', (data) => {
      lastOutputTime = Date.now();
      output += data;
      this.activeCommands.get(id).lastOutputTime = lastOutputTime;
    });
    
    process.stderr.on('data', (data) => {
      lastOutputTime = Date.now();
      output += data;
      this.activeCommands.get(id).lastOutputTime = lastOutputTime;
    });
    
    // Layer 1 & 2: Output monitoring
    const outputMonitor = setInterval(() => {
      const silent = Date.now() - this.activeCommands.get(id)?.lastOutputTime;
      
      if (silent > 60000) {
        // Layer 2: Kill after 60s silence
        console.log(`Killing hung command: ${cmd}`);
        try { process.kill('SIGKILL'); } catch(e) {}
        clearInterval(outputMonitor);
      } else if (silent > 30000) {
        // Layer 1: Warn after 30s silence
        broadcast({ type: 'command_warning', cmd, silent });
      }
    }, 5000);
    
    // Layer 3: Exit callback
    process.on('exit', (code) => {
      callbackFired = true;
      clearInterval(outputMonitor);
      clearTimeout(safetyNet);
      this.activeCommands.delete(id);
      
      agentQueue.push(agent.id, {
        type: 'check_command_result',
        subtaskId,
        success: code === 0,
        output: output.slice(-2000),
        duration: Date.now() - startTime,
        priority: 'high'
      });
    });
    
    // Layer 4: Absolute safety net
    const ABSOLUTE_MAX = 300000; // 5 minutes
    const safetyNet = setTimeout(() => {
      if (!callbackFired) {
        console.error(`SAFETY NET: ${cmd} exceeded ${ABSOLUTE_MAX}ms`);
        clearInterval(outputMonitor);
        
        // Force kill
        try { process.kill('SIGKILL'); } catch(e) {}
        
        // Clean up tracking
        this.activeCommands.delete(id);
        
        // Manually add error to queue
        agentQueue.push(agent.id, {
          type: 'check_command_result',
          subtaskId,
          success: false,
          error: 'SAFETY_NET_TRIGGERED',
          output: output.slice(-2000),
          duration: ABSOLUTE_MAX,
          priority: 'high'
        });
        
        // Escalate
        escalateToOrion({
          type: 'safety_net_triggered',
          cmd, agent: agent.id, subtaskId,
          message: 'Command exceeded max time, callback never fired'
        });
      }
    }, ABSOLUTE_MAX);
    
    return { id, status: 'backgrounded' };
  }
  
  // Layer 5: Periodic health check
  healthCheck() {
    const now = Date.now();
    
    for (const [id, cmd] of this.activeCommands) {
      const runtime = now - cmd.startTime;
      const silent = now - cmd.lastOutputTime;
      
      // Flag anything running > 4 min (before safety net)
      if (runtime > 240000) {
        broadcast({
          type: 'command_long_running',
          cmd: cmd.cmd,
          runtime,
          silent,
          message: 'Command approaching safety net limit'
        });
      }
      
      // Flag orphaned commands (no process)
      if (!cmd.process || cmd.process.killed) {
        console.error(`Orphaned command found: ${id}`);
        this.activeCommands.delete(id);
        
        // Add error to queue
        agentQueue.push(cmd.agent.id, {
          type: 'check_command_result',
          subtaskId: cmd.subtaskId,
          success: false,
          error: 'ORPHANED_COMMAND',
          priority: 'high'
        });
      }
    }
  }
}
```

### Why This Matters

| What Can Go Wrong | Which Layer Catches It |
|-------------------|------------------------|
| Command hangs (no output) | Layer 1 & 2 |
| Process becomes zombie | Layer 4 (safety net) |
| Exit callback never fires | Layer 4 (safety net) |
| Process orphaned | Layer 5 (health check) |
| Multiple things go wrong | All layers work together |

### Activity Log Example: Everything Goes Wrong

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [10:00:00] Devon: npm test backgrounded (cmd-123)          │
│  [10:00:30] System: ⚠️ cmd-123 silent for 30s               │
│  [10:01:00] System: 🛑 cmd-123 silent 60s, killing          │
│  [10:01:01] System: Kill sent, waiting for exit callback... │
│  [10:02:00] System: ⚠️ cmd-123 still tracked, no callback   │
│  [10:04:00] System: ⚠️ cmd-123 approaching safety net       │
│  [10:05:00] System: 🚨 SAFETY NET TRIGGERED                 │
│  [10:05:01] System: Force cleanup, manual queue task added  │
│  [10:05:02] System: Escalating to Orion                     │
│  [10:05:03] Orion: Received safety net alert for cmd-123    │
│  [10:05:04] DevonQueue: Error task added (SAFETY_NET)       │
│  [10:05:10] Devon: Processing error, will retry or escalate │
└─────────────────────────────────────────────────────────────┘
```

**No matter what goes wrong, the system recovers.** Commands can't get permanently stuck.

---

## 22. Queue Infrastructure (Phase 4)

### Vision

Replace manual agent coordination with an **automated queue system** where:
- Tasks flow automatically between agents based on TDD phases
- Orion manages the queues (can override when needed)
- All queue actions are broadcast to Activity Log

### Queue Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATE MACHINE                             │
│              (triggers queue actions on transitions)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  TARA QUEUE   │       │  DEVON QUEUE  │       │  ORION QUEUE  │
│               │       │               │       │               │
│  • Write tests│       │  • Implement  │       │  • PR review  │
│  • Verify     │       │  • Refactor   │       │  • Git ops    │
│  • Int. tests │       │  • Pass tests │       │  • Merge      │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  TARA WORKER  │       │  DEVON WORKER │       │  ORION WORKER │
│  (pulls task) │       │  (pulls task) │       │  (pulls task) │
└───────────────┘       └───────────────┘       └───────────────┘
```

### TDD Queue Flow (Automatic)

| Step | Phase | Current Queue | Action | Next Queue |
|------|-------|---------------|--------|------------|
| 1 | Red | TaraQueue | Write failing tests | → DevonQueue |
| 2 | Green | DevonQueue | Make tests pass | → DevonQueue |
| 3 | Refactor | DevonQueue | Clean up code | → TaraQueue |
| 4 | Int. Red | TaraQueue | Write integration tests | → DevonQueue |
| 5 | Int. Green | DevonQueue | Pass integration tests | → TaraQueue |
| 6 | Verify | TaraQueue | Final verification | → OrionQueue |
| 7 | Complete | OrionQueue | PR, merge, mark done | Done |

### Auto-Generated Orion Tasks

When a subtask starts, Orion's queue auto-populates:

```javascript
// Triggered by: user says "Start 3-1"
orionQueue.addBatch([
  { type: 'git', action: 'create_branch', branch: 'subtask/3-1-api-client' },
  { type: 'status', action: 'update_log', status: 'in_progress' },
  { type: 'status', action: 'update_manifest', status: 'in_progress' },
  { type: 'handoff', action: 'push_to_queue', queue: 'tara', subtaskId: '3-1' },
  { type: 'broadcast', message: 'Starting 3-1, assigned to Tara' }
]);
```

When a subtask completes:

```javascript
// Triggered by: Tara marks verification complete
orionQueue.addBatch([
  { type: 'status', action: 'update_log', status: 'completed' },
  { type: 'status', action: 'update_manifest', status: 'completed' },
  { type: 'git', action: 'merge_branch', branch: 'subtask/3-1-api-client' },
  { type: 'git', action: 'push_remote' },
  { type: 'dependency', action: 'check_unblocked' },  // May trigger more tasks
  { type: 'broadcast', message: '3-1 complete, checking dependencies...' }
]);
```

### Orion Override Powers

Orion has **admin access** to all queues:

```javascript
class OrionQueueManager {
  // View all queues
  getAllQueues() {
    return { tara: taraQueue, devon: devonQueue, orion: orionQueue };
  }
  
  // Skip a TDD step (e.g., skip integration tests for MVP)
  skipStep(subtaskId, step, reason) {
    this.removeFromAllQueues(subtaskId, step);
    this.broadcast({
      type: 'orion_override',
      action: 'skip_step',
      subtaskId, step, reason,
      icon: '⚠️'
    });
    this.advanceToNextStep(subtaskId);
  }
  
  // Force complete a stuck task
  forceComplete(subtaskId, reason) {
    this.removeFromAllQueues(subtaskId);
    this.broadcast({ type: 'orion_override', action: 'force_complete', subtaskId, reason });
    this.markComplete(subtaskId);
  }
  
  // Reset task to earlier step (e.g., bug found, back to Red)
  resetToStep(subtaskId, step, reason) {
    this.broadcast({ type: 'orion_override', action: 'reset', subtaskId, step, reason });
    this.pushToQueue(step === 'red' ? 'tara' : 'devon', subtaskId);
  }
  
  // Reassign (for multi-agent scenarios)
  reassign(subtaskId, fromAgent, toAgent, reason) {
    this.broadcast({ type: 'orion_override', action: 'reassign', subtaskId, fromAgent, toAgent, reason });
    this.moveTask(subtaskId, fromAgent, toAgent);
  }
}
```

### Override Broadcasts

**All overrides are visible in Activity Log:**

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Log                                                │
├─────────────────────────────────────────────────────────────┤
│  [09:15:32] Tara: Tests written for 3-1 (Red)               │
│  [09:15:33] System: 3-1 → Devon's queue                     │
│  [09:18:45] Devon: Implementation complete (Green)           │
│  [09:18:46] System: 3-1 → Devon's queue (refactor)          │
│  [09:19:30] Devon: Refactor complete                         │
│                                                              │
│  ⚠️ [09:19:35] ORION OVERRIDE: Skipping integration tests   │
│     for 3-1 (reason: MVP scope)                              │
│                                                              │
│  [09:19:36] System: 3-1 → Tara's queue (verify)             │
│  [09:20:12] Tara: Verification passed ✓                      │
│  [09:20:13] System: 3-1 → Orion's queue (complete)          │
│  [09:20:30] Orion: Merged subtask/3-1-api-client to master  │
└─────────────────────────────────────────────────────────────┘
```

### Queue Storage (MVP)

For MVP, use PostgreSQL (we already have it):

```sql
CREATE TABLE task_queue (
  id SERIAL PRIMARY KEY,
  subtask_id VARCHAR(20) NOT NULL,
  agent VARCHAR(20) NOT NULL,        -- 'tara', 'devon', 'orion'
  phase VARCHAR(30) NOT NULL,        -- 'red', 'green', 'refactor', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'done'
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Index for fast queue pulls
CREATE INDEX idx_queue_agent_status ON task_queue(agent, status);
```

### Implementation Phases

```
Phase 4a: Queue Tables & Basic CRUD
          └── PostgreSQL queue table
          └── Add/remove/list operations
          └── Agent pull mechanism
          
Phase 4b: State Machine Integration
          └── Transitions trigger queue pushes
          └── Auto-handoff between agents
          └── Broadcast on all queue actions
          
Phase 4c: Orion Override System
          └── Skip, force complete, reset, reassign
          └── All overrides broadcast to Activity Log
          └── Override audit trail
          
Phase 4d: Queue Monitoring
          └── Queue depth metrics
          └── Agent idle time tracking
          └── Dashboard queue visualization
```

### Success Metrics

- **Handoff Time:** < 1 second from phase complete to next agent notified
- **Zero Manual Pushes:** All TDD transitions are automatic
- **Override Audit:** 100% of overrides logged and visible
- **Queue Depth:** Average < 3 items per queue (healthy flow)

---

## References

- System Analysis: `Docs/Development/CodeMaestro_System_Analysis_and_Recommendations.md`
- MVP Spec: `Docs/CodeMaestro_MVP_Consolidated.md`
- Workflow Improvements (Phase 1): `Docs/Workflow_Improvements_Phase1.md`
- RFCs:
  - `Docs/Architecture/RFCs/RFC-0001_Auth_Tenancy.md`
  - `Docs/Architecture/RFCs/RFC-0002_BYOK_Secrets_and_Metering.md`
  - `Docs/Architecture/RFCs/RFC-0003_Model_Adapter_Policy.md`
