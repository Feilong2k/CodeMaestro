/**
 * Seed: Import "Orion Request Lifecycle" workflow into the database.
 * Handles the high-level negotiation between User and Orion (Project Inception, Clarification, Approval).
 */
require('dotenv').config();
const { pool } = require('../connection');
const WorkflowParser = require('../../services/workflowParser');

const requestWorkflow = `
# Rule: Orion Request Lifecycle
Status: active

## States
- **Idle**: System waiting for new user intent.
- **Analysis**: Strategic Brain analyzing feasibility, complexity, and routing.
- **Clarification**: AI asking clarifying questions (max 3 loops).
- **Planning**: Generating architectural plan and subtasks.
- **Approval**: Presenting plan to User for sign-off.
- **Partial_Approval**: User approved some tasks but rejected others (Granular).
- **Execution**: Orchestrator delegating approved tasks to Agents.
- **Debrief**: Reviewing results and learning patterns.
- **Parked**: Context switched (User interrupted with urgent task).
- **Locked**: Security/Permission block requiring explicit override.
- **Archived**: Stale/Abandoned workflow (GC).

## Transitions
- Idle -> Analysis: USER_MESSAGE
- Analysis -> Clarification: AMBIGUOUS_REQ
- Analysis -> Planning: CLEAR_REQ
- Analysis -> Locked: SECURITY_RISK
- Analysis -> Idle: IMPOSSIBLE_REQ
- Clarification -> Analysis: USER_RESPONSE
- Clarification -> Planning: MAX_LOOPS_REACHED (Defaulting)
- Planning -> Approval: PLAN_READY
- Approval -> Execution: APPROVED_FULL
- Approval -> Partial_Approval: APPROVED_PARTIAL
- Partial_Approval -> Execution: START_APPROVED
- Partial_Approval -> Planning: REPLAN_REJECTED
- Approval -> Planning: REJECTED (Change Request)
- Approval -> Parked: INTERRUPT_EVENT
- Execution -> Debrief: ALL_TASKS_COMPLETE
- Execution -> Locked: CRITICAL_ERROR
- Debrief -> Idle: SESSION_CLOSE
- Clarification -> Archived: TIMEOUT_24H
- Approval -> Archived: TIMEOUT_24H
- Parked -> Analysis: RESUME_CONTEXT
`;

async function seed() {
  try {
    console.log('Parsing Orion Request Lifecycle...');
    const workflow = WorkflowParser.parse(requestWorkflow);
    
    // Enrich with metadata
    workflow.version = '1.1.0';
    workflow.is_active = true;
    
    // Add Metadata for GC and Logic that Parser misses
    workflow.metadata = {
      timeouts: {
        Clarification: 86400, // 24h in seconds
        Approval: 86400,
        Parked: 604800 // 7 days
      },
      max_loops: {
        Clarification: 3
      },
      concurrency: 'instance_based' // Supports multiple active requests per user
    };

    console.log('Inserting into DB...');
    const query = `
      INSERT INTO workflows (name, version, states, transitions, is_active, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE 
      SET states = $3, transitions = $4, is_active = $5, metadata = $6, updated_at = NOW()
      RETURNING id, name;
    `;

    const values = [
      workflow.name, 
      workflow.version, 
      JSON.stringify(workflow.states), 
      JSON.stringify(workflow.transitions || []),
      workflow.is_active,
      JSON.stringify(workflow.metadata)
    ];

    const res = await pool.query(query, values);
    console.log(`✅ Seeded workflow: ${res.rows[0].name} (${res.rows[0].id})`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();

