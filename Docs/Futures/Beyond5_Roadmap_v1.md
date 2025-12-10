# Beyond5 Roadmap v1

## Overview
This roadmap outlines the evolution of Orion’s architecture and capabilities beyond Phase 5, focusing on three sequential milestones:

1. **Two‑Tiered Consultative Brain** – Replace the current split‑brain routing with a unified first‑level brain (DeepSeek‑Reasoner) that can consult a second‑level specialist for architectural decisions and constraint discovery.
2. **Critical Tool Improvements** – Enhance the toolset available to the first‑level brain to match the fluency of Cline/Cursor (search, clarification loop, project‑awareness).
3. **Phase 6 Body Awareness** – Implement system‑level health checks, monitoring, and resilience features.

Each milestone is designed to build on the previous one, ensuring that foundational changes are stable before adding complexity.

---

## Milestones

### Milestone 1: Two‑Tiered Brain Structure (Weeks 1‑2)
**Goal**: Deliver a unified chat experience where Orion understands natural‑language requests directly and can consult a specialist for complex decisions.

**Deliverables**:
1. `UnifiedAdapter` – A single LLM adapter using DeepSeek‑Reasoner with function‑calling for all tools.
2. `StrategicConsultant` service – A second‑level brain (Gemini‑3/GPT‑4) with built‑in Constraint Discovery Protocol Full v4.
3. `consultArchitect` tool – First‑level brain can call this tool to get structured analysis of architectural/security/scalability questions.
4. Updated `OrionAgent.chat` – Removes tactical/strategic routing heuristics, uses `UnifiedAdapter` for all natural‑language requests, keeps local router only for explicit commands (`list docs`, `read Docs/…`).

**Acceptance Criteria**:
- User can say “Refactor the chat panel to use virtual scrolling” and Orion automatically decomposes the task, calls tools, and optionally consults the specialist for accessibility/performance implications.
- Consultation occurs for clear architectural triggers (e.g., “database,” “security,” “scalability,” “architecture”) without over‑consulting on simple requests.
- System Log shows consultation events and constraint‑discovery gaps.

### Milestone 2: Critical Tool Improvements (Weeks 3‑4)
**Goal**: Equip the first‑level brain with the tools that make Cline/Cursor so effective.

**Deliverables**:
1. **Enhanced FileSystemTool** – Add `search` (grep) and `fileTree` navigation.
2. **Clarification Tool** – A built‑in mechanism for the LLM to ask one short, focused question when intent is ambiguous.
3. **Project‑Awareness Tool** – Reads `package.json`, `tsconfig.json`, `.gitignore` etc. to inform the LLM about project structure and dependencies.
4. **Multi‑Step Session Tool** – Maintains a goal stack and progress within a conversation (enables “now update the CSS too” without re‑explaining).

**Acceptance Criteria**:
- User can say “Find all uses of `useFocus` in the codebase” and Orion returns a list of files and lines.
- When a request is ambiguous (“Can you make a todo list?”), Orion asks “Do you want me to create a todo.md file, or just explain how?”
- Orion knows the project is Vue 3 + TypeScript and tailors its suggestions accordingly.
- Complex refactors are handled as a single session with step‑by‑step progress tracked.

### Milestone 3: Phase 6 Body Awareness (Weeks 5‑6)
**Goal**: Make Orion self‑monitoring and resilient.

**Deliverables**:
1. **Health‑Check Service** – Periodic validation of LLM API connectivity, database latency, disk space, and tool availability.
2. **System‑Log Dashboard** – Real‑time visualization of agent states, consultation calls, and constraint‑discovery findings.
3. **Circuit‑Breaker Patterns** – Automatic fallback to mock modes or cached responses when external services are down.
4. **Performance Metrics** – Track response latency, tool‑call success rates, and consultation costs.

**Acceptance Criteria**:
- Orion logs a warning when DeepSeek‑Reasoner API latency exceeds 5 s.
- The dashboard shows a live stream of state transitions (`OBSERVE` → `THINK` → `ACT`).
- If Gemini‑3 is unavailable, consultations gracefully degrade to a local rule‑based checklist.
- Weekly report of API usage, error rates, and user satisfaction (via implicit signals).

---

## Constraint Discovery Protocol Analysis (Full v4)

### PART 1: RESOURCE ANALYSIS
| Resource | Current State | Who Uses It | Exclusive/Shared |
|----------|---------------|-------------|------------------|
| **DeepSeek‑Reasoner API** | External, rate‑limited (first‑level) | UnifiedAdapter (all chat) | Shared (global quota) |
| **Gemini‑3/GPT‑4 API** | External, higher cost (second‑level) | StrategicConsultant | Shared (architectural queries) |
| **Development Team** | 1‑2 developers (assumed) | All milestones | Exclusive (same people) |
| **File System** | Project root (CodeMaestro) | All tools | Shared (concurrent access) |
| **Database (PostgreSQL)** | Existing, stable | OrionAgent, TaskQueue | Shared |
| **WebSocket Connections** | Live frontend connections | System Log, dashboard | Shared |

### PART 2: OPERATION ANALYSIS
| Operation | Physical Change? | Locks? | 2 Actors Simultaneously? |
|-----------|-----------------|--------|--------------------------|
| **Implement UnifiedAdapter** | Yes (code changes) | Git branch lock | No (single developer) |
| **Add search to FileSystemTool** | Yes (new code) | None | Yes (can be done in parallel) |
| **Deploy health‑checks** | Yes (new services) | None | Yes (independent) |
| **Run consultations** | No (external API) | Rate‑limit throttle | Yes (queued) |

