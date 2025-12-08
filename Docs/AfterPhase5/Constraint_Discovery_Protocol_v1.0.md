# Constraint Discovery Protocol - Implementation Guide
# Tiered approach based on decision scope and model capability

================================================================================
## OVERVIEW
================================================================================

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONSTRAINT DISCOVERY TIERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  TIER 1: ARCHITECTURAL    │  Full v4  │  GPT-5.1 / Gemini 3               │
│  TIER 2: TASK             │  LITE v3  │  DeepSeek DeepThink               │
│  TIER 3: SUBTASK          │  Current  │  DeepSeek DeepThink               │
└─────────────────────────────────────────────────────────────────────────────┘
```

================================================================================
## ⚠️ EMPIRICAL FINDINGS: MODEL BEHAVIOR
================================================================================

**Test Case**: "Worktree Trap" - Hidden physical constraint where Git branches
share the same working directory, causing checkout conflicts.

### Test Results

| Model + Mode | Protocol Used | Caught Physical Constraint? |
|--------------|---------------|----------------------------|
| GPT (standard) | None | ❌ No |
| GPT (standard) | LITE v1 | ❌ No |
| GPT (standard) | LITE v2 | ❌ No |
| GPT (standard) | LITE v3 | ❌ No |
| GPT (standard) | **Full v3** | ✅ Yes |
| DeepSeek (standard) | **Minimal/Current** | ✅ Yes |
| DeepSeek (DeepThink) | None | ✅ Yes |

### Key Finding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODEL REASONING STYLES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DeepSeek: "Physics-first" reasoning                                       │
│    └── Even minimal prompting triggers physical constraint thinking        │
│    └── DeepThink mode does it automatically                                │
│    └── Lower protocol overhead needed                                      │
│                                                                             │
│  GPT: "Logic-first" reasoning                                              │
│    └── Excellent at following logical rules                                │
│    └── Needs EXPLICIT prompt to check physical reality                     │
│    └── Full v3's "Physical vs Logical Check" is the critical trigger      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Practical Implication

```
⚠️ WARNING: LITE protocols do NOT reliably catch physical constraints
   with GPT models. Use Full v3 minimum for any decision involving:
   
   - Git workflows (branches, worktrees, clones)
   - File system operations (concurrent access)
   - Database connections (locks, transactions)
   - Network resources (ports, connections)
   - Shared memory / state between processes
