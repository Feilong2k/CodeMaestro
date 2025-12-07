const subtaskMachine = require('../machines/subtaskMachine');
const { pool } = require('../db/connection');

class OrchestratorService {
  constructor(database = pool, notifier = null) {
    this.db = database;
    this.notifier = notifier;
    this.machines = new Map(); // Map subtaskId -> machine instance
  }

  // ==================== Concern-Based Locking ====================

  /**
   * Acquire a lock for a task and concern.
   * @param {string} taskId 
   * @param {string} concern 
   * @param {string} agentId 
   * @returns {Promise<Object>} Lock record
   */
  async acquireLock(taskId, concern, agentId) {
    // 1. Check existing lock
    const result = await this.db.query(
      'SELECT * FROM locks WHERE task_id = $1 AND concern = $2',
      [taskId, concern]
    );

    if (result.rows.length > 0) {
      const existingLock = result.rows[0];
      // 2. Re-entrant lock: same agent
      if (existingLock.agent_id === agentId) {
        return existingLock;
      }
      // 3. Locked by another agent
      throw new Error(`Concern ${concern} is already locked by ${existingLock.agent_id}`);
    }

    // 4. No lock exists, insert new lock
    const insertResult = await this.db.query(
      `INSERT INTO locks (task_id, concern, agent_id, locked_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [taskId, concern, agentId]
    );
    return insertResult.rows[0];
  }

  /**
   * Release a lock for a task and concern.
   * @param {string} taskId 
   * @param {string} concern 
   * @returns {Promise<boolean>} Success
   */
  async releaseLock(taskId, concern) {
    await this.db.query(
      'DELETE FROM locks WHERE task_id = $1 AND concern = $2',
      [taskId, concern]
    );
    return true;
  }

  // ==================== Territory Rules ====================

  /**
   * Check if an agent is allowed to edit a file path based on concern.
   * @param {string} agentId 
   * @param {string} concern 
   * @param {string} filePath 
   * @returns {boolean}
   */
  checkTerritory(agentId, concern, filePath) {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Tara: tests concern
    if (agentId === 'tara' && concern === 'tests') {
      return normalizedPath.includes('__tests__') || normalizedPath === 'package.json';
    }

    // Devon: implementation concern
    if (agentId === 'devon' && concern === 'implementation') {
      // Allow any path that contains '/src/' (or starts with 'src/') and is not a test file
      const isSourceFile = (normalizedPath.includes('/src/') || normalizedPath.startsWith('src/')) &&
                          !normalizedPath.includes('__tests__');
      return isSourceFile;
    }

    // Orion: allow all
    if (agentId === 'orion') {
      return true;
    }

    // Default: block
    return false;
  }

  // ==================== Protected Paths ====================

  /**
   * Determine if a file path is protected (requires explicit approval).
   * @param {string} filePath 
   * @returns {boolean}
   */
  isProtectedPath(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const protectedPatterns = [
      /^\.env$/,
      /^config\/.*/,
      /^backend\/src\/db\/migrations\/.*/,
      /^Docs\/Operational_Rules\.md$/,
      /^Docs\/env\.contract\.md$/,
      /^package\.json$/
    ];
    return protectedPatterns.some(pattern => pattern.test(normalizedPath));
  }

  // ==================== Branching Logic ====================

  /**
   * Generate a branch name following Factory Floor model.
   * @param {string} taskId 
   * @param {string} concern 
   * @returns {string}
   */
  getBranchName(taskId, concern) {
    const standardConcerns = ['tests', 'implementation', 'design', 'review'];
    if (standardConcerns.includes(concern)) {
      return `feature/${taskId}-${concern}`;
    } else {
      return `subtask/${taskId}-${concern}`;
    }
  }

  /**
   * Alias for getBranchName (for backward compatibility with tests).
   * @param {string} taskId 
   * @param {string} concern 
   * @returns {string}
   */
  getConcernBranchName(taskId, concern) {
    return this.getBranchName(taskId, concern);
  }

  // ==================== Existing Subtask State Machine Methods ====================

  /**
   * Start a subtask (transition from pending to in_progress)
   */
  async startSubtask(subtaskId) {
    return this.transition(subtaskId, 'START');
  }

  /**
   * Transition subtask to red (tests written)
   */
  async transitionToRed(subtaskId) {
    return this.transition(subtaskId, 'TESTS_WRITTEN');
  }

  /**
   * Transition subtask to green (tests pass)
   */
  async transitionToGreen(subtaskId, testsExist = true) {
    return this.transition(subtaskId, 'TESTS_PASS', { testsExist });
  }

  /**
   * Transition to refactor state
   */
  async transitionToRefactor(subtaskId) {
    return this.transition(subtaskId, 'REFACTOR');
  }

  /**
   * Transition to integration_red (integration tests written)
   */
  async transitionToIntegrationRed(subtaskId) {
    return this.transition(subtaskId, 'INTEGRATION_TEST');
  }

  /**
   * Transition to integration_green (integration tests pass)
   */
  async transitionToIntegrationGreen(subtaskId) {
    return this.transition(subtaskId, 'INTEGRATION_PASS');
  }

  /**
   * Transition to verification
   */
  async transitionToVerification(subtaskId) {
    return this.transition(subtaskId, 'VERIFY');
  }

  /**
   * Complete the subtask
   */
  async completeSubtask(subtaskId) {
    return this.transition(subtaskId, 'VERIFICATION_PASS');
  }

  /**
   * Block the subtask
   */
  async blockSubtask(subtaskId) {
    return this.transition(subtaskId, 'BLOCK');
  }

  /**
   * Unblock the subtask
   */
  async unblockSubtask(subtaskId) {
    return this.transition(subtaskId, 'UNBLOCK');
  }

  /**
   * Mark subtask as failed
   */
  async failSubtask(subtaskId) {
    return this.transition(subtaskId, 'FAIL');
  }

  /**
   * Generic transition method
   */
  async transition(subtaskId, event, eventData = {}) {
    // Load or create machine instance
    let machine = this.machines.get(subtaskId);
    if (!machine) {
      // Initialize machine with current state from database
      const currentState = await this.getSubtaskState(subtaskId);
      machine = subtaskMachine.withContext({
        subtaskId,
        ...eventData
      });
      if (currentState) {
        // We need to set the machine to the current state
        // For simplicity, we'll just start from initial and transition through events
        // In a real implementation, we would restore the state snapshot
        machine = subtaskMachine;
      }
      this.machines.set(subtaskId, machine);
    }

    // Get current state (for logging)
    const currentState = machine.initialState.value;

    // Perform transition
    const nextState = machine.transition(currentState, { type: event, ...eventData });

    if (!nextState.changed) {
      throw new Error(`Invalid transition from ${currentState} with event ${event}`);
    }

    // Update state in database
    const newState = nextState.value;
    await this.saveSubtaskState(subtaskId, newState);

    // Notify if notifier is available
    if (this.notifier) {
      await this.notifier.notifyAgent(subtaskId, newState);
    }

    // Update the machine instance with new state
    this.machines.set(subtaskId, nextState);

    return newState;
  }

  /**
   * Get current state of a subtask from database
   */
  async getSubtaskState(subtaskId) {
    try {
      const subtask = await this.db.getSubtask(subtaskId);
      return subtask ? subtask.status : null;
    } catch (error) {
      console.error(`Error getting state for subtask ${subtaskId}:`, error);
      return null;
    }
  }

  /**
   * Save subtask state to database
   */
  async saveSubtaskState(subtaskId, state) {
    try {
      await this.db.updateSubtask(subtaskId, { status: state });
      return true;
    } catch (error) {
      console.error(`Error saving state for subtask ${subtaskId}:`, error);
      return false;
    }
  }
}

// Export a singleton instance as per Orion's decision
module.exports = new OrchestratorService();
