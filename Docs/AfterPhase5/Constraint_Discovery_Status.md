# Constraint Discovery Protocol - Implementation Status & Plan

## Status Summary

| Tier | Protocol | Model | Status | Location |
|------|----------|-------|--------|----------|
| **Tier 3** | Current (YAML) | DeepSeek DeepThink | ✅ **Implemented** | Subtask logs (5-1, 5-3, etc.) |
| **Tier 2** | LITE v3 | DeepSeek DeepThink | 📋 **Future Feature** | Manual for now |
| **Tier 1** | Full v4 | GPT-5.1 / Gemini 3 | 📋 **Future Feature** | Manual for now |
| **Tier 0** | Council of Models | Multiple | 📋 **Future Feature** | Manual for now |

---

## Current State (MVP)

### Tier 3 - Implemented ✅

**Format in subtask logs:**
```yaml
constraint_discovery:
  subtask_id: "5-X"
  owner: "Agent"
  concern: "Area"
  date: "YYYY-MM-DD"
  
  atomic_actions:
    - action: "..."
      description: "..."
      
  resources_touched:
    - resource: "..."
      action: "..."
      notes: "..."
      
  resource_physics:
    - resource: "..."
      constraint: "..."
      risk: "..."
      mitigation: "..."
      
  verification:
    - action: "..."
      method: "..."
```

**Used in:** 5-1 (Tool Registry), 5-3 (Agent Loop), and other backend subtasks.

---

## Manual Process (Until Automated)

### For Architectural Decisions (Manual Tier 1)

1. Create prompt using Full v4 template
2. Run through GPT-5.1 / Gemini 3
3. Optionally run Council of Models (GPT + Gemini + DeepSeek)
4. Synthesize gaps and conditions
5. Document in `Docs/Architecture/Decision-XXX.md`

**Template location:** `Docs/Tests/v4_Analysis_Protocol_Implementation.md`

### For Task-Level Planning (Manual Tier 2)

1. Use LITE v3 template with DeepSeek DeepThink
2. Focus on assumptions and verification
3. Document in task planning notes

**Template location:** `Docs/Tests/Protocol_LITE_v3_Test_Prompt.md`

---

## Future Automation Roadmap

### Phase 1: Classification Logic (Foundation)
- [ ] Define exact tier boundary criteria with examples
- [ ] Implement decision flow in Orchestrator
- [ ] Target: >90% classification accuracy

### Phase 2: Tier 2 Integration
- [ ] Automate LITE v3 prompts for task-level work
- [ ] Integrate DeepSeek DeepThink API
- [ ] Add assumption verification step with human review

### Phase 3: Tier 1 Integration
- [ ] Automate Full v4 prompts for architectural triggers
- [ ] Implement Hard Fail policy (no auto-downgrade)
- [ ] Add escalation path (Tier 3 → 2 → 1)

### Phase 4: Council of Models
- [ ] Parallel execution to multiple models
- [ ] Synthesis logic (union of concerns)
- [ ] Consolidated gap report

---

## Key Gaps to Address (From Council Analysis)

| Priority | Gap | Source |
|----------|-----|--------|
| 🔴 Critical | Tier boundary criteria (exact + examples) | All models |
| 🔴 Critical | Model failure policy (Hard Fail) | Gemini |
| 🔴 Critical | Escalation mechanism | DeepSeek |
| 🟡 High | Classification accuracy monitoring | DeepSeek |
| 🟡 High | API throttling/queueing | GPT |
| 🟡 High | Under-classification gaming prevention | DeepSeek |

---

## Files Reference

| File | Purpose |
|------|---------|
| `Docs/Constraint_Discovery_Implementation_Guide.md` | Full implementation guide |
| `Docs/Tests/Protocol_LITE_v3_Test_Prompt.md` | LITE v3 template |
| `Docs/Tests/Protocol_v3_Test_Prompt.md` | Full v3 template |
| `Docs/Tests/v4_Analysis_Protocol_Implementation.md` | v4 analysis template |
| `Agents/Subtasks/Logs/*.yml` | Tier 3 examples |

---

## Decision: MVP Scope

**In MVP:**
- ✅ Tier 3 (Current YAML format in subtask logs)
- ✅ Manual execution of Tier 1/2 as cases arise

**Post-MVP:**
- 📋 Automated Tier 2 (LITE v3 + DeepThink)
- 📋 Automated Tier 1 (Full v4 + GPT-5.1)
- 📋 Council of Models for critical decisions
- 📋 Classification logic in Orchestrator