### PART 3: ACTOR ANALYSIS
| Actor | Resources They Touch | Same Resource Same Time? |
|-------|---------------------|-------------------------|
| **Developer** | Codebase, Git, deployment | No (sequential work) |
| **UnifiedAdapter** | DeepSeek‑Reasoner API, tools | Yes (multiple users) |
| **StrategicConsultant** | Gemini‑3/GPT‑4 API | Yes (shared quota) |
| **Health‑Check Service** | System resources (disk, API) | Yes (periodic scans) |

### PART 4: ASSUMPTION AUDIT (minimum 10)
| # | Assumption | Explicit/Implicit | Breaks if FALSE | Risk |
|---|------------|-------------------|-----------------|------|
| 1 | DeepSeek‑Reasoner function‑calling works as documented | Implicit | UnifiedAdapter cannot call tools | High |
| 2 | Development capacity is 1‑2 FTEs for 6 weeks | Explicit | Milestones slip, quality suffers | High |
| 3 | Gemini‑3/GPT‑4 API key is available and funded | Explicit | Second‑level brain unusable | High |
| 4 | Existing tool registry (Phase 5) is stable and extensible | Explicit | New tools cannot be added | Medium |
| 5 | Users will accept slightly higher latency for consultations | Implicit | User dissatisfaction, abandonment | Medium |
| 6 | No major disruptions (e.g., critical bugs in production) | Implicit | Resources diverted to fire‑fighting | Medium |
| 7 | File‑system concurrency issues are rare in practice | Implicit | Data corruption, lost edits | High |
| 8 | WebSocket infrastructure can handle additional event volume | Explicit | System Log becomes unreliable | Low |
| 9 | The team can design an effective clarification‑loop prompt | Implicit | Orion still misinterprets ambiguous requests | Medium |
| 10 | Health‑checks can be added without destabilizing the live system | Explicit | New bugs introduced, downtime | Medium |

### PART 5: PHYSICAL VS LOGICAL CHECK
| Claimed Separation | Mechanism | Physical/Logical | If Mechanism Fails? |
|-------------------|-----------|------------------|---------------------|
| “Milestones are sequential” | Workflow: complete 1 before 2, 2 before 3 | Logical | Developer time is physical; overlap may be required |
| “Consultations are independent of tool execution” | Different API endpoints, separate code paths | Logical | Both share network, API quota, and error‑handling (physical) |
| “Health‑checks observe without affecting performance” | Lightweight, periodic probes | Logical | Probe overhead slows system (physical) |

### PART 6: GAP ANALYSIS
| Gap | Possible Interpretations | Answer Under Each |
|-----|-------------------------|-------------------|
| **What defines “critical” tool improvements?** | A) Only search & clarification B) Also project‑awareness & multi‑step C) Everything Cline has | A → Limited improvement. B → Balanced. C → Over‑scope. |
| **How to measure success of the two‑tiered brain?** | A) User satisfaction survey B) Tool‑call success rate C) Reduction in “failed” chat requests | A → Subjective. B → Measurable. C → Hard to attribute. |
| **What if DeepSeek‑Reasoner changes its API?** | A) Adapt quickly B) Have a fallback LLM C) Accept downtime | A → Requires monitoring. B → Need backup adapter. C → Unacceptable. |
| **Who decides when a consultation is needed?** | A) Hard‑coded keywords B) LLM confidence score C) User explicit ask | A → Brittle. B → Unreliable. C → Burdens user. |
| **How to handle consultation timeouts?** | A) Fail silently B) Retry C) Proceed without consultation | A → Missed constraints. B → Increased latency. C → Riskier decisions. |

### PART 7: CONDITIONAL VERDICT

**IF** the following conditions are met:
1. DeepSeek‑Reasoner function‑calling is reliable and stays stable for the duration of Milestone 1.
2. The team can dedicate focused development time (1‑2 FTE) without being pulled into unrelated production issues.
3. A clear, prompt‑based heuristic for consultations is defined and tested (e.g., keyword‑triggered initially, later confidence‑based).
4. A file‑locking or queueing mechanism is implemented before rolling out to multiple concurrent users.
5. Health‑checks are designed to be non‑intrusive and have a defined rollback plan.

**THEN** the roadmap is **CONDITIONALLY APPROVED** and likely to deliver a significantly more fluent and reliable Orion.

**ELSE** (if any condition fails) the roadmap risks **cost overruns, missed deadlines, or a system that remains brittle**.

**Gaps that MUST be clarified before starting**:
1. **Consultation trigger** – Start with a narrow keyword list (`architecture`, `security`, `scalability`, `design`) and expand after validation.
2. **Fallback strategy** – If the second‑level brain is unavailable, the first‑level brain should proceed with a warning, not block.
3. **Concurrency control** – Decide whether to implement a simple file‑write queue before Milestone 2.

**Status: CONDITIONALLY APPROVED**

**Recommended Mitigations**:
- **Weekly validation checkpoints** – At the end of each week, verify that DeepSeek‑Reasoner API behavior hasn’t changed.
- **Feature‑flag consultations** – Roll out the consultation tool only to internal users first.
- **Automated regression tests** – Ensure tool‑calling success rate stays above 95% after each change.
- **Budget monitoring** – Track API costs daily to avoid surprise overages.

---
*Document generated by Adam (Architect) on 2025‑12‑09. Last updated: 2025‑12‑09.*
