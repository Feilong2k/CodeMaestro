const { describe, test, expect, beforeEach } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let TaskQueueService;
try {
  TaskQueueService = require('../../../src/services/TaskQueueService');
} catch (error) {
  console.error('Error requiring TaskQueueService:', error.message, error.stack);
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  TaskQueueService = {};
}

// Mock the database connection
jest.mock('../../../src/db/connection', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn()
  }
}));

const db = require('../../../src/db/connection');
const mockQuery = db.query;
const mockConnect = db.pool.connect;

// Mock client for transactions
const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Helper to ensure we have a method to test, otherwise skip the test.
function requireTaskQueueService() {
  if (!TaskQueueService) {
    throw new Error('TaskQueueService module not found.');
  }
  // Check if enqueue is a function (either own property or inherited)
  const enqueueFunc = TaskQueueService.enqueue;
  if (typeof enqueueFunc !== 'function') {
    throw new Error('TaskQueueService module does not export the expected methods.');
  }
  return TaskQueueService;
}

describe('Task Queue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockClear();
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    mockConnect.mockClear();
    // Setup default mock for connect to return our mockClient
    mockConnect.mockResolvedValue(mockClient);
  });

  describe('enqueue(type, payload)', () => {
    test('should insert task with pending status', async () => {
      const service = requireTaskQueueService();

      const mockTask = { id: 1, type: 'test', payload: { data: 'value' }, status: 'pending' };
      mockQuery.mockResolvedValue({ rows: [mockTask] });

      const type = 'test';
      const payload = { data: 'value' };
      const task = await service.enqueue(type, payload);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        [type, payload]
      );
      expect(task).toEqual(mockTask);
    });
  });

  describe('dequeue(workerId)', () => {
    test('should return oldest pending task and set status to running', async () => {
      const service = requireTaskQueueService();

      const mockTask = { id: 1, type: 'test', payload: {}, status: 'running' };
      // Simulate the transaction: BEGIN, SELECT, UPDATE, COMMIT
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN (no rows)
        .mockResolvedValueOnce({ rows: [mockTask] }) // SELECT
        .mockResolvedValueOnce({ rows: [mockTask] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const workerId = 'worker-1';
      const task = await service.dequeue(workerId);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      // Check that the second call (index 1) is the SELECT query
      expect(mockClient.query.mock.calls[1][0]).toMatch(/SELECT/);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [workerId, mockTask.id]
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(task).toEqual(mockTask);
    });

    test('should return null if no pending tasks', async () => {
      const service = requireTaskQueueService();

      // Simulate no pending tasks: BEGIN, SELECT returns empty, ROLLBACK
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT returns empty
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK

      const workerId = 'worker-1';
      const task = await service.dequeue(workerId);

      expect(mockConnect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      // Check that the second call (index 1) is the SELECT query
      expect(mockClient.query.mock.calls[1][0]).toMatch(/SELECT/);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
      expect(task).toBeNull();
    });
  });

  describe('complete(taskId, result)', () => {
    test('should set status to completed and store result', async () => {
      const service = requireTaskQueueService();

      mockQuery.mockResolvedValue({ rowCount: 1 });

      const taskId = 1;
      const result = { output: 'success' };
      await service.complete(taskId, result);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [result, taskId]
      );
    });
  });

  describe('fail(taskId, error)', () => {
    test('should set status to failed and store error', async () => {
      const service = requireTaskQueueService();

      mockQuery.mockResolvedValue({ rowCount: 1 });

      const taskId = 1;
      const error = 'Something went wrong';
      await service.fail(taskId, error);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [error, taskId]
      );
    });
  });

  describe('getPendingCount()', () => {
    test('should return number of pending tasks', async () => {
      const service = requireTaskQueueService();

      const count = 5;
      mockQuery.mockResolvedValue({ rows: [{ count }] });

      const result = await service.getPendingCount();

      // Check that the query was called with a string containing 'SELECT COUNT'
      expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT COUNT/);
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
      mockQuery.mockResolvedValue({ rows: mockTasks });

      const status = 'pending';
      const tasks = await service.getTasksByStatus(status);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [status]
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

      // First call: successful dequeue
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [mockTask1] }) // SELECT
        .mockResolvedValueOnce({ rows: [mockTask1] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }); // COMMIT
      mockConnect.mockResolvedValueOnce(mockClient);

      // Second call: no pending tasks
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // SELECT returns empty
        .mockResolvedValueOnce({ rows: [] }); // ROLLBACK
      mockConnect.mockResolvedValueOnce(mockClient);

      const worker1 = 'worker-1';
      const worker2 = 'worker-2';
      const task1 = await service.dequeue(worker1);
      const task2 = await service.dequeue(worker2);

      expect(task1).toEqual(mockTask1);
      expect(task2).toBeNull();
      // Ensure the SELECT query uses SKIP LOCKED
      expect(mockClient.query.mock.calls[1][0]).toMatch(/SKIP LOCKED/i);
    });
  });
});