```

### Updated Protocol Selection by Model

| Tier | If Using DeepSeek | If Using GPT |
|------|-------------------|--------------|
| **Tier 1** (Architectural) | Full v3 (adds structure) | **Full v4** (mandatory) |
| **Tier 2** (Task) | LITE v3 ✅ | Full v3 ⚠️ |
| **Tier 3** (Subtask) | Current ✅ | LITE v3 ⚠️ |

**Key insight**: DeepSeek can use lighter protocols. GPT needs one tier heavier.

================================================================================
## TIER 1: ARCHITECTURAL DECISIONS
================================================================================

### When to Use
- Database technology changes (PostgreSQL → MongoDB, adding Vector DB)
- Git workflow changes (branching strategy, worktree decisions)
- New external system integrations
- Agent execution model changes
- Core infrastructure changes

### Model + Protocol
- **Model:** GPT-5.1 or Gemini 3 (strongest available)
- **Protocol:** Full v4 (Gap Analysis + Conditional Verdict)
- **Alternative:** DeepSeek DeepThink + Full v3 (budget option)

### Triggers
| Change Type | Use Tier 1? |
|-------------|-------------|
| Database migration | ✅ YES |
| Git workflow change | ✅ YES |
| New external system | ✅ YES |
| Execution model change | ✅ YES |
| New framework/language | ✅ YES |

================================================================================
## TIER 2: TASK LEVEL
================================================================================

### When to Use
- Multi-subtask features
- Features involving shared resources
- Cross-agent coordination
- New tool implementations
- Phase-level planning

### Model + Protocol
- **Model:** DeepSeek DeepThink
- **Protocol:** LITE v3 (Assumptions + Verification)
- **If using GPT:** Upgrade to Full v3

### Triggers
| Feature Type | Use Tier 2? |
|--------------|-------------|
| New tool in registry | ✅ YES |
| Multi-subtask feature | ✅ YES |
| Cross-agent workflow | ✅ YES |
| Database operations | ✅ YES |
| API with side effects | ✅ YES |

================================================================================
## TIER 3: SUBTASK LEVEL
================================================================================

### When to Use
- Single-concern, well-scoped work
- Backend implementations
- UI components with state
- Individual endpoints
- Unit-level features

### Model + Protocol
- **Model:** DeepSeek DeepThink
- **Protocol:** Current (from subtask logs)
- **If using GPT:** Upgrade to LITE v3

### Triggers
| Work Type | Use Tier 3? |
|-----------|-------------|
| Single endpoint | ✅ YES |
| Single UI component | ✅ YES |
| Single service method | ✅ YES |
| Bug fix | ✅ YES |
| Refactoring (scoped) | ✅ YES |

================================================================================
## DECISION FLOWCHART
================================================================================

```
                    ┌─────────────────────────┐
                    │   NEW WORK ITEM         │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ ARCHITECTURAL CHANGE?   │
                    │ (DB, Git, Integration)  │
                    └───────────┬─────────────┘
                                │
              YES ◄─────────────┼─────────────► NO
               │                               │
               ▼                               ▼
        ┌─────────────┐              ┌─────────────────────────┐
        │  TIER 1     │              │ MULTI-SUBTASK OR        │
        │  Full v4    │              │ SHARED RESOURCES?       │
        │  GPT-5.1    │              └───────────┬─────────────┘
        └─────────────┘                          │
                                   YES ◄─────────┼─────────► NO
                                    │                        │
                                    ▼                        ▼
                             ┌─────────────┐         ┌─────────────┐
                             │  TIER 2     │         │  TIER 3     │
                             │  LITE v3    │         │  Current    │
                             │  DeepThink  │         │  DeepThink  │
                             └─────────────┘         └─────────────┘
```

================================================================================
## COUNCIL OF MODELS (TIER 1)
================================================================================

For critical architectural decisions, use multiple models:

```
┌──────────────────┐     ┌──────────────────┐
│   GPT + Full v4  │     │ DeepSeek + v3    │
│   (Logic expert) │     │ (Physics expert) │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └───────────┬────────────┘
                     │
              ┌──────▼──────┐
              │   ORION     │
              │  Synthesize │
              │   UNION     │
              └─────────────┘

GPT catches: Logical gaps, specification ambiguities
DeepSeek catches: Physical constraints, real-world blockers
Together: Comprehensive coverage
```

================================================================================
## COMPLETE PROTOCOL TEXTS
================================================================================

### LITE v3 Protocol (Full Text)

```
Run this plan through Constraint Discovery Protocol (LITE v3):

PART 1: ASSUMPTIONS AUDIT
List ALL assumptions in the plan (minimum 10):

| # | Assumption | Explicit/Implicit | What breaks if FALSE? | Risk |
|---|------------|-------------------|----------------------|------|
| 1 | ...        | ...               | ...                  | H/M/L|

PART 2: SYSTEM CAPABILITIES CHECK
For each system/tool mentioned:

| System | What plan requires | Can it do that? | Limitations |
|--------|-------------------|-----------------|-------------|
| Git    | ...               | Yes/No          | ...         |

PART 3: IMPOSSIBILITY SCAN
Is anything PHYSICALLY IMPOSSIBLE?
- Operations that contradict each other?
- Resources used in mutually exclusive ways?
- Timing requirements that cannot be met?

