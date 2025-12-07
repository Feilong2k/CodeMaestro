const OrchestratorService = require('../../services/orchestrator');
const { pool } = require('../../db/connection');

// Mock DB
jest.mock('../../db/connection', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('OrchestratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Concern-Based Locking', () => {
    it('should allow locking a concern if unlocked', async () => {
      // Mock: No existing lock
      pool.query.mockResolvedValueOnce({ rows: [] }); 
      // Mock: Insert lock success
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, concern: 'tests' }] });

      const lock = await OrchestratorService.acquireLock('TASK-1', 'tests', 'tara');
      expect(lock).toBeDefined();
    });

    it('should reject locking if already locked by another agent', async () => {
      // Mock: Existing lock by devon
      pool.query.mockResolvedValueOnce({ 
        rows: [{ agent_id: 'devon', concern: 'implementation' }] 
      });

      await expect(OrchestratorService.acquireLock('TASK-1', 'implementation', 'tara'))
        .rejects.toThrow('Concern implementation is already locked by devon');
    });
  });

  describe('Territory Rules', () => {
    it('should block Devon from editing tests', () => {
      const isAllowed = OrchestratorService.checkTerritory('devon', 'implementation', 'backend/src/__tests__/foo.test.js');
      expect(isAllowed).toBe(false);
    });

    it('should allow Tara to edit tests', () => {
      const isAllowed = OrchestratorService.checkTerritory('tara', 'tests', 'backend/src/__tests__/foo.test.js');
      expect(isAllowed).toBe(true);
    });

    it('should allow Devon to edit implementation', () => {
      const isAllowed = OrchestratorService.checkTerritory('devon', 'implementation', 'backend/src/services/api.js');
      expect(isAllowed).toBe(true);
    });
  });

  describe('Protected Paths', () => {
    it('should identify protected files', () => {
      expect(OrchestratorService.isProtectedPath('.env')).toBe(true);
      expect(OrchestratorService.isProtectedPath('backend/src/db/migrations/001_init.sql')).toBe(true);
      expect(OrchestratorService.isProtectedPath('package.json')).toBe(true);
    });

    it('should identify non-protected files', () => {
      expect(OrchestratorService.isProtectedPath('backend/src/utils/helper.js')).toBe(false);
    });
  });

  describe('Branching Logic', () => {
    it('should generate correct branch name for new task', () => {
      const branchName = OrchestratorService.getBranchName('4-9', 'orchestrator-automation');
      expect(branchName).toBe('subtask/4-9-orchestrator-automation');
    });

    it('should generate correct branch name for specific concern if needed', () => {
      // If we supported feature branches per concern
      const branchName = OrchestratorService.getConcernBranchName('TASK-1', 'tests');
      expect(branchName).toBe('feature/TASK-1-tests');
    });
  });
});

