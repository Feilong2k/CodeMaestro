const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// Mock the database module
jest.mock('../../../db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../../db/connection');

// The module we're testing doesn't exist yet, so we'll require it and expect it to fail.
// We'll wrap the require in a function to catch the error and use a placeholder.
let memoryService;
try {
  memoryService = require('../../../services/memoryService');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  memoryService = {};
}

// Helper to ensure we have a method to test, otherwise skip the test.
function requireMemoryService() {
  if (Object.keys(memoryService).length === 0) {
    throw new Error('MemoryService module not found. Tests are expected to fail.');
  }
  return memoryService;
}

describe('Memory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveContext(projectId, key, value)', () => {
    test('should store data in DB', async () => {
      const service = requireMemoryService();

      const projectId = 'proj123';
      const key = 'chat_history';
      const value = { messages: ['hello', 'world'] };

      db.query.mockResolvedValue({ rowCount: 1 });

      await service.saveContext(projectId, key, value);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [projectId, key, value]
      );
    });

    test('should throw error on DB failure', async () => {
      const service = requireMemoryService();

      db.query.mockRejectedValue(new Error('DB error'));

      await expect(service.saveContext('proj123', 'key', 'value'))
        .rejects.toThrow('DB error');
    });
  });

  describe('getContext(projectId, key)', () => {
    test('should retrieve specific context', async () => {
      const service = requireMemoryService();

      const projectId = 'proj123';
      const key = 'chat_history';
      const mockValue = { messages: ['hello', 'world'] };

      db.query.mockResolvedValue({ rows: [{ value: mockValue }] });

      const result = await service.getContext(projectId, key);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId, key]
      );
      expect(result).toEqual(mockValue);
    });

    test('should return null if context not found', async () => {
      const service = requireMemoryService();

      db.query.mockResolvedValue({ rows: [] });

      const result = await service.getContext('proj123', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('searchContext(query)', () => {
    test('should mock Vector Search retrieval', async () => {
      const service = requireMemoryService();

      const query = 'hello world';
      const mockResults = [
        { id: 1, projectId: 'proj123', key: 'chat1', value: { messages: ['hello'] } },
        { id: 2, projectId: 'proj456', key: 'chat2', value: { messages: ['world'] } }
      ];

      // Since we don't have vector search yet, we'll assume the service has a method that does something.
      // We'll mock an internal function or assume it uses db.query with a special search query.
      db.query.mockResolvedValue({ rows: mockResults });

      const results = await service.searchContext(query);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [query]
      );
      expect(results).toEqual(mockResults);
    });

    test('should return empty array for no matches', async () => {
      const service = requireMemoryService();

      db.query.mockResolvedValue({ rows: [] });

      const results = await service.searchContext('nonexistent query');

      expect(results).toEqual([]);
    });
  });

  describe('Session History', () => {
    test('should save and retrieve chat history', async () => {
      const service = requireMemoryService();

      const projectId = 'proj123';
      const sessionId = 'sess456';
      const history = [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi there!' }];

      // Save history
      db.query.mockResolvedValue({ rowCount: 1 });
      await service.saveSessionHistory(projectId, sessionId, history);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [projectId, sessionId, history]
      );

      // Retrieve history
      db.query.mockResolvedValue({ rows: [{ history }] });
      const retrieved = await service.getSessionHistory(projectId, sessionId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [projectId, sessionId]
      );
      expect(retrieved).toEqual(history);
    });
  });

  describe('User Preferences', () => {
    test('should store and retrieve user settings', async () => {
      const service = requireMemoryService();

      const userId = 'user123';
      const settings = { briefMode: true, theme: 'dark' };

      // Save preferences
      db.query.mockResolvedValue({ rowCount: 1 });
      await service.saveUserPreferences(userId, settings);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [userId, settings]
      );

      // Retrieve preferences
      db.query.mockResolvedValue({ rows: [{ settings }] });
      const retrieved = await service.getUserPreferences(userId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
      expect(retrieved).toEqual(settings);
    });

    test('should return default preferences if none set', async () => {
      const service = requireMemoryService();

      db.query.mockResolvedValue({ rows: [] });

      const retrieved = await service.getUserPreferences('newuser');

      // We expect the service to return default preferences (maybe an empty object or default settings)
      expect(retrieved).toEqual({}); // or some default object
    });
  });
});
