const express = require('express');
const router = express.Router();
const db = require('../db/connection');

/**
 * GET /api/tasks
 * Query parameters:
 * - page (default: 1)
 * - limit (default: 10)
 * - status (optional) filter by status
 * Returns: array of tasks
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM tasks';
    const params = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tasks/stats
 * Returns: counts of tasks grouped by status
 */
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT status, COUNT(*) AS count 
      FROM tasks 
      GROUP BY status
      ORDER BY status;
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tasks/:id/retry
 * Resets a failed task to pending so it can be retried
 */
router.post('/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      UPDATE tasks 
      SET status = 'pending', error = NULL, worker_id = NULL, started_at = NULL, completed_at = NULL
      WHERE id = $1 AND status = 'failed'
      RETURNING id;
    `;
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found or not in failed state' });
    }
    
    res.json({ success: true, message: 'Task reset to pending' });
  } catch (error) {
    console.error('Error retrying task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Removes a task from the queue
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id;';
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
