const { createMachine } = require('xstate');

/**
 * TDD workflow state machine for subtasks
 * States: pending, in_progress, red, green, refactor, integration_red, integration_green, verification, completed, blocked, failed
 */
const subtaskMachine = createMachine({
  id: 'subtask',
  initial: 'pending',
  states: {
    pending: {
      on: {
        START: 'in_progress'
      }
    },
    in_progress: {
      on: {
        TESTS_WRITTEN: 'red',
        BLOCK: 'blocked',
        FAIL: 'failed'
      }
    },
    red: {
      entry: ['logStateChange'],
      on: {
        TESTS_PASS: {
          target: 'green',
          cond: 'testsExist'
        }
      }
    },
    green: {
      entry: ['logStateChange'],
      on: {
        REFACTOR: 'refactor'
      }
    },
    refactor: {
      on: {
        INTEGRATION_TEST: 'integration_red'
      }
    },
    integration_red: {
      entry: ['logStateChange'],
      on: {
        INTEGRATION_PASS: 'integration_green'
      }
    },
    integration_green: {
      entry: ['logStateChange'],
      on: {
        VERIFY: 'verification'
      }
    },
    verification: {
      on: {
        VERIFICATION_PASS: 'completed'
      }
    },
    completed: {
      type: 'final'
    },
    blocked: {
      on: {
        UNBLOCK: 'in_progress'
      }
    },
    failed: {
      type: 'final'
    }
  }
}, {
  guards: {
    testsExist: (context, event) => {
      // Guard condition: tests must exist before transitioning from red to green
      // In a real implementation, this would check if tests were actually written
      return event.testsExist !== false;
    }
  },
  actions: {
    logStateChange: (context, event) => {
      console.log(`Subtask state changed to: ${event.type || 'unknown'}`);
    }
  }
});

module.exports = subtaskMachine;
