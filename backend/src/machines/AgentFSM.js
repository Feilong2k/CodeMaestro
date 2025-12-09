/**
 * Agent Finite State Machine (FSM)
 * 
 * States: OBSERVE, THINK, ACT, WAIT, VERIFY, COMPLETE, ERROR
 * 
 * This is a pure function state machine with no side effects.
 * It defines the state transitions for the agent loop and provides context updates.
 */

const STATES = {
  OBSERVE: 'OBSERVE',
  THINK: 'THINK',
  ACT: 'ACT',
  WAIT: 'WAIT',
  VERIFY: 'VERIFY',
  COMPLETE: 'COMPLETE',
  ERROR: 'ERROR'
};

const EVENTS = {
  OBSERVE_COMPLETE: 'OBSERVE_COMPLETE',
  THINK_COMPLETE: 'THINK_COMPLETE',
  ACTION_COMPLETE: 'ACTION_COMPLETE',
  WAIT_COMPLETE: 'WAIT_COMPLETE',
  VERIFICATION_PASSED: 'VERIFICATION_PASSED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
  ERROR_HANDLED: 'ERROR_HANDLED'
};

// Valid transitions: fromState -> event -> toState
const TRANSITIONS = {
  [STATES.OBSERVE]: {
    [EVENTS.OBSERVE_COMPLETE]: STATES.THINK,
    [EVENTS.ERROR_OCCURRED]: STATES.ERROR
  },
  [STATES.THINK]: {
    [EVENTS.THINK_COMPLETE]: STATES.ACT,
    [EVENTS.ERROR_OCCURRED]: STATES.ERROR
  },
  [STATES.ACT]: {
    [EVENTS.ACTION_COMPLETE]: STATES.WAIT,
    [EVENTS.ERROR_OCCURRED]: STATES.ERROR
  },
  [STATES.WAIT]: {
    [EVENTS.WAIT_COMPLETE]: STATES.VERIFY,
    [EVENTS.ERROR_OCCURRED]: STATES.ERROR
  },
  [STATES.VERIFY]: {
    [EVENTS.VERIFICATION_PASSED]: STATES.COMPLETE,
    [EVENTS.VERIFICATION_FAILED]: STATES.THINK, // Retry by thinking again
    [EVENTS.ERROR_OCCURRED]: STATES.ERROR
  },
  [STATES.COMPLETE]: {
    // Terminal state, no transitions
  },
  [STATES.ERROR]: {
    [EVENTS.ERROR_HANDLED]: STATES.OBSERVE
  }
};

/**
 * Transition from a state given an event and context.
 * Returns the next state (or current state if no transition).
 * This is a pure function.
 * 
 * @param {string} fromState - Current state
 * @param {string} event - Event that occurred
 * @param {Object} context - Current context (used for conditional transitions)
 * @returns {string} Next state
 */
function transition(fromState, event, context) {
  const stateTransitions = TRANSITIONS[fromState];
  if (!stateTransitions) {
    // Invalid fromState, stay in current state (or could go to ERROR)
    return fromState;
  }

  const toState = stateTransitions[event];
  if (toState) {
    return toState;
  }

  // No transition for this event, stay in current state
  return fromState;
}

/**
 * Update the context based on the state transition.
 * This is a pure function that returns a new context object.
 * 
 * @param {string} fromState - Current state
 * @param {string} event - Event that occurred
 * @param {Object} context - Current context
 * @returns {Object} Updated context
 */
function updateContext(fromState, event, context) {
  const newContext = { ...context };

  // Increment step count on every transition except error handling
  if (!(fromState === STATES.ERROR && event === EVENTS.ERROR_HANDLED)) {
    newContext.stepCount = (newContext.stepCount || 0) + 1;
  }

  // Store the last event
  newContext.lastEvent = event;

  // Additional context updates based on state/event
  switch (event) {
    case EVENTS.OBSERVE_COMPLETE:
      newContext.lastObservation = context.lastResult;
      break;
    case EVENTS.THINK_COMPLETE:
      newContext.plan = context.lastResult;
      break;
    case EVENTS.ACTION_COMPLETE:
      newContext.actionResult = context.lastResult;
      break;
    case EVENTS.VERIFICATION_FAILED:
      newContext.retryCount = (newContext.retryCount || 0) + 1;
      break;
    case EVENTS.ERROR_OCCURRED:
      newContext.error = context.error || 'Unknown error';
      break;
    case EVENTS.ERROR_HANDLED:
      delete newContext.error;
      break;
    default:
      // No special updates
      break;
  }

  return newContext;
}

/**
 * Create a log entry for a state transition.
 * This is a pure function that returns a log object.
 * 
 * @param {string} fromState - State before transition
 * @param {string} toState - State after transition
 * @param {string} agent - Agent name (e.g., 'Orion')
 * @param {string} subtaskId - Subtask identifier
 * @returns {Object} Log entry
 */
function createLogEntry(fromState, toState, agent, subtaskId) {
  return {
    timestamp: new Date().toISOString(),
    agent,
    subtaskId,
    fromState,
    toState
  };
}

module.exports = {
  // States and events as constants
  STATES,
  EVENTS,
  // Array of all states (for tests)
  states: Object.values(STATES),
  // Initial state (for tests)
  initialState: STATES.OBSERVE,
  // Functions
  transition,
  updateContext,
  createLogEntry
};
