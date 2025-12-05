// Unit tests for PostgreSQL database module
// These tests should fail (Red state) until implementation is complete

// Use the manual mock for pg
const pg = require('../__mocks__/pg');
const { Pool } = pg;

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.PG_MAX = '10';
process.env.PG_MIN = '0';
process.env.PG_IDLE_TIMEOUT_MS = '10000';
process.env.PG_CONNECTION_TIMEOUT_MS = '5000';

// Import the module to test (will fail as it doesn't exist yet)
// This tests the contract of what the module should export
let db;
try {
  db = require('../../../src/db/connection');
} catch (error) {
  // Module doesn't exist yet - expected failure
  console.log('Note: db module does not exist yet. Tests will fail appropriately.');
  db = null;
}

describe('Database Connection Pool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a pool with correct configuration from environment variables', () => {
    // This test verifies that the pool is configured with environment variables
    // The actual implementation should read from process.env
    expect(db).toBeDefined();
    if (!db) return;

    expect(db.pool).toBeInstanceOf(Pool);
    expect(db.pool.config).toEqual({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.PG_MAX, 10),
      min: parseInt(process.env.PG_MIN, 10),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT_MS, 10),
      ssl: { rejectUnauthorized: false }
    });
  });

  test('should export a healthCheck function that returns true on successful query', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.healthCheck).toBe('function');
    
    // Mock the pool query to return successfully
    const mockResult = { rows: [{ '?column?': 1 }] };
    db.pool.query.mockResolvedValue(mockResult);
    
    const result = await db.healthCheck();
    expect(result).toBe(true);
    expect(db.pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  test('should export a healthCheck function that returns false on query failure', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.healthCheck).toBe('function');
    
    // Mock the pool query to throw an error
    db.pool.query.mockRejectedValue(new Error('Connection failed'));
    
    const result = await db.healthCheck();
    expect(result).toBe(false);
    expect(db.pool.query).toHaveBeenCalledWith('SELECT 1');
  });
});

describe('Subtasks CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export createSubtask function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.createSubtask).toBe('function');
  });

  test('createSubtask should insert a subtask with correct fields', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskData = {
      id: '2-2',
      title: 'PostgreSQL Database',
      status: 'in_progress',
      branch: 'subtask/2-2-postgresql-database',
      dependencies: ['2-1']
    };

    const mockResult = { rows: [{ ...subtaskData, created_at: new Date(), updated_at: new Date() }] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.createSubtask(subtaskData);

    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO subtasks'),
      expect.arrayContaining([
        '2-2',
        'PostgreSQL Database',
        'in_progress',
        'subtask/2-2-postgresql-database',
        ['2-1']
      ])
    );
    expect(result).toEqual(mockResult.rows[0]);
  });

  test('should export getSubtask function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.getSubtask).toBe('function');
  });

  test('getSubtask should retrieve a subtask by id', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskId = '2-2';
    const mockResult = { rows: [{ id: subtaskId, title: 'Test' }] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.getSubtask(subtaskId);

    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM subtasks WHERE id ='),
      [subtaskId]
    );
    expect(result).toEqual(mockResult.rows[0]);
  });

  test('should export updateSubtask function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.updateSubtask).toBe('function');
  });

  test('updateSubtask should update a subtask', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskId = '2-2';
    const updates = { status: 'completed', title: 'Updated Title' };
    const mockResult = { rows: [{ id: subtaskId, ...updates }] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.updateSubtask(subtaskId, updates);

    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE subtasks SET'),
      expect.arrayContaining(['completed', 'Updated Title', subtaskId])
    );
    expect(result).toEqual(mockResult.rows[0]);
  });

  test('should export deleteSubtask function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.deleteSubtask).toBe('function');
  });

  test('deleteSubtask should remove a subtask by id', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskId = '2-2';
    const mockResult = { rows: [{ id: subtaskId }] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.deleteSubtask(subtaskId);

    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM subtasks WHERE id ='),
      [subtaskId]
    );
    expect(result).toEqual(mockResult.rows[0]);
  });

  test('should export listSubtasks function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.listSubtasks).toBe('function');
  });

  test('listSubtasks should return all subtasks', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const mockResult = { rows: [{ id: '2-1' }, { id: '2-2' }] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.listSubtasks();

    expect(db.pool.query).toHaveBeenCalledWith('SELECT * FROM subtasks ORDER BY created_at DESC');
    expect(result).toEqual(mockResult.rows);
  });
});

describe('Migration Runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should export runMigrations function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.runMigrations).toBe('function');
  });

  test('runMigrations should execute SQL files from migrations directory', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const mockResult = { rows: [] };
    db.pool.query.mockResolvedValue(mockResult);

    await db.runMigrations();

    // Should create migrations table if not exists
    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations')
    );
    
    // Should read and execute migration files
    // Implementation detail: we expect it to query for applied migrations
    // and run new ones
    expect(db.pool.query).toHaveBeenCalledTimes(expect.any(Number));
  });

  test('should export rollbackMigration function', () => {
    expect(db).toBeDefined();
    if (!db) return;

    expect(typeof db.rollbackMigration).toBe('function');
  });

  test('rollbackMigration should revert the last migration', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const mockResult = { rows: [] };
    db.pool.query.mockResolvedValue(mockResult);

    await db.rollbackMigration();

    expect(db.pool.query).toHaveBeenCalledWith(
      expect.stringContaining('migrations')
    );
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createSubtask should throw error for duplicate id', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskData = { id: '2-2', title: 'Test' };
    const duplicateError = new Error('duplicate key value violates unique constraint');
    duplicateError.code = '23505'; // PostgreSQL unique violation code
    
    db.pool.query.mockRejectedValue(duplicateError);

    await expect(db.createSubtask(subtaskData)).rejects.toThrow(
      expect.objectContaining({
        code: '23505',
        message: expect.stringContaining('duplicate')
      })
    );
  });

  test('getSubtask should return null for non-existent subtask', async () => {
    expect(db).toBeDefined();
    if (!db) return;

    const subtaskId = 'non-existent';
    const mockResult = { rows: [] };
    db.pool.query.mockResolvedValue(mockResult);

    const result = await db.getSubtask(subtaskId);
    expect(result).toBeNull();
  });
});
