/**
 * Generate a human-readable English summary from a workflow definition.
 * 
 * @param {Object} workflow - Workflow definition object
 * @param {string} workflow.initial - Initial state name
 * @param {Object} workflow.states - States object mapping state name to state definition
 * @returns {string} Human-readable description
 */
export function generateTextDescription(workflow) {
  // Handle empty or invalid input gracefully
  if (!workflow || typeof workflow !== 'object') {
    return 'No workflow definition available.';
  }

  const { states = {}, initial } = workflow;
  const lines = [];

  // Title
  lines.push('## Workflow Summary\n');

  // Initial state
  if (initial) {
    lines.push(`The workflow starts in the **${initial}** state.`);
  } else {
    lines.push('The workflow does not have a defined initial state.');
  }

  // States overview
  const stateNames = Object.keys(states);
  if (stateNames.length > 0) {
    lines.push(`\nIt contains ${stateNames.length} state${stateNames.length === 1 ? '' : 's'}: **${stateNames.join('**, **')}**.`);
  } else {
    lines.push('\nNo states are defined.');
  }

  // Transitions detail
  const transitions = [];
  stateNames.forEach(stateName => {
    const state = states[stateName];
    if (state.on && typeof state.on === 'object') {
      Object.entries(state.on).forEach(([event, targetState]) => {
        transitions.push(`- From **${stateName}** to **${targetState}** on event **${event}**`);
      });
    }
    
    // Final state indication
    if (state.type === 'final') {
      lines.push(`\n**${stateName}** is a final state (the workflow can end here).`);
    }
  });

  if (transitions.length > 0) {
    lines.push(`\n### Transitions\n`);
    lines.push(...transitions);
  } else if (stateNames.length > 0) {
    lines.push('\nNo transitions are defined between states.');
  }

  // Simple example path if we have an initial state and transitions
  if (initial && transitions.length > 0) {
    const examplePath = findExamplePath(initial, states);
    if (examplePath.length > 0) {
      lines.push(`\n### Example Flow\n`);
      lines.push(examplePath.join(' → '));
    }
  }

  return lines.join('\n');
}

/**
 * Find a simple example path through the workflow.
 * @param {string} start - Starting state
 * @param {Object} states - States definition
 * @returns {Array<string>} Path array of state names
 */
function findExamplePath(start, states) {
  const path = [start];
  let current = start;
  const visited = new Set();
  
  // Follow transitions up to 5 steps to avoid infinite loops
  for (let i = 0; i < 5; i++) {
    if (visited.has(current)) break;
    visited.add(current);
    
    const state = states[current];
    if (!state || !state.on) break;
    
    const transitions = Object.values(state.on);
    if (transitions.length === 0) break;
    
    // Pick the first transition
    const nextState = transitions[0];
    if (nextState === current) break; // self-loop
    
    path.push(nextState);
    current = nextState;
  }
  
  return path;
}

export default {
  generateTextDescription
};
