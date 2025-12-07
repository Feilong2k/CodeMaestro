const AiService = require('../src/services/aiService');

async function runDemo() {
  console.log('--- Split-Brain AI Demo ---');

  try {
    // Test Strategic Mode
    console.log('\nTesting Strategic Mode (Gemini)...');
    const strategicResponse = await AiService.generate('Analyze the architectural impact of this change.', 'strategic');
    console.log('Result:', strategicResponse);

    // Test Tactical Mode
    console.log('\nTesting Tactical Mode (DeepSeek)...');
    const tacticalResponse = await AiService.generate('Refactor this function to be more efficient.', 'tactical');
    console.log('Result:', tacticalResponse);

    // Test Default Mode
    console.log('\nTesting Default Mode (Should be Tactical)...');
    const defaultResponse = await AiService.generate('Quick fix for this bug.');
    console.log('Result:', defaultResponse);

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

runDemo();
