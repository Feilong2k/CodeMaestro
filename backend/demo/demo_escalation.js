const TaskRouter = require('../src/services/taskRouter');
const AiService = require('../src/services/aiService');

// Mock data for simulation
const testCases = [
  // 1. Clear Strategic (Keywords match)
  { input: "Draft a system architecture for the new payment module", expectedInitial: "strategic", description: "Direct Strategic" },
  
  // 2. Clear Tactical (Keywords match)
  { input: "Fix the CSS bug on the login page", expectedInitial: "tactical", description: "Direct Tactical" },
  
  // 3. Ambiguous -> Tactical -> Escalation (Simulated)
  // This sentence has NO strategic keywords (plan, architecture, etc.)
  // But implies complexity ("analyze complexity") which we mocked in TacticalAdapter to trigger escalation
  { input: "Can you analyze complexity of this function?", expectedInitial: "tactical", description: "Escalation Trigger" }
];

async function runDemo() {
  console.log("--- Split-Brain + Escalation Demo (4-4 Enhanced) ---\n");

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
      
      // Check if escalation happened (Look for Strategic tag in response even if mode was Tactical)
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

