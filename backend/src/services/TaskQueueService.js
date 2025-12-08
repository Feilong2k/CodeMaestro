const db = require('../db/connection');

class TaskQueueService {
  /**
   * Enqueue a new task.
   * @param {string} type - Task type (e.g., 'process_data', 'send_email')
   * @param {object} payload - Task data (will be stored as JSONB)
   * @returns {Promise<object>} The inserted task (including generated id)
   */
  async enqueue(type, payload) {
    const query = `
      INSERT INTO tasks (type, payload, status, created_at)
      VALUES ($1, $2, 'pending', NOW())
      RETURNING *;
    `;
    const result = await db.query(query, [type, payload]);
    return result.rows[0];
  }

  /**
   * Dequeue the next pending task (using SKIP LOCKED for concurrent workers).
   * @param {string} workerId - Identifier of the worker claiming the task
   * @returns {Promise<object|null>} The claimed task, or null if none available
   */
  async dequeue(workerId) {
    // Use a transaction to lock the row and update it atomically
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      // Select the oldest pending task and lock it
      const selectQuery = `
        SELECT * FROM tasks
        WHERE status = 'pending'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1;
      `;
      const selectResult = await client.query(selectQuery);
      if (selectResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const task = selectResult.rows[0];
      // Update the task as being processed by this worker
      const updateQuery = `
        UPDATE tasks
        SET status = 'running', worker_id = $1, started_at = NOW()
        WHERE id = $2
        RETURNING *;
      `;
      const updateResult = await client.query(updateQuery, [workerId, task.id]);
      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark a task as completed with a result.
   * @param {number} taskId - ID of the task to complete
   * @param {object} result - Result data (stored as JSONB)
   * @returns {Promise<boolean>} True if the task was updated
   */
  async complete(taskId, result) {
    const query = `
      UPDATE tasks
      SET status = 'completed', result = $1, completed_at = NOW()
      WHERE id = $2 AND status = 'running'
      RETURNING id;
    `;
    const dbResult = await db.query(query, [result, taskId]);
    return dbResult.rowCount > 0;
  }

  /**
   * Mark a task as failed with an error message.
   * @param {number} taskId - ID of the task that failed
   * @param {string} error - Error description
   * @returns {Promise<boolean>} True if the task was updated
   */
  async fail(taskId, error) {
    const query = `
      UPDATE tasks
      SET status = 'failed', error = $1, completed_at = NOW()
      WHERE id = $2 AND status = 'running'
      RETURNING id;
    `;
    const dbResult = await db.query(query, [error, taskId]);
    return dbResult.rowCount > 0;
  }

  /**
   * Get the count of pending tasks.
   * @returns {Promise<number>} Number of pending tasks
   */
  async getPendingCount() {
    const query = `
      SELECT COUNT(*) AS count FROM tasks WHERE status = 'pending';
    `;
    const result = await db.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get tasks by status (e.g., 'pending', 'running', 'completed', 'failed').
   * @param {string} status - The status to filter by
   * @returns {Promise<Array>} List of tasks with the given status
   */
  async getTasksByStatus(status) {
    const query = `
      SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC;
    `;
    const result = await db.query(query, [status]);
    return result.rows;
  }
}

module.exports = new TaskQueueService();
