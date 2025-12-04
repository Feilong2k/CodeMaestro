const fs = require('fs');
const path = require('path');
// const yaml = require('js-yaml'); // Removed dependency

// Usage: node scripts/next-tasks.js
// Outputs a list of tasks that are READY to be picked up (status=pending AND all deps=completed).

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'Agents', 'Subtasks', 'manifest.yml');
const logsDir = path.join(rootDir, 'Agents', 'Subtasks', 'Logs');

try {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifest not found');
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  // Helper to parse the manifest text manually (Brittle but works for our specific file format)
  const subtasks = [];
  const lines = manifestContent.split('\n');
  let currentTask = null;

  lines.forEach(line => {
    const idMatch = line.match(/- id: "(.*)"/);
    if (idMatch) {
      if (currentTask) subtasks.push(currentTask);
      currentTask = { id: idMatch[1], status: 'pending', dependencies: [] };
    }

    if (currentTask) {
      const statusMatch = line.match(/status: (.*)/);
      if (statusMatch) currentTask.status = statusMatch[1].trim();
      
      const titleMatch = line.match(/title: "(.*)"/);
      if (titleMatch) currentTask.title = titleMatch[1].trim();
    }
  });
  if (currentTask) subtasks.push(currentTask);

  // Now, for each pending task, read its LOG file to find dependencies.
  const completedIds = new Set(subtasks.filter(t => t.status === 'completed').map(t => t.id));
  const readyTasks = [];

  subtasks.forEach(task => {
    if (task.status !== 'pending') return;

    const logPath = path.join(logsDir, `${task.id}.yml`);
    let isBlocked = false;

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      // Parse dependencies: ["1-1", "1-6"]
      const depMatch = logContent.match(/dependencies: \[(.*)\]/);
      if (depMatch) {
        const deps = depMatch[1].split(',').map(s => s.trim().replace(/"/g, ''));
        
        deps.forEach(depId => {
          if (depId && !completedIds.has(depId)) {
            isBlocked = true;
          }
        });
      }
    }

    if (!isBlocked) {
      readyTasks.push(task);
    }
  });

  console.log('---------------------------------------------------');
  console.log('✅ READY TO START (Dependencies Met):');
  console.log('---------------------------------------------------');
  if (readyTasks.length === 0) {
    console.log('No tasks ready (everything is either done or blocked).');
  } else {
    readyTasks.forEach(t => {
      console.log(`- [${t.id}] ${t.title || 'Untitled'}`);
    });
  }
  console.log('---------------------------------------------------');

} catch (err) {
  console.error('Error:', err.message);
}
