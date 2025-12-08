const { describe, test, expect, beforeEach } = require('@jest/globals');

// Import the module (it exists now)
const DatabaseTool = require('../../../src/tools/DatabaseTool');

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../../src/db/connection');

describe('Database Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: return empty result
    db.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('savePattern(pattern)', () => {
    test('should throw error if role is not Orion', async () => {
      // Create a tool instance with a non-Orion role
      const nonOrionTool = new DatabaseTool.DatabaseTool('Devon');
      await expect(nonOrionTool.savePattern({ name: 'test', definition: {} }))
        .rejects.toThrow('DatabaseTool is only accessible to Orion');
    });

    test('should call database query to insert pattern for Orion', async () => {
      // The default exported instance is for Orion
      const tool = DatabaseTool; // This is the default Orion instance

      const mockRow = { id: 1, name: 'Test Pattern', definition: {}, created_at: new Date() };
      db.query.mockResolvedValueOnce({ rows: [mockRow] });

      const pattern = { name: 'Test Pattern', definition: {} };
      const result = await tool.savePattern(pattern);

      // Check that db.query was called with correct SQL and values
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [pattern.name, expect.any(String)] // definition is stringified JSON
      );
      expect(result).toEqual(mockRow);
    });

    test('should throw error if pattern missing name or definition', async () => {
      const tool = DatabaseTool;
      await expect(tool.savePattern({})).rejects.toThrow('Pattern must have name and definition');
      await expect(tool.savePattern({ name: 'test' })).rejects.toThrow('Pattern must have name and definition');
      await expect(tool.savePattern({ definition: {} })).rejects.toThrow('Pattern must have name and definition');
    });
  });

  describe('updateWorkflow(name, definition)', () => {
    test('should throw error if role is not Orion', async () => {
      const nonOrionTool = new DatabaseTool.DatabaseTool('Tara');
      await expect(nonOrionTool.updateWorkflow('test', {}))
        .rejects.toThrow('DatabaseTool is only accessible to Orion');
    });

    test('should call database query to update workflow for Orion', async () => {
      const tool = DatabaseTool;

      const mockRow = { id: 1, name: 'workflow1', definition: {}, updated_at: new Date() };
      db.query.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      const name = 'workflow1';
      const definition = { states: {} };
      const result = await tool.updateWorkflow(name, definition);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [name, expect.any(String)] // definition stringified
      );
      expect(result).toEqual(mockRow);
    });

    test('should throw error if workflow not found', async () => {
      const tool = DatabaseTool;
      db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await expect(tool.updateWorkflow('nonexistent', {}))
        .rejects.toThrow('Workflow "nonexistent" not found');
    });
  });

  describe('searchLogs(query)', () => {
    test('should throw error if role is not Orion', async () => {
      const nonOrionTool = new DatabaseTool.DatabaseTool('Devon');
      await expect(nonOrionTool.searchLogs('test'))
        .rejects.toThrow('DatabaseTool is only accessible to Orion');
    });

    test('should call database query to search logs for Orion', async () => {
      const tool = DatabaseTool;

      const mockRows = [
        { id: 1, level: 'info', message: 'test log', timestamp: new Date(), metadata: {} }
      ];
      db.query.mockResolvedValueOnce({ rows: mockRows });

      const query = 'test';
      const results = await tool.searchLogs(query);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [`%${query}%`]
      );
      expect(results).toEqual(mockRows);
    });

    test('should return empty array if system_logs table does not exist', async () => {
      const tool = DatabaseTool;
      // Simulate missing table error
      db.query.mockRejectedValueOnce(new Error('relation "system_logs" does not exist'));
      const results = await tool.searchLogs('test');
      expect(results).toEqual([]);
    });

    test('should throw error for non-string query', async () => {
      const tool = DatabaseTool;
      await expect(tool.searchLogs('')).rejects.toThrow('Search query must be a non-empty string');
      await expect(tool.searchLogs(123)).rejects.toThrow('Search query must be a non-empty string');
    });
  });

  describe('Orion-only access', () => {
    test('should have method savePattern', () => {
      const tool = DatabaseTool;
      expect(typeof tool.savePattern).toBe('function');
    });

    test('should have method updateWorkflow', () => {
      const tool = DatabaseTool;
      expect(typeof tool.updateWorkflow).toBe('function');
    });

    test('should have method searchLogs', () => {
      const tool = DatabaseTool;
      expect(typeof tool.searchLogs).toBe('function');
    });
  });
});
