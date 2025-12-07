/**
 * Seed: Import "Bug Triage & Fix" workflow.
 * Handles bug reporting, severity analysis, routing (Tactical vs Strategic), and verification.
 */
require('dotenv').config();
const { pool } = require('../connection');
const WorkflowParser = require('../../services/workflowParser');

const bugWorkflow = `
# Rule: Bug Triage & Fix
Status: active

## States
- **New**: Bug reported by User or Agent.
- **Triage**: Automated analysis of severity and reproducibility.
- **Quick_Fix**: Routed to Tactical Agent (Low/Med complexity).
- **Escalated**: Routed to Strategic Agent (High complexity/Security/Tactical Failed).
- **Verification**: Testing the fix (Tara).
- **Closed**: Fix confirmed and merged.
- **Wont_Fix**: Rejected (Not a bug, duplicate, or out of scope).
- **Stale**: No activity for > 24h (Timeout).

## Transitions
- New -> Triage: REPORT_RECEIVED
- Triage -> Quick_Fix: LOW_SEVERITY
- Triage -> Escalated: HIGH_SEVERITY
- Triage -> Escalated: SECURITY_ISSUE
- Triage -> Wont_Fix: INVALID_REPORT
- Quick_Fix -> Verification: FIX_IMPLEMENTED
- Quick_Fix -> Escalated: FIX_FAILED (Devon gave up)
- Escalated -> Verification: FIX_IMPLEMENTED
- Verification -> Closed: TESTS_PASS
- Verification -> Quick_Fix: TESTS_FAIL (Retry)
- Verification -> Escalated: TESTS_FAIL_REPEATED (Complex regression)
- Quick_Fix -> Stale: TIMEOUT_24H
- Escalated -> Stale: TIMEOUT_48H
- Stale -> Triage: ACTIVITY_RESUMED
`;

async function seed() {
  try {
    console.log('Parsing Bug Triage Workflow...');
    const workflow = WorkflowParser.parse(bugWorkflow);
    
    workflow.version = '1.0.0';
    workflow.is_active = true;
    
    // Metadata for the Engine
    workflow.metadata = {
      timeouts: {
        Quick_Fix: 86400, // 24h
        Escalated: 172800 // 48h
      },
      roles: {
        Quick_Fix: 'devon', // Tactical
        Escalated: 'orion', // Strategic
        Verification: 'tara'
      }
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

