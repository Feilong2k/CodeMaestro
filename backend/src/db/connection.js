const { Pool } = require('pg');

// Database configuration from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_MAX, 10) || 10,
  min: parseInt(process.env.PG_MIN, 10) || 0,
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT_MS, 10) || 10000,
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT_MS, 10) || 5000,
  ssl: { rejectUnauthorized: false },
});

/**
 * Health check: runs a simple query to verify database connectivity.
 * @returns {Promise<boolean>} true if the database is reachable, false otherwise.
 */
async function healthCheck() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

/**
 * Creates a new subtask record.
 * @param {Object} data - The subtask data.
 * @param {string} data.id - The subtask ID (e.g., '2-2').
 * @param {string} data.title - The title of the subtask.
 * @param {string} [data.status='pending'] - The status of the subtask.
 * @param {string} [data.branch] - The associated git branch.
 * @param {string[]} [data.dependencies=[]] - Array of dependency IDs.
 * @returns {Promise<Object>} The created subtask.
 */
async function createSubtask(data) {
  const {
    id,
    title,
    status = 'pending',
    branch = null,
    dependencies = [],
  } = data;

  const query = `
    INSERT INTO subtasks (id, title, status, branch, dependencies)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [id, title, status, branch, dependencies];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Retrieves a subtask by its ID.
 * @param {string} id - The subtask ID.
 * @returns {Promise<Object|null>} The subtask or null if not found.
 */
async function getSubtask(id) {
  const query = 'SELECT * FROM subtasks WHERE id = $1;';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

/**
 * Updates an existing subtask.
 * @param {string} id - The subtask ID.
 * @param {Object} updates - The fields to update.
 * @returns {Promise<Object>} The updated subtask.
 */
async function updateSubtask(id, updates) {
  const allowedFields = ['title', 'status', 'branch', 'dependencies'];
  const setClauses = [];
  const values = [];
  let paramCount = 1;

  allowedFields.forEach(field => {
    if (updates.hasOwnProperty(field)) {
      setClauses.push(`${field} = $${paramCount}`);
      values.push(updates[field]);
      paramCount++;
    }
  });

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided for update');
  }

  values.push(id);
  const query = `
    UPDATE subtasks
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $${paramCount}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  if (result.rows.length === 0) {
    throw new Error(`Subtask with id ${id} not found`);
  }
  return result.rows[0];
}

/**
 * Deletes a subtask by its ID.
 * @param {string} id - The subtask ID.
 * @returns {Promise<Object>} The deleted subtask.
 */
async function deleteSubtask(id) {
  const query = 'DELETE FROM subtasks WHERE id = $1 RETURNING *;';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) {
    throw new Error(`Subtask with id ${id} not found`);
  }
  return result.rows[0];
}

/**
 * Lists all subtasks, ordered by creation date (newest first).
 * @returns {Promise<Array>} Array of subtask objects.
 */
async function listSubtasks() {
  const query = 'SELECT * FROM subtasks ORDER BY created_at DESC;';
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Runs all pending migrations.
 * @returns {Promise<void>}
 */
async function runMigrations() {
  // Create migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Get already applied migrations
  const appliedResult = await pool.query('SELECT name FROM migrations ORDER BY name;');
  const applied = new Set(appliedResult.rows.map(row => row.name));

  // Read migration files from the migrations directory
  const fs = require('fs');
  const path = require('path');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Migration ${file} already applied, skipping.`);
      continue;
    }

    console.log(`Running migration ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1);', [file]);
      await pool.query('COMMIT');
      console.log(`Migration ${file} applied successfully.`);
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`Migration ${file} failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Rolls back the most recent migration.
 * @returns {Promise<void>}
 */
async function rollbackMigration() {
  // Note: This is a simple implementation that rolls back the last applied migration.
  // In a real scenario, you would have down scripts. Here we just delete the last record.
  const result = await pool.query(`
    DELETE FROM migrations
    WHERE id = (SELECT id FROM migrations ORDER BY applied_at DESC LIMIT 1)
    RETURNING name;
  `);

  if (result.rows.length === 0) {
    console.log('No migrations to rollback.');
    return;
  }

  const rolledBack = result.rows[0].name;
  console.log(`Rolled back migration: ${rolledBack}`);
}

module.exports = {
  pool,
  healthCheck,
  createSubtask,
  getSubtask,
  updateSubtask,
  deleteSubtask,
  listSubtasks,
  runMigrations,
  rollbackMigration,
};
