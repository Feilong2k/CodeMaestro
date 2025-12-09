const { describe, test, expect, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let AgentFSM;
try {
  AgentFSM = require('../../../../src/machines/AgentFSM');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  AgentFSM = null;
}

// Helper to ensure we have the module to test, otherwise skip the test.
function requireAgentFSM() {
  if (!AgentFSM) {
    throw new Error('AgentFSM module not found. Tests are expected to fail.');
  }
  return AgentFSM;
}

describe('AgentFSM', () => {
  describe('states and transitions', () => {
    test('should have OBSERVE, THINK, ACT, WAIT, VERIFY, COMPLETE, ERROR states', () => {
      const FSM = requireAgentFSM();
      // The module should expose the states as constants or we can infer from the machine.
      // For now, we assume the FSM has a property `states` that is an array of state names.
      expect(Array.isArray(FSM.states)).toBe(true);
      const expectedStates = ['OBSERVE', 'THINK', 'ACT', 'WAIT', 'VERIFY', 'COMPLETE', 'ERROR'];
      expectedStates.forEach(state => {
        expect(FSM.states).toContain(state);
      });
    });

    test('should have an initial state of OBSERVE', () => {
      const FSM = requireAgentFSM();
      // The FSM should have a method to get initial state or a property.
      expect(FSM.initialState).toBe('OBSERVE');
    });

    test('should transition OBSERVE -> THINK given observation result', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'observation complete' };
      const nextState = FSM.transition('OBSERVE', 'OBSERVE_COMPLETE', context);
      expect(nextState).toBe('THINK');
    });

    test('should transition THINK -> ACT when thinking yields an action', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'plan ready' };
      const nextState = FSM.transition('THINK', 'THINK_COMPLETE', context);
      expect(nextState).toBe('ACT');
    });

    test('should transition ACT -> WAIT after action is performed', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'action executed' };
      const nextState = FSM.transition('ACT', 'ACTION_COMPLETE', context);
      expect(nextState).toBe('WAIT');
    });

    test('should transition WAIT -> VERIFY when waiting period is over', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'waiting done' };
      const nextState = FSM.transition('WAIT', 'WAIT_COMPLETE', context);
      expect(nextState).toBe('VERIFY');
    });

    test('should transition VERIFY -> COMPLETE if verification passes', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'verification passed' };
      const nextState = FSM.transition('VERIFY', 'VERIFICATION_PASSED', context);
      expect(nextState).toBe('COMPLETE');
    });

    test('should transition VERIFY -> THINK if verification fails and retry is allowed', () => {
      const FSM = requireAgentFSM();
      const context = { lastResult: 'verification failed', retryCount: 0 };
      const nextState = FSM.transition('VERIFY', 'VERIFICATION_FAILED', context);
      expect(nextState).toBe('THINK');
    });

    test('should transition any state -> ERROR on error event', () => {
      const FSM = requireAgentFSM();
      const states = ['OBSERVE', 'THINK', 'ACT', 'WAIT', 'VERIFY'];
      states.forEach(state => {
        const nextState = FSM.transition(state, 'ERROR_OCCURRED', { error: 'some error' });
        expect(nextState).toBe('ERROR');
      });
    });

    test('should transition ERROR -> OBSERVE after error is handled', () => {
      const FSM = requireAgentFSM();
      const context = { errorHandled: true };
      const nextState = FSM.transition('ERROR', 'ERROR_HANDLED', context);
      expect(nextState).toBe('OBSERVE');
    });

    test('should reject invalid transitions', () => {
      const FSM = requireAgentFSM();
      // For example, from OBSERVE to ACT without going through THINK
      const nextState = FSM.transition('OBSERVE', 'ACTION_COMPLETE', {});
      // The FSM should stay in the same state or go to an error state
      expect(nextState).not.toBe('ACT');
      expect(nextState).toBe('OBSERVE'); // or maybe 'ERROR'
    });

    test('should be a pure function (no side effects)', () => {
      const FSM = requireAgentFSM();
      // We can't directly test for side effects, but we can verify that the same input yields the same output.
      const state1 = FSM.transition('OBSERVE', 'OBSERVE_COMPLETE', {});
      const state2 = FSM.transition('OBSERVE', 'OBSERVE_COMPLETE', {});
      expect(state1).toBe(state2);
      // Also, we can check that the context is not mutated.
      const context = { count: 0 };
      FSM.transition('OBSERVE', 'OBSERVE_COMPLETE', context);
      expect(context.count).toBe(0);
    });
  });

  describe('context updates', () => {
    test('should update context during transition', () => {
      const FSM = requireAgentFSM();
      const context = { stepCount: 0 };
      const newContext = FSM.updateContext('OBSERVE', 'OBSERVE_COMPLETE', context);
      expect(newContext.stepCount).toBe(1);
    });

    test('should preserve existing context properties', () => {
      const FSM = requireAgentFSM();
      const context = { stepCount: 5, subtaskId: '6-1' };
      const newContext = FSM.updateContext('OBSERVE', 'OBSERVE_COMPLETE', context);
      expect(newContext.subtaskId).toBe('6-1');
    });
  });

  describe('logging integration', () => {
    test('should provide a hook for logging transitions', () => {
      const FSM = requireAgentFSM();
      // The FSM should have a method to log transitions, or we can use a side-effect free logging.
      // For now, we expect a method that returns a log entry.
      const logEntry = FSM.createLogEntry('OBSERVE', 'THINK', 'Orion', '6-1');
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('agent', 'Orion');
      expect(logEntry).toHaveProperty('subtaskId', '6-1');
      expect(logEntry).toHaveProperty('fromState', 'OBSERVE');
      expect(logEntry).toHaveProperty('toState', 'THINK');
    });
  });
});
