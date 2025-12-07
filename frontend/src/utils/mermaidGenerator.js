/**
 * Generate a Mermaid diagram string from a workflow definition.
 * 
 * @param {Object} workflow - Workflow definition object
 * @param {string} workflow.initial - Initial state name
 * @param {Object} workflow.states - States object mapping state name to state definition
 * @returns {string} Mermaid diagram string
 */
export function generateMermaid(workflow) {
  // Handle empty or invalid input gracefully
  if (!workflow || typeof workflow !== 'object') {
    return 'graph TD\n  [*] --> [Error: Invalid workflow]';
  }

  const { states = {}, initial } = workflow;
  const lines = ['graph TD'];

  // Add initial state transition
  if (initial && states[initial]) {
    lines.push(`  [*] --> ${initial}`);
  } else if (initial) {
    // Initial state defined but not in states? Still create the node.
    lines.push(`  [*] --> ${initial}`);
  }

  // Process each state
  Object.entries(states).forEach(([stateName, stateDef]) => {
    // Handle final states (type: 'final')
    if (stateDef.type === 'final') {
      // In Mermaid, final states are often represented with double circle.
      // We'll use a shape with double circle style: `stateName((stateName))`
      lines.push(`  ${stateName}(((${stateName})))`);
    }

    // Add transitions from this state
    if (stateDef.on && typeof stateDef.on === 'object') {
      Object.entries(stateDef.on).forEach(([event, targetState]) => {
        // Ensure target state exists (or at least we'll create the transition)
        lines.push(`  ${stateName} --> ${targetState} : ${event}`);
      });
    }

    // If the state has no transitions and is not a final state, just ensure it appears
    if (!stateDef.on && stateDef.type !== 'final') {
      lines.push(`  ${stateName}`);
    }
  });

  // If there are no lines other than the header, add a placeholder
  if (lines.length === 1) {
    lines.push('  [*] --> [No states defined]');
  }

  return lines.join('\n');
}

export default {
  generateMermaid
};
