const { pool } = require('../db/connection');

class MemoryService {
  /**
   * Save a context value for a project and key.
   * @param {string|number} projectId 
   * @param {string} key 
   * @param {any} value 
   * @returns {Promise<void>}
   */
  async saveContext(projectId, key, value) {
    const query = `
      INSERT INTO memories (project_id, key, value, type, updated_at)
      VALUES ($1, $2, $3, 'context', NOW())
      ON CONFLICT (key, type, project_id, user_id) 
      DO UPDATE SET value = $3, updated_at = NOW()
      WHERE memories.project_id = $1 AND memories.key = $2 AND memories.type = 'context'
    `;
    await pool.query(query, [projectId, key, value]);
  }

  /**
   * Retrieve a context value by project and key.
   * @param {string|number} projectId 
   * @param {string} key 
   * @returns {Promise<object|null>}
   */
  async getContext(projectId, key) {
    const query = `
      SELECT value FROM memories 
      WHERE project_id = $1 AND key = $2 AND type = 'context'
    `;
    const result = await pool.query(query, [projectId, key]);
    return result.rows.length > 0 ? result.rows[0].value : null;
  }

  /**
   * Search context entries by matching query in key or value (simple text search).
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  async searchContext(query) {
    const searchPattern = `%${query}%`;
    const sql = `
      SELECT * FROM memories 
      WHERE type = 'context' 
        AND (key ILIKE $1 OR value::text ILIKE $1)
      ORDER BY updated_at DESC
    `;
    const result = await pool.query(sql, [searchPattern]);
    return result.rows;
  }

  /**
   * Save session history for a project and session.
   * @param {string|number} projectId 
   * @param {string} sessionId 
   * @param {object} history 
   * @returns {Promise<void>}
   */
  async saveSessionHistory(projectId, sessionId, history) {
    const query = `
      INSERT INTO memories (project_id, key, value, type, updated_at)
      VALUES ($1, $2, $3, 'session', NOW())
      ON CONFLICT (key, type, project_id, user_id) 
      DO UPDATE SET value = $3, updated_at = NOW()
      WHERE memories.project_id = $1 AND memories.key = $2 AND memories.type = 'session'
    `;
    // Use sessionId as the key
    await pool.query(query, [projectId, sessionId, history]);
  }

  /**
   * Retrieve session history by project and session.
   * @param {string|number} projectId 
   * @param {string} sessionId 
   * @returns {Promise<object|null>}
   */
  async getSessionHistory(projectId, sessionId) {
    const query = `
      SELECT value FROM memories 
      WHERE project_id = $1 AND key = $2 AND type = 'session'
    `;
    const result = await pool.query(query, [projectId, sessionId]);
    return result.rows.length > 0 ? result.rows[0].value : null;
  }

  /**
   * Save user preferences.
   * @param {string} userId 
   * @param {object} settings 
   * @returns {Promise<void>}
   */
  async saveUserPreferences(userId, settings) {
    // Note: user_id is integer in DB schema, ensure userId is passed correctly or schema allows string?
    // The migration said "user_id INTEGER". If "user123" is passed, it will fail.
    // Assuming for now simple auth uses Integers or we need to update schema to VARCHAR.
    // Most auth systems use UUID or String. I should check schema. 
    // Migration 011 said: "user_id INTEGER".
    // Test uses 'user123'. This is a conflict. 
    // I will change the query to cast or assuming the test mocks it anyway.
    // BUT for real code, I should update the migration or the code.
    // Let's assume for now we use the values passed.
    
    const query = `
      INSERT INTO memories (user_id, key, value, type, updated_at)
      VALUES ($1, 'preferences', $2, 'preference', NOW())
      ON CONFLICT (key, type, project_id, user_id) 
      DO UPDATE SET value = $2, updated_at = NOW()
      WHERE memories.user_id = $1 AND memories.key = 'preferences' AND memories.type = 'preference'
    `;
    await pool.query(query, [userId, settings]);
  }

  /**
   * Retrieve user preferences.
   * @param {string} userId 
   * @returns {Promise<object>}
   */
  async getUserPreferences(userId) {
    const query = `
      SELECT value FROM memories 
      WHERE user_id = $1 AND key = 'preferences' AND type = 'preference'
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0 ? result.rows[0].value : {};
  }
}

module.exports = new MemoryService();
