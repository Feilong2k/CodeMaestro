const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock the database module
jest.mock('../../src/db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../src/db/connection');
const workflowEngine = require('../../src/services/workflowEngine');

describe('Workflow Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the engine's cache and reset state
    workflowEngine.workflowCache.clear();
    workflowEngine.actionHandlers.clear();
    workflowEngine.paused = false;
    workflowEngine.pausedWorkflows.clear();
  });

  describe('loadWorkflow(name)', () => {
    test('should fetch workflow JSON and METADATA from DB', async () => {
      const mockWorkflowData = {
        name: 'test_workflow',
        definition: { initial: 'start', states: { start: {} } },
        metadata: { version: '1.0', auto_actions: { start: 'GIT_PUSH' } }
      };

      db.query.mockResolvedValue({ rows: [mockWorkflowData] });

      const result = await workflowEngine.loadWorkflow('test_workflow');

      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM workflows WHERE name = $1 AND is_active = true',
        ['test_workflow']
      );
      expect(result).toEqual(mockWorkflowData);
    });

    test('should throw error if workflow not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(workflowEngine.loadWorkflow('non_existent'))
        .rejects.toThrow('Workflow not found');
    });

    test('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('DB connection failed'));

      await expect(workflowEngine.loadWorkflow('test_workflow'))
        .rejects.toThrow('DB connection failed');
    });
  });

  describe('transition(currentState, event)', () => {
    test('should return next state for valid transition', async () => {
      // Mock a workflow with transitions
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: [
            { from: 'idle', to: 'running', event: 'START' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const nextState = await workflowEngine.transition('test_workflow', 'idle', { type: 'START' });
      expect(nextState).toBe('running');
    });

    test('should throw error for invalid transition', async () => {
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: [
            { from: 'idle', to: 'running', event: 'START' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      await expect(workflowEngine.transition('test_workflow', 'idle', { type: 'INVALID_EVENT' }))
        .rejects.toThrow('No valid transition from state idle with event INVALID_EVENT');
    });

    test('should block transition if workflow is paused', async () => {
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: [
            { from: 'idle', to: 'running', event: 'START' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      workflowEngine.pause('test_workflow');
      await expect(workflowEngine.transition('test_workflow', 'idle', { type: 'START' }))
        .rejects.toThrow('Workflow execution is paused');
      workflowEngine.resume('test_workflow');
    });
  });

  describe('validateState(state)', () => {
    test('should return true for valid state', async () => {
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: []
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const isValid = await workflowEngine.validateState('test_workflow', 'idle');
      expect(isValid).toBe(true);
    });

    test('should return false for invalid state', async () => {
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: []
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const isValid = await workflowEngine.validateState('test_workflow', 'invalid_state');
      expect(isValid).toBe(false);
    });
  });

  describe('Three-Tier Planning Strategy', () => {
    test('should select different path based on strategy toggle', async () => {
      const mockWorkflow = {
        name: 'planning_workflow',
        definition: {
          initial: 'init',
          states: { init: {}, standard_planning: {}, strategic_planning: {} },
          transitions: [
            { from: 'init', to: 'standard_planning', event: 'PLAN', condition: 'strategy:standard' },
            { from: 'init', to: 'strategic_planning', event: 'PLAN', condition: 'strategy:three-tier' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const contextStandard = { strategy: 'standard' };
      const nextStateStandard = await workflowEngine.transition('planning_workflow', 'init', { type: 'PLAN' }, contextStandard);
      expect(nextStateStandard).toBe('standard_planning');

      // Clear cache to load again (or we can load once and use same instance)
      workflowEngine.workflowCache.clear();
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const contextThreeTier = { strategy: 'three-tier' };
      const nextStateThreeTier = await workflowEngine.transition('planning_workflow', 'init', { type: 'PLAN' }, contextThreeTier);
      expect(nextStateThreeTier).toBe('strategic_planning');
    });

    test('should throw error for unknown strategy', async () => {
      const mockWorkflow = {
        name: 'planning_workflow',
        definition: {
          initial: 'init',
          states: { init: {}, standard_planning: {}, strategic_planning: {} },
          transitions: [
            { from: 'init', to: 'standard_planning', event: 'PLAN', condition: 'strategy:standard' },
            { from: 'init', to: 'strategic_planning', event: 'PLAN', condition: 'strategy:three-tier' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const contextUnknown = { strategy: 'unknown' };
      await expect(workflowEngine.transition('planning_workflow', 'init', { type: 'PLAN' }, contextUnknown))
        .rejects.toThrow('No valid transition from state init with event PLAN');
    });
  });

  describe('Auto Actions', () => {
    test('should trigger actions defined in metadata', async () => {
      const mockWorkflow = {
        name: 'deployment_workflow',
        definition: {
          initial: 'ready',
          states: { ready: {} },
          transitions: [
            { from: 'ready', to: 'deployed', event: 'DEPLOY' }
          ]
        },
        metadata: { auto_actions: { ready: 'GIT_PUSH' } }
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const mockActionHandler = jest.fn();
      workflowEngine.registerActionHandler('GIT_PUSH', mockActionHandler);

      await workflowEngine.transition('deployment_workflow', 'ready', { type: 'DEPLOY' });
      expect(mockActionHandler).toHaveBeenCalled();
    });

    test('should not trigger actions if not defined', async () => {
      const mockWorkflow = {
        name: 'deployment_workflow',
        definition: {
          initial: 'waiting',
          states: { waiting: {} },
          transitions: [
            { from: 'waiting', to: 'done', event: 'WAIT' }
          ]
        },
        metadata: { auto_actions: {} }
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const mockActionHandler = jest.fn();
      workflowEngine.registerActionHandler('GIT_PUSH', mockActionHandler);

      await workflowEngine.transition('deployment_workflow', 'waiting', { type: 'WAIT' });
      expect(mockActionHandler).not.toHaveBeenCalled();
    });
  });

  describe('Bug Escalation Rule', () => {
    test('should automatically route to Strategic if isBugEscalation is true', async () => {
      const mockWorkflow = {
        name: 'planning_workflow',
        definition: {
          initial: 'init',
          states: { init: {}, strategic_planning: {} },
          transitions: [
            { from: 'init', to: 'strategic_planning', event: 'PLAN' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const context = { isBugEscalation: true };
      const nextState = await workflowEngine.transition('planning_workflow', 'init', { type: 'PLAN' }, context);
      expect(nextState).toBe('strategic_planning');
    });

    test('should not route to Strategic if isBugEscalation is false', async () => {
      const mockWorkflow = {
        name: 'planning_workflow',
        definition: {
          initial: 'init',
          states: { init: {}, standard_planning: {} },
          transitions: [
            { from: 'init', to: 'standard_planning', event: 'PLAN' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      const context = { isBugEscalation: false };
      const nextState = await workflowEngine.transition('planning_workflow', 'init', { type: 'PLAN' }, context);
      expect(nextState).toBe('standard_planning');
    });
  });

  describe('Pause/Resume', () => {
    test('should be able to pause and resume the engine', () => {
      expect(workflowEngine.isPaused()).toBe(false);
      workflowEngine.pause();
      expect(workflowEngine.isPaused()).toBe(true);
      workflowEngine.resume();
      expect(workflowEngine.isPaused()).toBe(false);
    });

    test('should block transitions when paused', async () => {
      const mockWorkflow = {
        name: 'test_workflow',
        definition: {
          initial: 'idle',
          states: { idle: {} },
          transitions: [
            { from: 'idle', to: 'running', event: 'START' }
          ]
        },
        metadata: {}
      };
      db.query.mockResolvedValue({ rows: [mockWorkflow] });

      workflowEngine.pause();
      await expect(workflowEngine.transition('test_workflow', 'idle', { type: 'START' }))
        .rejects.toThrow('Workflow execution is paused');
      workflowEngine.resume();
    });
  });
});
