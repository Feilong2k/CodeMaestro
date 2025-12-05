## 24. Split-Brain Orchestration (Strategic vs. Tactical)

### Concept
Optimize capabilities and cost by splitting the Orchestrator role into two distinct tiers: **Orion-Strategic (Brain)** and **Orion-Tactical (Ops)**. This leverages high-intelligence models for decision-making and cost-effective models for routine operations.

### The Split

| Role | **Orion-Strategic (Brain)** 🧠 | **Orion-Tactical (Ops)** 🤖 |
| :--- | :--- | :--- |
| **Model** | Gemini 1.5 Pro / Claude 3.5 Sonnet / GPT-4o | DeepSeek V3 / GPT-4o-mini / Haiku |
| **Cost Profile** | High ($$$) - Low Volume | Low (¢) - High Volume |
| **Key Responsibilities** | • **Planning:** Breaking vague requests into subtasks<br>• **Review:** Assessing code quality & PRs<br>• **Conflict:** Resolving complex merge conflicts<br>• **Recovery:** Root cause analysis for errors | • **Status:** Updating `manifest.yml` & Logs<br>• **Routing:** Applying deterministic rules<br>• **Git:** Executing checkout/merge/push<br>• **Reporting:** Summarizing logs |

### Implementation Strategy
1.  **Default to Tactical:** The system runs on the Tactical model by default.
2.  **Escalate on Complexity:** If a decision requires reasoning, planning, or complex review, the Tactical model invokes the Strategic model.
3.  **Handoff:** Strategic model makes the decision and hands back instructions to Tactical model for execution.

### Benefits
-   **Cost Efficiency:** 90% of orchestrator actions (status updates, simple routing) are handled by cheap models.
-   **High Intelligence:** Critical decisions (planning, debugging) still get SOTA reasoning.
-   **Latency:** Tactical operations are faster with lighter models.

---

## References

- System Analysis: `Docs/Development/CodeMaestro_System_Analysis_and_Recommendations.md`
- MVP Spec: `Docs/CodeMaestro_MVP_Consolidated.md`
- Workflow Improvements (Phase 1): `Docs/Workflow_Improvements_Phase1.md`
- RFCs:
  - `Docs/Architecture/RFCs/RFC-0001_Auth_Tenancy.md`
  - `Docs/Architecture/RFCs/RFC-0002_BYOK_Secrets_and_Metering.md`
  - `Docs/Architecture/RFCs/RFC-0003_Model_Adapter_Policy.md`
