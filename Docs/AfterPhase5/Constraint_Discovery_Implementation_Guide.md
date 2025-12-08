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
## PROTOCOL FILES REFERENCE
================================================================================

| Protocol | File Location |
|----------|---------------|
| Full v4 | `Docs/Tests/Protocol_v3_Test_Prompt.md` (update to v4) |
| LITE v3 | `Docs/Tests/Protocol_LITE_v3_Test_Prompt.md` |
| Current | Embedded in subtask logs |

================================================================================

