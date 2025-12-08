const { generateMermaid } = require('./frontend/src/utils/mermaidGenerator.js');

const workflow = {
  initial: 'Merged',
  states: {
    'Merged': {},
    'Cleanup_Done': {}
  },
  transitions: []
};

console.log(generateMermaid(workflow));