PART 4: ASSUMPTION VERIFICATION (CRITICAL)
For each MEDIUM/HIGH risk assumption:
- Breaking condition: When does this assumption break?
- Does it ACTUALLY APPLY to this plan?
- Use CONCRETE details to verify.
- Verdict: SAFE / AT RISK / BROKEN

PART 5: FINAL VERDICT
1. CONFIRMED SAFE assumptions: [list]
2. AT RISK assumptions: [list with conditions]
3. BROKEN assumptions: [list]
4. OVERALL: FULLY FEASIBLE / CONDITIONALLY FEASIBLE / NOT FEASIBLE
5. RECOMMENDED CHANGES: [if any]
```

---

### Full v3 Protocol (Catches Worktree Trap)

```
Run this plan through Constraint Discovery Protocol (Full v3):

PART 1: RESOURCE ANALYSIS
| Resource | Current State | Who Uses It | Exclusive/Shared |
|----------|--------------|-------------|------------------|

PART 2: OPERATION ANALYSIS (CRITICAL)
| Operation | Physical Change? | Locks? | 2 Actors Simultaneously? |
|-----------|-----------------|--------|--------------------------|

PART 3: ACTOR ANALYSIS
| Actor | Resources They Touch | Same Resource Same Time? |
|-------|---------------------|-------------------------|

PART 4: ASSUMPTION AUDIT (minimum 10)
| # | Assumption | Explicit/Implicit | Breaks if FALSE | Risk |
|---|------------|-------------------|-----------------|------|

PART 5: PHYSICAL VS LOGICAL CHECK (CRITICAL - Catches Worktree Trap)
For each "separation" claimed:
| Claimed Separation | Mechanism | Physical/Logical | If Mechanism Fails? |
|-------------------|-----------|------------------|---------------------|
| "Different files" | File paths | Logical          | Same disk/locks      |
| "Different branches" | Git refs | Logical        | SAME WORKING DIR!    |

KEY: If two actors work "separately," do they share PHYSICAL resources?
(disk, ports, memory, working directory)

PART 6: FINAL VERDICT
1. Physical constraints discovered: [list]
2. Logical separations sharing physical resources: [HIGH RISK]
3. VERDICT: SAFE / CONDITIONALLY SAFE / UNSAFE
4. RECOMMENDED MITIGATIONS: [if any]
```

---

### Full v4 Protocol (Gap Analysis + Conditional)

```
Run this plan through Constraint Discovery Protocol v4:

PART 1-5: Same as Full v3 (above)

PART 6: GAP ANALYSIS (CRITICAL)
What is NOT SPECIFIED in this plan?
| Gap | Possible Interpretations | Answer Under Each |
|-----|-------------------------|-------------------|
| ... | A: ... / B: ... / C: ... | A→X, B→Y, C→Z    |

List ALL ambiguities. Do NOT assume intent.

PART 7: CONDITIONAL VERDICT
- IF [condition A] THEN [conclusion A]
- IF [condition B] THEN [conclusion B]

Gaps MUST Be Clarified:
1. ...

Status: APPROVED / CONDITIONALLY APPROVED / BLOCKED
```

---

### Current Protocol (Tier 3 - Subtask Level)

This is the YAML-based format embedded in subtask logs. Used for single-concern work.

```yaml
constraint_discovery:
  subtask_id: "5-X"
  owner: "Devon"              # Agent responsible
  concern: "Area of Focus"    # e.g., "Data Integrity", "File Safety"
  date: "YYYY-MM-DD"
  
  # What actions will be performed?
  atomic_actions:
    - action: "Action Name"
      description: "What it does"
    - action: "Another Action"
      description: "What it does"
      
  # What resources will be touched?
  resources_touched:
    - resource: "Resource Name"    # e.g., "PostgreSQL", "File System"
      action: "Read/Write/Lock"
      notes: "Risk or concern"
      
  # Physical constraints and mitigations
  resource_physics:
    - resource: "Resource Name"
      constraint: "Physical Limitation"  # e.g., "Race Conditions"
      risk: "What could go wrong"
      mitigation: "How to prevent it"
