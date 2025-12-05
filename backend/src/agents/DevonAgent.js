const BaseAgent = require('./BaseAgent');

/**
 * DevonAgent - developer agent that implements code to satisfy tests.
 */
class DevonAgent extends BaseAgent {
  constructor() {
    super('devon');
    this.prompt = this.loadPrompt('Devon_Developer_v2');
  }

  /**
   * Execute developer workflow and return desired actions.
   * @param {Object} context
   * @returns {Promise<{actions: Array}>}
   */
  async execute(context = {}) {
    const actions = [];
    try {
      const task = context.currentTask;
      if (!task) return { actions };

      const subtaskId = task.id;

      // Implement code when pending / backend/frontend task
      if (task.status === 'pending') {
        const targetPath =
          context.targetPath ||
          (context.taskType === 'frontend'
            ? 'frontend/src/index.js'
            : 'backend/src/index.js');
        actions.push(this.implementCode(subtaskId, context.testFile, targetPath));
        actions.push(this.writeImplementationFile(subtaskId, targetPath));
      }

      // Refactor when flagged
      if (task.status === 'in_progress' && context.refactorNeeded) {
        actions.push(this.refactorCode(subtaskId));
      }

      // Fix failing tests when errors provided
      if (task.status === 'in_progress' && Array.isArray(context.testErrors)) {
        actions.push(this.fixFailingTests(subtaskId, context.testErrors));
      }
    } catch (error) {
      return { actions, error: error.message };
    }

    return { actions };
  }

  implementCode(subtaskId, testFile, targetPath) {
    return {
      type: 'implementCode',
      subtaskId,
      testFile,
      targetPath
    };
  }

  refactorCode(subtaskId) {
    return {
      type: 'refactorCode',
      subtaskId
    };
  }

  fixFailingTests(subtaskId, errors = []) {
    return {
      type: 'fixFailingTests',
      subtaskId,
      errors
    };
  }

  writeImplementationFile(subtaskId, filePath) {
    // Minimal placeholder implementation content
    const content = `// Auto-generated implementation stub for ${subtaskId}
function placeholder() {
  return true;
}

module.exports = { placeholder };
`;
    return {
      type: 'writeImplementationFile',
      subtaskId,
      filePath,
      content
    };
  }
}

module.exports = DevonAgent;

