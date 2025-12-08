const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let AgentExecutor;
try {
  AgentExecutor = require('../../../src/services/AgentExecutor');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  AgentExecutor = {};
}

// Mock dependencies
jest.mock('../../../src/services/TaskQueueService', () => ({
  dequeue: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
}));
jest.mock('../../../src/tools/registry', () => ({
  getToolsForRole: jest.fn(),
}));
jest.mock('../../../src/llm/DeepseekClient', () => ({
  chatCompletion: jest.fn(),
}));

const TaskQueueService = require('../../../src/services/TaskQueueService');
const registry = require('../../../src/tools/registry');
const DeepseekClient = require('../../../src/llm/DeepseekClient');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireAgentExecutor() {
  if (Object.keys(AgentExecutor).length === 0) {
    throw new Error('AgentExecutor module not found. Tests are expected to fail.');
  }
  // If class, instantiate
  if (AgentExecutor.AgentExecutor) {
    return new AgentExecutor.AgentExecutor();
  }
  return AgentExecutor;
}

describe('Agent Executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeTask(taskId)', () => {
    test('should execute tools based on plan', async () => {
      const executor = requireAgentExecutor();

      // Mock a task from queue
      const mockTask = {
        id: 1,
        type: 'devon',
        payload: { plan: 'write a test' },
      };
      TaskQueueService.dequeue.mockResolvedValue(mockTask);

      // Mock LLM response that returns a tool call
      DeepseekClient.chatCompletion.mockResolvedValue({
        content: '<tool name="FileSystemTool" action="write"><path>test.js</path><content>// test</content></tool>',
      });

      // Mock tool registry
      const mockTool = { execute: jest.fn().mockResolvedValue({ success: true }) };
      registry.getToolsForRole.mockReturnValue({ FileSystemTool: mockTool });

      // Execute task
      await executor.executeTask(1);

      // Expect dequeue called with taskId
      expect(TaskQueueService.dequeue).toHaveBeenCalledWith('agent-executor');
      // Expect LLM called with appropriate context
      expect(DeepseekClient.chatCompletion).toHaveBeenCalled();
      // Expect tool executed
      expect(mockTool.execute).toHaveBeenCalled();
      // Expect task completed
      expect(TaskQueueService.complete).toHaveBeenCalledWith(1, expect.anything());
    });

    test('should abort after exceeding step budget (max 20 steps)', async () => {
      const executor = requireAgentExecutor();

      // Mock a task that causes infinite loop (LLM returns same tool call repeatedly)
      const mockTask = { id: 2, type: 'devon', payload: {} };
      TaskQueueService.dequeue.mockResolvedValue(mockTask);
      DeepseekClient.chatCompletion.mockResolvedValue({
        content: '<tool name="NoOpTool" action="loop"></tool>',
      });
      const mockTool = { execute: jest.fn().mockResolvedValue({}) };
      registry.getToolsForRole.mockReturnValue({ NoOpTool: mockTool });

      // We expect the executor to stop after 20 steps and mark task as failed
      await executor.executeTask(2);

      // Should call fail with appropriate error
      expect(TaskQueueService.fail).toHaveBeenCalledWith(2, expect.stringContaining('step budget'));
      // Should not call complete
      expect(TaskQueueService.complete).not.toHaveBeenCalled();
    });

    test('should mark task failed if loop aborts due to error', async () => {
      const executor = requireAgentExecutor();

      const mockTask = { id: 3, type: 'devon', payload: {} };
      TaskQueueService.dequeue.mockResolvedValue(mockTask);
      // Simulate LLM throwing error
      DeepseekClient.chatCompletion.mockRejectedValue(new Error('Network error'));

      await executor.executeTask(3);

      // Should retry? According to spec: Network Error -> Retry (Max 3)
      // After retries, should fail
      expect(TaskQueueService.fail).toHaveBeenCalledWith(3, expect.anything());
    });
  });

  describe('step budget', () => {
    test('should have a configurable max steps (default 20)', () => {
      const executor = requireAgentExecutor();
      // Assuming there is a property maxSteps
      expect(executor.maxSteps).toBe(20);
    });
  });
});