```

**Real Example (from 5-2 Task Queue):**

```yaml
constraint_discovery:
  subtask_id: "5-2"
  owner: "Devon"
  concern: "Data Integrity & Concurrency"
  date: "2025-12-07"
  
  atomic_actions:
    - action: "Enqueue Task"
      description: "Add new job to DB"
    - action: "Dequeue Task"
      description: "Worker claims job (Locking)"
    - action: "Complete Task"
      description: "Mark job as done with result"
    - action: "Fail Task"
      description: "Mark job as failed with error"
      
  resources_touched:
    - resource: "PostgreSQL"
      action: "Row Locking"
      notes: "High concurrency potential"
      
  resource_physics:
    - resource: "Database Connections"
      constraint: "Race Conditions"
      risk: "Two agents claim same task"
      mitigation: "SELECT ... FOR UPDATE SKIP LOCKED"
    - resource: "Task State"
      constraint: "Stalled Jobs"
      risk: "Agent crashes, task remains 'running' forever"
      mitigation: "Timeout/Heartbeat mechanism (Future) or Manual Reset"
```

================================================================================
## PROTOCOL SELECTION CHEATSHEET
================================================================================

| Scenario | Protocol | Model | Why |
|----------|----------|-------|-----|
| "Is worktree needed?" | Full v3 | Any | Physical vs Logical check |
| "Can agents work parallel?" | Full v3 | Any | Actor + Physical check |
| "Should we change DB?" | Full v4 | GPT | Gap Analysis for ambiguity |
| "New tool safe?" | LITE v3 | DeepSeek | Assumption verification |
| "Multi-subtask plan" | LITE v3 | DeepSeek | System capabilities check |
| "Single endpoint" | Current | DeepSeek | Basic resource tracking |

================================================================================
## QUICK REFERENCE
================================================================================

### When Using GPT

```
⚠️ GPT requires heavier protocols than DeepSeek

Tier 1: Full v4 (mandatory)
Tier 2: Full v3 (not LITE!)
Tier 3: LITE v3 (not Current!)
```

### When Using DeepSeek

```
✅ DeepSeek naturally reasons about physical constraints

Tier 1: Full v3 (structure helps)
Tier 2: LITE v3 (sufficient)
Tier 3: Current (sufficient)

DeepThink mode: Even lighter protocols work
```

================================================================================
## INTEGRATION WITH CODEMAESTRO
================================================================================

### In Subtask Logs (Tier 3)
```yaml
# Agents/Subtasks/Logs/5-X.yml
constraint_discovery:
  tier: 3
  model: "deepseek-deepthink"
  protocol: "current"
  # ... rest of current format
```

### In Task Planning (Tier 2)
```yaml
# Task-level planning document
constraint_analysis:
  tier: 2
  model: "deepseek-deepthink"
  protocol: "lite-v3"
  assumptions:
    - assumption: "..."
      risk: "HIGH"
      verified: true/false
  verdict: "..."
```

### In Architecture Decisions (Tier 1)
```yaml
# Docs/Architecture/Decision-XXX.yml
constraint_analysis:
  tier: 1
  model: "gpt-5.1"
  protocol: "full-v4"
  gaps_identified:
    - gap: "..."
      interpretations: [...]
      clarified: true/false
  conditional_verdict:
    - condition: "..."
      conclusion: "..."
  final_decision: "..."
  gaps_resolved: true/false
```

================================================================================
## RELATED DOCUMENTS
================================================================================

- `Git_Workflow_Guide.md` - Branch strategy and sync patterns
- `Multi_Agent_Scaling_Architecture.md` - Clone vs worktree decisions
- `Self_Evolution_Workflow.md` - CI/CD and deployment process

================================================================================

