/**
 * Seed: Import "Environment & Dependency" workflow.
 * Handles system setup, npm install, and environment health checks.
 */
require('dotenv').config();
const { pool } = require('../connection');
const WorkflowParser = require('../../services/workflowParser');

const envWorkflow = `
# Rule: Environment Setup
Status: active

## States
- **Checking_Env**: Verifying Node, DB, and Tools.
- **Missing_Deps**: Dependencies found missing or outdated.
- **Installing**: Running installation scripts (npm install).
- **Migrating_DB**: Applying database migrations.
- **Verification**: Checking if setup was successful.
- **Ready**: Environment healthy and ready for tasks.
- **Failed**: Setup failed, requires manual intervention.
- **Rolling_Back**: Reverting changes after failure.

## Transitions
- Checking_Env -> Ready: ALL_GOOD
- Checking_Env -> Missing_Deps: MISSING_MODULES
- Checking_Env -> Migrating_DB: PENDING_MIGRATIONS
- Missing_Deps -> Installing: START_INSTALL
- Installing -> Verification: INSTALL_COMPLETE
- Installing -> Rolling_Back: INSTALL_ERROR
- Migrating_DB -> Verification: MIGRATION_COMPLETE
- Verification -> Ready: HEALTH_CHECK_PASS
- Verification -> Failed: HEALTH_CHECK_FAIL
- Rolling_Back -> Failed: ROLLBACK_COMPLETE
- Failed -> Checking_Env: RETRY
`;

async function seed() {
  try {
    console.log('Parsing Environment Workflow...');
    const workflow = WorkflowParser.parse(envWorkflow);
    
    workflow.version = '1.0.0';
    workflow.is_active = true;
    
    workflow.metadata = {
      retry_limit: 3,
      critical: true // If this fails, no other workflows can run
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

