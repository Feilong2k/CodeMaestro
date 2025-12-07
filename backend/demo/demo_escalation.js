const TaskRouter = require('../src/services/taskRouter');
const AiService = require('../src/services/aiService');

// Mock data for simulation
const testCases = [
  // 1. Direct Strategic
  { input: "Draft a system architecture for the new payment module", expectedInitial: "strategic", description: "Direct Strategic" },
  
  // 2. Direct Tactical
  { input: "Fix the CSS bug on the login page", expectedInitial: "tactical", description: "Direct Tactical" },
  
  // 3. Escalation: Complexity
  { input: "Can you analyze complexity of this function?", expectedInitial: "tactical", description: "Escalation: Complexity" },

  // 4. Escalation: Security (New)
  { input: "Perform a security audit on the auth module", expectedInitial: "tactical", description: "Escalation: Security" }
];

async function runDemo() {
  console.log("--- Split-Brain + Extensible Escalation Demo ---\n");

  for (const test of testCases) {
    console.log(`Test: ${test.description}`);
    console.log(`Input: "${test.input}"`);
    
    // 1. Classify
    const mode = TaskRouter.classify(test.input);
    console.log(`> Initial Route: ${mode.toUpperCase()}`);
    
    // 2. Simulate Execution
    try {
      console.log(`> Executing...`);
      const response = await AiService.generate(test.input, mode);
      console.log(`> Final Response: ${response.substring(0, 60)}...`);
      
      if (mode === 'tactical' && response.includes('[Strategic')) {
        console.log(`> ✨ SUCCESS: Escalation occurred!`);
      }
    } catch (err) {
      console.error(`> Error: ${err.message}`);
    }
    console.log("-".repeat(40) + "\n");
  }
}

runDemo();
