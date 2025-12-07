const { getPool, closePool } = require('../../db/connection');
require('dotenv').config(); // Ensure env vars are loaded

// Ensure we are using the real pg module, not a mock
jest.unmock('pg');

describe('Workflows Schema', () => {
  let pool;

  beforeAll(() => {
    pool = getPool();
  });

  afterAll(async () => {
    await closePool();
  });

  test('workflows table should exist', async () => {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workflows'
      );
    `);
    console.log('Exists Query Result:', res); // Debug log
    expect(res.rows[0].exists).toBe(true);
  });

  test('workflows table should have required columns', async () => {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'workflows';
    `);
    
    const columns = res.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});

    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('version');
    expect(columns).toHaveProperty('states'); // Should be jsonb
    expect(columns).toHaveProperty('transitions'); // Should be jsonb
    expect(columns).toHaveProperty('is_active'); // boolean
  });
});

