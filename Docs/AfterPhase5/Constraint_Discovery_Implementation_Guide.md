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

### Protocol Template (Full v4)
```
Run this plan through Constraint Discovery Protocol v4:

PART 1: Resource Analysis
- List all resources touched
- For each: current state, who uses it, exclusive or shared?

PART 2: Operation Analysis  
- List all operations (verbs/actions)
- For each: physical change, locks, can two actors do simultaneously?

PART 3: Actor Analysis
- List all actors
- Cross-reference: same resource at same time?

PART 4: Assumption Audit
- List 10+ assumptions (explicit vs implicit)
- What breaks if false? Risk level?

PART 5: Physical vs Logical Check
- For each "separation" claimed: logical vs physical mechanism?

PART 6: Gap Analysis (CRITICAL)
- What is NOT specified?
- List ALL possible interpretations
- Answer under EACH interpretation

PART 7: Conditional Verdict
- IF [X] THEN [conclusion]
- Which gaps MUST be clarified?
```

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

### Protocol Template (LITE v3)
```
Run this through Constraint Discovery Protocol:

PART 1: Assumptions Audit
- List ALL assumptions (at least 10)
- Explicit or Implicit?
- What breaks if FALSE?
- Risk level: LOW / MEDIUM / HIGH

PART 2: System Capabilities Check
- What does plan require each system to do?
- Can it do that?
- What limitations exist?

PART 3: Impossibility Scan
- Is anything physically impossible?

PART 4: Assumption Verification (CRITICAL)
For each MEDIUM/HIGH risk assumption:
- What is the breaking condition?
- Does it ACTUALLY APPLY to this plan?
- Use concrete details from the plan.

PART 5: Final Verdict
- Which assumptions are confirmed safe?
- Which have breaking conditions that apply?
- Overall feasibility?
```

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

### Protocol Template (Current)
```yaml
constraint_discovery:
  subtask_id: "[ID]"
  owner: "[Agent]"
  concern: "[Area]"
  date: "[Date]"
  
  atomic_actions:
    - action: "[Action Name]"
      description: "[What it does]"
      
  resources_touched:
    - resource: "[Resource]"
      action: "[Read/Write/Lock]"
      notes: "[Risks]"
      
  resource_physics:
    - resource: "[Resource]"
      constraint: "[Physical limitation]"
      risk: "[What could go wrong]"
      mitigation: "[How to prevent]"
      
  verification:
    - action: "[Test name]"
      method: "[How to verify]"
```

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
## QUICK REFERENCE CARD
================================================================================

| Question | Answer |
|----------|--------|
| Changing database? | Tier 1 (v4 + GPT-5.1) |
| Changing git workflow? | Tier 1 (v4 + GPT-5.1) |
| New external integration? | Tier 1 (v4 + GPT-5.1) |
| Multi-subtask feature? | Tier 2 (LITE v3 + DeepThink) |
| New tool implementation? | Tier 2 (LITE v3 + DeepThink) |
| Single endpoint/component? | Tier 3 (Current + DeepThink) |
| Bug fix? | Tier 3 (Current + DeepThink) |
| UI display only? | Skip protocol |
| Documentation? | Skip protocol |

================================================================================
## MODEL SELECTION RATIONALE
================================================================================

| Model | Strength | Used For |
|-------|----------|----------|
| **GPT-5.1 / Gemini 3** | Highest reasoning capability | Architectural (rare, high impact) |
| **DeepSeek DeepThink** | Strong natural reasoning, cost-effective | Tasks & Subtasks (frequent) |

### Why DeepSeek for Tiers 2 & 3?
- Naturally surfaces scenarios (as demonstrated in worktree test)
- DeepThink mode does v4-level analysis without explicit protocol
- Cost-effective for frequent use
- Protocol provides structure; model provides reasoning

### Why GPT-5.1/Gemini 3 for Tier 1?
- Architectural decisions have highest impact
- Worth the cost for rare, critical decisions
- Full v4 protocol ensures thoroughness
- Double-checking with strongest model reduces risk

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

PART 5: PHYSICAL VS LOGICAL CHECK (CRITICAL)
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

================================================================================
## PROTOCOL SELECTION CHEATSHEET
================================================================================

| Scenario | Protocol | Why |
|----------|----------|-----|
| "Is worktree needed?" | Full v3 | Physical vs Logical check |
| "Can agents work parallel?" | Full v3 | Actor + Physical check |
| "Should we change DB?" | Full v4 | Gap Analysis for ambiguity |
| "New tool safe?" | LITE v3 | Assumption verification |
| "Multi-subtask plan" | LITE v3 | System capabilities check |
| "Single endpoint" | Current | Basic resource tracking |

================================================================================

