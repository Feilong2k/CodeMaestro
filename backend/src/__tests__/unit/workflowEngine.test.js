const WorkflowEngine = require('../../services/workflowEngine');
const { pool } = require('../../db/connection');

// Mock the DB connection
jest.mock('../../db/connection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('WorkflowEngine', () => {
  // Sample Workflow Data (Mock)
  const mockWorkflow = {
    id: 'uuid-123',
    name: 'Test_Workflow',
    version: '1.0.0',
    definition: JSON.stringify({
      initial: 'Start',
      states: {
        Start: 'Initial state',
        Process: 'Processing state',
        Finish: 'Final state',
        Escalated: 'Strategic override'
      },
      transitions: [
        { from: 'Start', to: 'Process', event: 'START_JOB' },
        { from: 'Process', to: 'Finish', event: 'JOB_DONE' },
        { from: 'Process', to: 'Escalated', event: 'ERROR_CRITICAL' },
        { from: 'Start', to: 'Planning_Standard', event: 'PLAN', condition: 'strategy:standard' },
        { from: 'Start', to: 'Planning_Deep', event: 'PLAN', condition: 'strategy:three-tier' }
      ]
    }),
    metadata: JSON.stringify({
      auto_actions: {
        Finish: 'CLEANUP_JOB'
      },
      roles: {
        Process: 'devon',
        Escalated: 'orion'
      }
    }),
    is_active: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Engine State
    WorkflowEngine.workflowCache.clear();
    WorkflowEngine.actionHandlers.clear();
    WorkflowEngine.paused = false;
    WorkflowEngine.pausedWorkflows.clear();
  });

  describe('loadWorkflow', () => {
    it('should fetch and parse workflow definition from DB', async () => {
      pool.query.mockResolvedValue({ rows: [mockWorkflow] });
      
      const wf = await WorkflowEngine.loadWorkflow('Test_Workflow');
      
      expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['Test_Workflow']);
      expect(wf.name).toBe('Test_Workflow');
      expect(wf.definition).toBeDefined();
      expect(wf.metadata).toBeDefined();
    });

    it('should throw error if workflow not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      
      await expect(WorkflowEngine.loadWorkflow('NonExistent')).rejects.toThrow('Workflow not found');
    });
  });

  describe('transition', () => {
    beforeEach(async () => {
      pool.query.mockResolvedValue({ rows: [mockWorkflow] });
    });

    it('should return next state for valid transition', async () => {
      const result = await WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'START_JOB' });
      expect(result).toBe('Process');
    });

    it('should throw error for invalid transition', async () => {
      await expect(WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'JOB_DONE' }))
        .rejects.toThrow('No valid transition');
    });

    it('should handle Bug Escalation Rule (Force Strategic)', async () => {
      // Scenario: Devon escalates a bug -> Force Three-Tier Planning
      const context = { escalatedFrom: 'devon' };
      
      // We trigger a 'PLAN' event. Normally it needs a strategy.
      // The Engine should FORCE 'three-tier', matching the transition to 'Planning_Deep'
      
      const result = await WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'PLAN' }, context);
      
      expect(context.strategy).toBe('three-tier');
      expect(result).toBe('Planning_Deep');
    });

    it('should trigger auto_actions defined in metadata', async () => {
      const mockHandler = jest.fn();
      WorkflowEngine.registerActionHandler('CLEANUP_JOB', mockHandler);

      // Transition to 'Finish' which has auto_action 'CLEANUP_JOB'
      await WorkflowEngine.transition('Test_Workflow', 'Process', { type: 'JOB_DONE' });
      
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Pause/Resume', () => {
    beforeEach(async () => {
      pool.query.mockResolvedValue({ rows: [mockWorkflow] });
    });

    it('should block transitions when globally paused', async () => {
      WorkflowEngine.pause();
      await expect(WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'START_JOB' }))
        .rejects.toThrow('Workflow execution is paused');
    });

    it('should block transitions when specific workflow is paused', async () => {
      WorkflowEngine.pause('Test_Workflow');
      await expect(WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'START_JOB' }))
        .rejects.toThrow('Workflow execution is paused');
    });

    it('should allow transitions after resume', async () => {
      WorkflowEngine.pause();
      WorkflowEngine.resume();
      const result = await WorkflowEngine.transition('Test_Workflow', 'Start', { type: 'START_JOB' });
      expect(result).toBe('Process');
    });
  });
});

