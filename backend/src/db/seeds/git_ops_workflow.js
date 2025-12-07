/**
 * Seed: Import "Git Operations" workflow.
 * Enforces the Branching & PR Policy (e.g., Cleanup after merge).
 */
require('dotenv').config();
const { pool } = require('../connection');
const WorkflowParser = require('../../services/workflowParser');

const gitWorkflow = `
# Rule: Git Operations
Status: active

## States
- **Clean_Working_Tree**: No uncommitted changes.
- **Branch_Created**: Feature/Fix branch exists.
- **Staged**: Changes added to index.
- **Committed**: Changes saved locally.
- **Pushed**: Changes sent to remote.
- **PR_Open**: Pull Request created.
- **PR_Approved**: Code Review passed.
- **Merged**: Changes merged to master.
- **Conflict_Detected**: Merge conflict requiring manual resolution.
- **Cleanup_Done**: Branch deleted (Parking Rule).

## Transitions
- Clean_Working_Tree -> Branch_Created: GIT_CHECKOUT_B
- Branch_Created -> Staged: GIT_ADD
- Staged -> Committed: GIT_COMMIT
- Committed -> Pushed: GIT_PUSH
- Pushed -> PR_Open: CREATE_PR
- PR_Open -> PR_Approved: REVIEW_PASS
- PR_Open -> Branch_Created: REVIEW_REQUEST_CHANGES
- PR_Approved -> Merged: MERGE_SQUASH
- Merged -> Cleanup_Done: DELETE_BRANCH (Mandatory)
- Pushed -> Conflict_Detected: MERGE_CONFLICT
- Conflict_Detected -> Staged: CONFLICT_RESOLVED
- Clean_Working_Tree -> Staged: GIT_ADD_WARN (Allowed but warns to create branch)
`;

async function seed() {
  try {
    console.log('Parsing Git Operations Workflow...');
    const workflow = WorkflowParser.parse(gitWorkflow);
    
    workflow.version = '1.0.0';
    workflow.is_active = true;
    
    workflow.metadata = {
      enforcement: 'strict', // Engine should block actions if transition invalid
      auto_actions: {
        Merged: 'DELETE_BRANCH' // Trigger cleanup automatically
      }
    };

    console.log('Inserting into DB...');
    const query = `
      INSERT INTO workflows (name, version, states, transitions, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE 
      SET states = $3, transitions = $4, updated_at = NOW()
      RETURNING id, name;
    `;

    const values = [
      workflow.name, 
      workflow.version, 
      JSON.stringify(workflow.states), 
      JSON.stringify(workflow.transitions || []),
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

