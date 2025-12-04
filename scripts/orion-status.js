const fs = require('fs');
const path = require('path');

// Usage: node scripts/orion-status.js <subtask-id> <new-status>
// Example: node scripts/orion-status.js 1-3 completed
//
// Valid statuses: pending, in_progress, completed, blocked
//
// This script enforces that ONLY Orion (orchestrator) can change the status field.
// Devon and Tara should update their checklist sections and notes, but NOT status.

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'blocked'];

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/orion-status.js <subtask-id> <new-status>');
  console.error('Example: node scripts/orion-status.js 1-3 completed');
  console.error(`Valid statuses: ${VALID_STATUSES.join(', ')}`);
  process.exit(1);
}

const [subtaskId, newStatus] = args;

if (!VALID_STATUSES.includes(newStatus)) {
  console.error(`Invalid status: "${newStatus}"`);
  console.error(`Valid statuses: ${VALID_STATUSES.join(', ')}`);
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const logPath = path.join(rootDir, 'Agents', 'Subtasks', 'Logs', `${subtaskId}.yml`);
const manifestPath = path.join(rootDir, 'Agents', 'Subtasks', 'manifest.yml');

// Update the log file
if (!fs.existsSync(logPath)) {
  console.error(`Log file not found: ${logPath}`);
  process.exit(1);
}

let logContent = fs.readFileSync(logPath, 'utf8');
const oldStatusMatch = logContent.match(/^status: (.*)$/m);
const oldStatus = oldStatusMatch ? oldStatusMatch[1].trim() : 'unknown';

// Update status
logContent = logContent.replace(/^status: .*$/m, `status: ${newStatus}`);

// Update outcome if completing
if (newStatus === 'completed') {
  logContent = logContent.replace(/^outcome: .*$/m, 'outcome: success');
}

// Update lastUpdated and updatedBy
const timestamp = new Date().toISOString();
logContent = logContent.replace(/^lastUpdated: .*$/m, `lastUpdated: ${timestamp}`);
logContent = logContent.replace(/^updatedBy: .*$/m, 'updatedBy: orchestrator');

fs.writeFileSync(logPath, logContent, 'utf8');

// Also update the manifest
if (fs.existsSync(manifestPath)) {
  let manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  // Find the subtask block and update its status
  // This is a bit tricky with regex, so we do a simple line-by-line approach
  const lines = manifestContent.split('\n');
  let inTargetSubtask = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're entering the target subtask
    if (line.match(new RegExp(`- id: "${subtaskId}"`))) {
      inTargetSubtask = true;
    }
    // Check if we're entering a different subtask
    else if (line.match(/- id: "/) && inTargetSubtask) {
      inTargetSubtask = false;
    }
    
    // Update status line within target subtask
    if (inTargetSubtask && line.match(/^\s+status:/)) {
      lines[i] = line.replace(/status: .*/, `status: ${newStatus}`);
    }
  }
  
  fs.writeFileSync(manifestPath, lines.join('\n'), 'utf8');
}

console.log('---------------------------------------------------');
console.log(`✅ Status updated for subtask ${subtaskId}`);
console.log(`   ${oldStatus} → ${newStatus}`);
console.log(`   Log: ${logPath}`);
console.log(`   Manifest: ${manifestPath}`);
console.log(`   Timestamp: ${timestamp}`);
console.log('---------------------------------------------------');

