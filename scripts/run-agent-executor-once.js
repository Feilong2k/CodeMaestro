/*
 Tiny runner to verify AgentExecutor + DB FSM logging (6-1).
 - Enqueues a small task for Orion with a demo subtaskId
 - Runs AgentExecutor.executeTask once
 - Prints agent_fsm_log rows for the demo subtaskId

 Usage:
   node scripts/run-agent-executor-once.js
   (the script will auto-load backend/.env)
*/

// Auto-load backend/.env so DATABASE_URL is available like the backend server
try {
  const path = require('path');
  const envPath = path.resolve(__dirname, '../backend/.env');
  let dotenv;
  try {
    dotenv = require('dotenv');
  } catch (e1) {
    // Fallback to backend's local dependency
    dotenv = require(path.resolve(__dirname, '../backend/node_modules/dotenv'));
  }
  dotenv.config({ path: envPath });
  if (!process.env.DATABASE_URL) {
    console.warn('[runner] Warning: DATABASE_URL not set after loading backend/.env');
  }
} catch (e) {
  console.warn('[runner] Warning: failed to load backend/.env:', e.message);
}

const AgentExecutor = require('../backend/src/services/AgentExecutor').AgentExecutor;
const TaskQueueService = require('../backend/src/services/TaskQueueService');
const AgentFsmLogService = require('../backend/src/services/AgentFsmLogService');

(async () => {
  try {
    const demoSubtaskId = `6-1-demo-${Date.now()}`;

    // Enqueue a simple task for Orion; payload carries subtaskId and a trivial query
    const task = await TaskQueueService.enqueue('Orion', {
      subtaskId: demoSubtaskId,
      query: 'noop: verify fsm logging',
      requestedAt: new Date().toISOString()
    });

    console.log('[runner] Enqueued task id =', task.id, 'subtaskId =', demoSubtaskId);

    // Run the executor with a small step budget
    const executor = new AgentExecutor({ maxSteps: 3 });
    await executor.executeTask(task.id);
    console.log('[runner] Executor run complete. Fetching FSM rows...');

    // Fetch and print DB rows for our demo subtaskId
    const rows = await AgentFsmLogService.getTransitionsBySubtask(demoSubtaskId);
    if (!rows || rows.length === 0) {
      console.log('[runner] No rows found in agent_fsm_log for subtaskId =', demoSubtaskId);
    } else {
      console.log('[runner] agent_fsm_log rows for', demoSubtaskId, ':');
      rows.forEach(r => {
        console.log(`${r.timestamp} | ${r.agent}: ${r.from_state} -> ${r.to_state}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('[runner] Failed:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
