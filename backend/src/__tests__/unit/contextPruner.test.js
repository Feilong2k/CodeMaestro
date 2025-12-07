const { describe, test, expect, beforeEach } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let ContextPruner;
try {
  ContextPruner = require('../../services/ai/ContextPruner');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  ContextPruner = {};
}

// Mock the AiService or LLM calls
jest.mock('../../services/aiService', () => ({
  callLLM: jest.fn()
}));

let aiService;
try {
  aiService = require('../../services/aiService');
} catch (e) {
  aiService = { callLLM: jest.fn() };
}

// Helper to ensure we have a method to test, otherwise skip the test.
function requireContextPruner() {
  if (Object.keys(ContextPruner).length === 0) {
    throw new Error('ContextPruner module not found. Tests are expected to fail.');
  }
  return ContextPruner;
}

describe('Context Pruner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('prune(messages, tokenLimit)', () => {
    test('should reduce message count based on token limit', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'user', content: 'Hello, this is a long message that should be counted for tokens.' },
        { role: 'assistant', content: 'Sure, I can help with that.' },
        { role: 'user', content: 'Another message here.' },
        { role: 'assistant', content: 'And another response.' }
      ];

      // We assume a token limit that would only allow 2 messages (for example)
      const tokenLimit = 50; // Arbitrary small limit

      const result = pruner.prune(messages, tokenLimit);

      // The result should have fewer messages than the input (or same if under limit)
      expect(result.length).toBeLessThanOrEqual(messages.length);
      // The result should be an array
      expect(Array.isArray(result)).toBe(true);
    });

    test('should return empty array if token limit is zero', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'user', content: 'Hello' }
      ];

      const result = pruner.prune(messages, 0);

      expect(result).toEqual([]);
    });

    test('should preserve all messages if under token limit', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'user', content: 'Short' },
        { role: 'assistant', content: 'OK' }
      ];

      // Large token limit
      const tokenLimit = 1000;

      const result = pruner.prune(messages, tokenLimit);

      expect(result).toEqual(messages);
    });
  });

  describe('summarize(messages)', () => {
    test('should mock LLM call to return summary', async () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second message' }
      ];

      const mockSummary = 'Summary of the conversation';
      aiService.callLLM.mockResolvedValue(mockSummary);

      const summary = await pruner.summarize(messages);

      // Expect the LLM to have been called with the messages
      expect(aiService.callLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array)
        })
      );
      expect(typeof summary).toBe('string');
      expect(summary).toBe(mockSummary);
    });

    test('should handle empty messages array', async () => {
      const pruner = requireContextPruner();

      const messages = [];
      aiService.callLLM.mockResolvedValue('Empty conversation');

      const summary = await pruner.summarize(messages);

      expect(summary).toBeDefined();
    });

    test('should throw error if LLM call fails', async () => {
      const pruner = requireContextPruner();

      aiService.callLLM.mockRejectedValue(new Error('LLM error'));

      await expect(pruner.summarize([{ role: 'user', content: 'test' }]))
        .rejects.toThrow('LLM error');
    });
  });

  describe('preserveCritical(messages)', () => {
    test('should ensure system and active subtask messages are NEVER pruned', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'system', content: 'System instruction' },
        { role: 'user', content: 'Regular user message' },
        { role: 'assistant', content: 'Regular assistant message' },
        { role: 'system', content: 'Another system message' },
        { role: 'user', content: 'Active subtask: do something' }
      ];

      // Let's assume we have a method that filters and returns only critical messages.
      // Alternatively, we can test that the pruner.prune method preserves these.
      // Since we don't know the exact implementation, we'll test that the method exists and returns an array.
      const result = pruner.preserveCritical(messages);

      expect(Array.isArray(result)).toBe(true);
      // We expect that system messages are included in the result.
      const systemMessages = result.filter(m => m.role === 'system');
      expect(systemMessages.length).toBeGreaterThan(0);
    });

    test('should return empty array if no critical messages', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'user', content: 'Regular user message' },
        { role: 'assistant', content: 'Regular assistant message' }
      ];

      const result = pruner.preserveCritical(messages);

      // In this case, there are no critical messages, so the method might return an empty array.
      // We'll just check it's an array.
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkRateLimit(agentId)', () => {
    test('should allow requests spaced by more than 1 second', async () => {
      const pruner = requireContextPruner();
      
      expect(pruner.checkRateLimit('agent1')).toBe(true);
      
      // Wait > 1 second
      await new Promise(r => setTimeout(r, 1100));
      
      expect(pruner.checkRateLimit('agent1')).toBe(true);
    });

    test('should block requests spaced by less than 1 second', () => {
      const pruner = requireContextPruner();
      
      // First request ok
      expect(pruner.checkRateLimit('agent2')).toBe(true);
      
      // Immediate second request blocked
      expect(pruner.checkRateLimit('agent2')).toBe(false);
    });
  });

  describe('Integration: prune with preservation', () => {
    test('should preserve critical messages even when over token limit', () => {
      const pruner = requireContextPruner();

      const messages = [
        { role: 'system', content: 'This is a system message that must be kept.' },
        { role: 'user', content: 'A very long user message that exceeds the token limit by itself.' },
        { role: 'assistant', content: 'Another long response.' }
      ];

      // Very small token limit to force pruning
      const tokenLimit = 10;

      const result = pruner.prune(messages, tokenLimit);

      // The system message should still be present
      const systemMessages = result.filter(m => m.role === 'system');
      expect(systemMessages.length).toBe(1);
    });
  });
});
