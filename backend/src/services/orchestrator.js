const subtaskMachine = require('../machines/subtaskMachine');
const db = require('../db/connection');

class OrchestratorService {
  constructor(database = db, notifier = null) {
    this.db = database;
    this.notifier = notifier;
    this.machines = new Map(); // Map subtaskId -> machine instance
  }

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

module.exports = {
  OrchestratorService
};
