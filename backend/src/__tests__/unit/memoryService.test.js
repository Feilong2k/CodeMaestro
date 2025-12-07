const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock the database module
jest.mock('../../db/connection', () => ({
  pool: {
    query: jest.fn()
  }
}));

const { pool } = require('../../db/connection');
const memoryService = require('../../services/memoryService');

describe('Memory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveContext(projectId, key, value)', () => {
    test('should store data in DB', async () => {
      const projectId = 'proj123';
      const key = 'chat_history';
      const value = { messages: ['hello', 'world'] };

      pool.query.mockResolvedValue({ rowCount: 1 });

      await memoryService.saveContext(projectId, key, value);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [projectId, key, value]
      );
    });

    test('should throw error on DB failure', async () => {
      pool.query.mockRejectedValue(new Error('DB error'));

      await expect(memoryService.saveContext('proj123', 'key', 'value'))
        .rejects.toThrow('DB error');
    });
  });

  describe('getContext(projectId, key)', () => {
    test('should retrieve specific context', async () => {
      const projectId = 'proj123';
      const key = 'chat_history';
      const mockValue = { messages: ['hello', 'world'] };

      pool.query.mockResolvedValue({ rows: [{ value: mockValue }] });

      const result = await memoryService.getContext(projectId, key);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId, key]
      );
      expect(result).toEqual(mockValue);
    });

    test('should return null if context not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await memoryService.getContext('proj123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('searchContext(query)', () => {
    test('should perform text search and return results', async () => {
      const query = 'hello world';
      const mockResults = [
        { id: 1, project_id: 'proj123', key: 'chat1', value: { messages: ['hello'] } },
        { id: 2, project_id: 'proj456', key: 'chat2', value: { messages: ['world'] } }
      ];

      pool.query.mockResolvedValue({ rows: mockResults });

      const results = await memoryService.searchContext(query);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [`%${query}%`]
      );
      expect(results).toEqual(mockResults);
    });

    test('should return empty array for no matches', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const results = await memoryService.searchContext('nonexistent query');

      expect(results).toEqual([]);
    });
  });

  describe('Session History', () => {
    test('should save and retrieve chat history', async () => {
      const projectId = 'proj123';
      const sessionId = 'sess456';
      const history = [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi there!' }];

      // Save history
      pool.query.mockResolvedValue({ rowCount: 1 });
      await memoryService.saveSessionHistory(projectId, sessionId, history);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [projectId, sessionId, history]
      );

      // Retrieve history
      pool.query.mockResolvedValue({ rows: [{ value: history }] });
      const retrieved = await memoryService.getSessionHistory(projectId, sessionId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId, sessionId]
      );
      expect(retrieved).toEqual(history);
    });
  });

  describe('User Preferences', () => {
    test('should store and retrieve user settings', async () => {
      const userId = 'user123';
      const settings = { briefMode: true, theme: 'dark' };

      // Save preferences
      pool.query.mockResolvedValue({ rowCount: 1 });
      await memoryService.saveUserPreferences(userId, settings);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [userId, settings]
      );

      // Retrieve preferences
      pool.query.mockResolvedValue({ rows: [{ value: settings }] });
      const retrieved = await memoryService.getUserPreferences(userId);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
      expect(retrieved).toEqual(settings);
    });

    test('should return default preferences if none set', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const retrieved = await memoryService.getUserPreferences('newuser');

      expect(retrieved).toEqual({});
    });
  });
});
