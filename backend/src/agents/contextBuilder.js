const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Context builder for agent execution
 * Ported from scripts/context.js with additional functionality
 */
class ContextBuilder {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..', '..', '..');
  }

  /**
   * Build context for a given subtask ID and optional role
   * @param {string} subtaskId - The subtask ID (e.g., "2-4")
   * @param {string} role - Optional role (tara, devon, orion, adam, una)
   * @returns {Promise<Object>} The context object
   */
  async build(subtaskId, role = null) {
    // Validate subtask ID format
    if (!subtaskId || !/^\d+-\d+$/.test(subtaskId)) {
      throw new Error(`Invalid subtask ID format: ${subtaskId}. Expected format like "1-1"`);
    }

    // 1. Read Role Prompt
    const roleSystemPrompt = await this.loadRolePrompt(role);

    // 2. Read Log
    const logContent = await this.loadLog(subtaskId);

    // 3. Read Rules
    const rules = await this.loadRules();

    // 4. Construct payload
    return {
      role: role || 'Agent',
      system_instruction: roleSystemPrompt,
      task_context: {
        subtask_id: subtaskId,
        content_raw: logContent,
        parsed: this.parseLog(logContent)
      },
      rules: {
        general: rules.general,
        testing: rules.testing
      },
      environment_reminders: [
        "You are running on Windows PowerShell.",
        "Do NOT use '&&'. Use ';' for sequential commands.",
        "Do NOT use 'export VAR=val'. Use '$env:VAR = \"val\"'.",
        "Prefer relative paths."
      ],
      instructions: "ACT as the assigned role. FOLLOW the 'Canonical Loop' defined in the Log. UPDATE the log checklists as you complete items."
    };
  }

  /**
   * Load role prompt from .prompts/ directory
   * @param {string} role - The role name
   * @returns {Promise<string>} The prompt content
   */
  async loadRolePrompt(role) {
    if (!role) {
      return '';
    }

    const rolePrompts = {
      tara: '.prompts/Tara_Tester.md',
      devon: '.prompts/Devon_Developer.md',
      orion: '.prompts/Orion_Orchestrator_v2.md',
      adam: '.prompts/Adam_Architect.md',
      una: '.prompts/Una_UIUX.md'
    };

    const promptFile = rolePrompts[role.toLowerCase()];
    if (!promptFile) {
      throw new Error(`Unknown role: ${role}. Available roles: ${Object.keys(rolePrompts).join(', ')}`);
    }

    const promptPath = path.join(this.rootDir, promptFile);
    try {
      return await fs.promises.readFile(promptPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to load prompt for role ${role}: ${error.message}`);
    }
  }

  /**
   * Load subtask log from YAML file
   * @param {string} subtaskId - The subtask ID
   * @returns {Promise<string>} The raw log content
   */
  async loadLog(subtaskId) {
    const logPath = path.join(this.rootDir, 'Agents', 'Subtasks', 'Logs', `${subtaskId}.yml`);
    try {
      return await fs.promises.readFile(logPath, 'utf8');
    } catch (error) {
      throw new Error(`Task not found: ${subtaskId}. Log file does not exist at ${logPath}`);
    }
  }

  /**
   * Parse YAML log content into object
   * @param {string} logContent - Raw YAML content
   * @returns {Object} Parsed log object
   */
  parseLog(logContent) {
    try {
      return yaml.load(logContent);
    } catch (error) {
      // Return raw content if parsing fails
      console.warn(`Failed to parse YAML log: ${error.message}`);
      return { raw: logContent };
    }
  }

  /**
   * Load rules from .clinerules directory
   * @returns {Promise<Object>} Object with general and testing rules
   */
  async loadRules() {
    const testRulesPath = path.join(this.rootDir, '.clinerules', 'workflows', 'Test_Workflows.md');
    const generalRulesPath = path.join(this.rootDir, '.clinerules', 'clineRules.md');

    let testRules = 'Rules file not found.';
    let generalRules = 'Rules file not found.';

    try {
      testRules = await fs.promises.readFile(testRulesPath, 'utf8');
    } catch (error) {
      // File might not exist, use default message
    }

    try {
      generalRules = await fs.promises.readFile(generalRulesPath, 'utf8');
    } catch (error) {
      // File might not exist, use default message
    }

    return {
      testing: testRules,
      general: generalRules
    };
  }

  /**
   * Get list of available subtasks
   * @returns {Promise<Array<string>>} Array of subtask IDs
   */
  async listSubtasks() {
    const logsDir = path.join(this.rootDir, 'Agents', 'Subtasks', 'Logs');
    try {
      const files = await fs.promises.readdir(logsDir);
      return files
        .filter(file => file.endsWith('.yml'))
        .map(file => file.replace('.yml', ''));
    } catch (error) {
      throw new Error(`Failed to list subtasks: ${error.message}`);
    }
  }
}

module.exports = new ContextBuilder();
module.exports.ContextBuilder = ContextBuilder;
