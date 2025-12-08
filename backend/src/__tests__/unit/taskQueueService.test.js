const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let TaskQueueService;
try {
  TaskQueueService = require('../../../src/services/TaskQueueService');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  TaskQueueService = {};
}

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn()
}));

const db = require('../../../src/db/connection');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireTaskQueueService() {
  if (Object.keys(TaskQueueService).length === 0) {
    throw new Error('TaskQueueService module not found. Tests are expected to fail.');
  }
  return TaskQueueService;
}

describe('Task Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enqueue(type, payload)', () => {
    test('should insert task with pending status', async () => {
      const service = requireTaskQueueService();

      const mockTask = { id: 1, type: 'test', payload: { data: 'value' }, status: 'pending' };
      db.query.mockResolvedValue({ rows: [mockTask] });

      const type = 'test';
      const payload = { data: 'value' };
      const task = await service.enqueue(type, payload);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([type, payload, 'pending'])
      );
      expect(task).toEqual(mockTask);
    });
  });

  describe('dequeue(workerId)', () => {
    test('should return oldest pending task and set status to running', async () => {
      const service = requireTaskQueueService();

      const mockTask = { id: 1, type: 'test', payload: {}, status: 'running' };
      db.query.mockResolvedValue({ rows: [mockTask] });

      const workerId = 'worker-1';
      const task = await service.dequeue(workerId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.stringContaining('FOR UPDATE SKIP LOCKED')
      );
      expect(task).toEqual(mockTask);
    });

    test('should return null if no pending tasks', async () => {
      const service = requireTaskQueueService();

      db.query.mockResolvedValue({ rows: [] });

      const workerId = 'worker-1';
      const task = await service.dequeue(workerId);

      expect(task).toBeNull();
    });
  });

  describe('complete(taskId, result)', () => {
    test('should set status to completed and store result', async () => {
      const service = requireTaskQueueService();

      db.query.mockResolvedValue({ rowCount: 1 });

      const taskId = 1;
      const result = { output: 'success' };
      await service.complete(taskId, result);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['completed', result, taskId])
      );
    });
  });

  describe('fail(taskId, error)', () => {
    test('should set status to failed and store error', async () => {
      const service = requireTaskQueueService();

      db.query.mockResolvedValue({ rowCount: 1 });

      const taskId = 1;
      const error = 'Something went wrong';
      await service.fail(taskId, error);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['failed', error, taskId])
      );
    });
  });

  describe('getPendingCount()', () => {
    test('should return number of pending tasks', async () => {
      const service = requireTaskQueueService();

      const count = 5;
      db.query.mockResolvedValue({ rows: [{ count }] });

      const result = await service.getPendingCount();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.anything()
      );
      expect(result).toBe(count);
    });
  });

  describe('getTasksByStatus(status)', () => {
    test('should return tasks with given status', async () => {
      const service = requireTaskQueueService();

      const mockTasks = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' }
      ];
      db.query.mockResolvedValue({ rows: mockTasks });

      const status = 'pending';
      const tasks = await service.getTasksByStatus(status);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([status])
      );
      expect(tasks).toEqual(mockTasks);
    });
  });

  describe('Concurrency: dequeue should not return same task twice', () => {
    test('should use SKIP LOCKED to avoid duplicate processing', async () => {
      const service = requireTaskQueueService();

      // Simulate two concurrent calls: first returns a task, second returns null (or different task)
      const mockTask1 = { id: 1, type: 'test', payload: {} };
      const mockTask2 = null;
      db.query
        .mockResolvedValueOnce({ rows: [mockTask1] })
        .mockResolvedValueOnce({ rows: [] });

      const worker1 = 'worker-1';
      const worker2 = 'worker-2';
      const task1 = await service.dequeue(worker1);
      const task2 = await service.dequeue(worker2);

      expect(task1).toEqual(mockTask1);
      expect(task2).toBeNull();
      // Ensure the query uses SKIP LOCKED
      expect(db.query.mock.calls[0][0]).toMatch(/SKIP LOCKED/i);
    });
  });
});
