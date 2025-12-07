const TaskRouter = require('../src/services/taskRouter');
const AiService = require('../src/services/aiService');

// Mock data for simulation
const testCases = [
  { input: "Draft a system architecture for the new payment module", expected: "strategic" },
  { input: "Fix the CSS bug on the login page", expected: "tactical" },
  { input: "Plan the database migration strategy", expected: "strategic" },
  { input: "Update the readme file", expected: "tactical" },
  { input: "Review the security protocols", expected: "strategic" }
];

async function runDemo() {
  console.log("--- Split-Brain Routing Demo (4-4) ---\n");

  for (const test of testCases) {
    console.log(`Input: "${test.input}"`);
    
    // 1. Classify
    const mode = TaskRouter.classify(test.input);
    console.log(`> Classified Mode: ${mode.toUpperCase()}`);
    
    // 2. Verify against expectation
    if (mode === test.expected) {
      console.log(`> ✅ Correct`);
    } else {
      console.log(`> ❌ Incorrect (Expected: ${test.expected})`);
    }

    // 3. Simulate Execution (Mock)
    try {
      console.log(`> Routing to Adapter...`);
      // We pass the mode explicitly to the service
      const response = await AiService.generate(test.input, mode);
      console.log(`> Response Preview: ${response.substring(0, 50)}...`);
    } catch (err) {
      console.error(`> Error: ${err.message}`);
    }
    console.log("-".repeat(40) + "\n");
  }
}

runDemo();

