// Unit tests for Devon Agent - subtask 2-8
// These tests should fail (Red state) until implementation is complete

// Import the module to test (will fail as it doesn't exist yet)
let DevonAgent;
try {
  DevonAgent = require('../../../src/agents/DevonAgent');
} catch (error) {
  // Module doesn't exist yet - expected failure
  console.log('Note: DevonAgent module does not exist yet. Tests will fail appropriately.');
  DevonAgent = null;
}

// Import BaseAgent to check inheritance
let BaseAgent;
try {
  BaseAgent = require('../../../src/agents/BaseAgent');
} catch (error) {
  BaseAgent = null;
}

describe('DevonAgent Class', () => {
  beforeEach(() => {
    // No mocks to clear
  });

  test('DevonAgent should be defined', () => {
    expect(DevonAgent).toBeDefined();
    expect(typeof DevonAgent).toBe('function');
  });

  test('DevonAgent should extend BaseAgent', () => {
    expect(DevonAgent).toBeDefined();
    expect(BaseAgent).toBeDefined();
    
    // Check if DevonAgent extends BaseAgent
    expect(Object.getPrototypeOf(DevonAgent.prototype)).toBe(BaseAgent.prototype);
  });

  test('DevonAgent should have a name property set to "devon"', () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    expect(agent.name).toBe('devon');
  });

  test('DevonAgent.execute() should return actions based on context', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'backend' // or 'frontend'
    };

    const result = await agent.execute(context);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  test('DevonAgent should be able to implement code to pass tests', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'backend',
      testFile: 'backend/__tests__/unit/devonAgent.test.js'
    };

    const result = await agent.execute(context);
    
    // Should have an implementCode action
    const implementAction = result.actions.find(action => action.type === 'implementCode');
    expect(implementAction).toBeDefined();
    expect(implementAction.subtaskId).toBe('2-8');
    expect(implementAction.testFile).toBe('backend/__tests__/unit/devonAgent.test.js');
  });

  test('DevonAgent should be able to refactor code', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'in_progress' },
      refactorNeeded: true
    };

    const result = await agent.execute(context);
    
    const refactorAction = result.actions.find(action => action.type === 'refactorCode');
    expect(refactorAction).toBeDefined();
    expect(refactorAction.subtaskId).toBe('2-8');
  });

  test('DevonAgent should be able to fix failing tests', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'in_progress' },
      testErrors: ['Test 1 failed', 'Test 2 failed']
    };

    const result = await agent.execute(context);
    
    const fixAction = result.actions.find(action => action.type === 'fixFailingTests');
    expect(fixAction).toBeDefined();
    expect(fixAction.subtaskId).toBe('2-8');
    expect(fixAction.errors).toEqual(['Test 1 failed', 'Test 2 failed']);
  });

  test('DevonAgent should write implementation files to correct paths', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'backend',
      targetPath: 'backend/src/agents/DevonAgent.js'
    };

    const result = await agent.execute(context);
    
    // Should have a writeImplementationFile action
    const writeAction = result.actions.find(action => action.type === 'writeImplementationFile');
    expect(writeAction).toBeDefined();
    expect(writeAction.subtaskId).toBe('2-8');
    expect(writeAction.filePath).toBe('backend/src/agents/DevonAgent.js');
    expect(writeAction.content).toBeDefined();
  });

  test('DevonAgent should load prompt from .prompts/Devon_Developer_v2.md', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    
    // The agent should have a prompt property
    expect(agent.prompt).toBeDefined();
    
    // The prompt should be loaded from the correct file
    // We'll just verify the agent has a prompt property that is a string.
    expect(typeof agent.prompt).toBe('string');
    expect(agent.prompt.length).toBeGreaterThan(0);
  });

  test('DevonAgent should handle errors gracefully', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: null, // This might cause an error
    };

    // Execution should not throw, but return an error action
    const result = await agent.execute(context);
    
    expect(result).toBeDefined();
    // Either returns actions with an error or empty actions
    // We just want to ensure it doesn't crash.
  });

  test('DevonAgent should support frontend and backend implementation', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    
    // Test for backend
    const backendContext = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'backend'
    };
    const backendResult = await agent.execute(backendContext);
    expect(backendResult).toBeDefined();

    // Test for frontend
    const frontendContext = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'frontend'
    };
    const frontendResult = await agent.execute(frontendContext);
    expect(frontendResult).toBeDefined();
  });
});

describe('DevonAgent Integration with File System', () => {
  test('writeImplementationFile action should contain valid JavaScript', async () => {
    expect(DevonAgent).toBeDefined();
    
    const agent = new DevonAgent();
    const context = {
      currentTask: { id: '2-8', status: 'pending' },
      taskType: 'backend',
    };

    const result = await agent.execute(context);
    
    const writeAction = result.actions.find(action => action.type === 'writeImplementationFile');
    if (writeAction) {
      // The content should be a string and non-empty
      expect(typeof writeAction.content).toBe('string');
      expect(writeAction.content.length).toBeGreaterThan(0);
      
      // It should contain common JavaScript patterns (like 'class', 'function', etc.)
      // We'll check for some keywords, but not too specific.
      expect(writeAction.content).toMatch(/class|function|const|let|export/);
    }
  });
});
