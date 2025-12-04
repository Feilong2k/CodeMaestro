const fs = require('fs');
const path = require('path');

// Usage: node scripts/context.js <subtask-id> [role] [output-file]
// Roles: tara, devon, orion, adam, una
// Example: node scripts/context.js 1-1 tara context.json

const rootDir = path.resolve(__dirname, '..');
const subtaskId = process.argv[2];
const role = process.argv[3] ? process.argv[3].toLowerCase() : null;
const outputFile = process.argv[4];

if (!subtaskId) {
  console.error('Usage: node scripts/context.js <subtask-id> [role] [output-file]');
  console.error('Available roles: tara, devon, orion, adam, una');
  process.exit(1);
}

// File Paths
const logPath = path.join(rootDir, 'Agents', 'Subtasks', 'Logs', `${subtaskId}.yml`);
const testRulesPath = path.join(rootDir, '.clinerules', 'workflows', 'Test_Workflows.md');
const generalRulesPath = path.join(rootDir, '.clinerules', 'clineRules.md');

// Role Prompts Map
const rolePrompts = {
  tara: '.prompts/Tara_Tester.md',
  devon: '.prompts/Devon_Developer.md',
  orion: '.prompts/Orion_Orchestrator_v2.md',
  adam: '.prompts/Adam_Architect.md',
  una: '.prompts/Una_UIUX.md'
};

try {
  // 1. Read Role Prompt
  let roleSystemPrompt = '';
  if (role && rolePrompts[role]) {
    const promptPath = path.join(rootDir, rolePrompts[role]);
    if (fs.existsSync(promptPath)) {
      roleSystemPrompt = fs.readFileSync(promptPath, 'utf8');
    }
  }

  // 2. Read Log
  if (!fs.existsSync(logPath)) {
    throw new Error(`Log file not found: ${logPath}`);
  }
  const logContent = fs.readFileSync(logPath, 'utf8');

  // 3. Read Rules
  const testRulesContent = fs.existsSync(testRulesPath) ? fs.readFileSync(testRulesPath, 'utf8') : 'Rules file not found.';
  const generalRulesContent = fs.existsSync(generalRulesPath) ? fs.readFileSync(generalRulesPath, 'utf8') : 'Rules file not found.';

  // 4. Construct JSON Payload
  const payload = {
    role: role || 'Agent',
    system_instruction: roleSystemPrompt,
    task_context: {
      subtask_id: subtaskId,
      content_raw: logContent // Keeping raw YAML as string is often easier for LLMs to read than converting to JSON object without a parser
    },
    rules: {
      general: generalRulesContent,
      testing: testRulesContent
    },
    environment_reminders: [
      "You are running on Windows PowerShell.",
      "Do NOT use '&&'. Use ';' for sequential commands.",
      "Do NOT use 'export VAR=val'. Use '$env:VAR = \"val\"'.",
      "Prefer relative paths."
    ],
    instructions: "ACT as the assigned role. FOLLOW the 'Canonical Loop' defined in the Log. UPDATE the log checklists as you complete items."
  };

  const outputString = JSON.stringify(payload, null, 2);

  if (outputFile) {
    fs.writeFileSync(outputFile, outputString);
    console.log(`JSON Context briefing for [${role || 'generic'}] written to ${outputFile}`);
  } else {
    console.log(outputString);
  }

} catch (err) {
  console.error('Error generating context:', err.message);
  process.exit(1);
}
