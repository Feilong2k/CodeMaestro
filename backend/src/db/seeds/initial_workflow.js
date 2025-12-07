/**
 * Seed: Import standard TDD workflow into the database
 */
require('dotenv').config();
const { pool } = require('../connection');
const WorkflowParser = require('../../services/workflowParser');

const standardTDD = `
# Rule: Standard TDD
Status: active

## States
- **Pending**: Task is waiting to start
- **Red**: Failing tests (Unit Phase)
- **Green**: Passing tests (Implementation Phase)
- **Refactor**: Cleanup and optimization (Cleanup Phase)
- **Review**: Ready for QA/Code Review
- **Completed**: Task finished and merged

## Transitions
- Pending -> Red: START_TASK
- Red -> Green: TESTS_PASS
- Green -> Refactor: IMPLEMENTATION_COMPLETE
- Refactor -> Review: REFACTOR_COMPLETE
- Review -> Completed: APPROVE
- Review -> Red: REJECT (Logic Issue)
- Review -> Refactor: REJECT (Code Quality)
`;

async function seed() {
  try {
    console.log('Parsing workflow...');
    const workflow = WorkflowParser.parse(standardTDD);
    
    // Add extra metadata for the engine (which the parser might skip for now)
    workflow.version = '1.0.0';
    workflow.is_active = true;

    console.log('Inserting into DB...');
    const query = `
      INSERT INTO workflows (name, version, states, transitions, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE 
      SET states = $3, transitions = $4, updated_at = NOW()
      RETURNING id, name;
    `;

    // Note: Our parser currently puts transitions INTO states or as a separate object?
    // Let's check parser implementation. It returns { states: {...}, transitions: [...] }
    // We store them as JSONB columns.

    const values = [
      workflow.name, 
      workflow.version, 
      JSON.stringify(workflow.states), 
      JSON.stringify(workflow.transitions || []), // Ensure transitions exist
      workflow.is_active
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

