const TacticalAdapter = require('../../llm/TacticalAdapter');
const aiConfig = require('../../config/ai');

// Mock config
jest.mock('../../config/ai', () => ({
  tactical: {
    key: 'test-key',
    model: 'deepseek-chat'
  }
}));

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return class OpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: mockCreate
        }
      };
    }
  };
});

describe('TacticalAdapter Fix (BUG-003)', () => {
  let adapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new TacticalAdapter();
    // Ensure configured
    adapter.isConfigured = true;
    
    // Mock successful response
    mockCreate.mockResolvedValue({
      choices: [{
        message: { content: 'Test response', tool_calls: [] }
      }]
    });
  });

  test('should NOT force tool_choice: required when prompt contains action keywords', async () => {
    const actionPrompt = "How do I create a file?"; // Contains 'create'
    
    await adapter.generateWithFunctions(actionPrompt, true);
    
    const callArgs = mockCreate.mock.calls[0][0];
    
    // verification: tool_choice should be 'auto', not 'required'
    // Before fix, this would fail if the logic is still there
    expect(callArgs.tool_choice).toBe('auto');
  });

  test('should use tool_choice: auto for non-action prompts', async () => {
    const simplePrompt = "What is the meaning of life?";
    
    await adapter.generateWithFunctions(simplePrompt, true);
    
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toBe('auto');
  });
});
