const db = require('../db/connection');

/**
 * Database operations tool (Orion-only).
 * Requires role to be 'Orion' for all operations.
 */
class DatabaseTool {
  constructor(role) {
    if (!role) {
      throw new Error('DatabaseTool requires a role');
    }
    this.role = role;
  }

  /**
   * Check if the current role is Orion.
   * @throws {Error} If role is not Orion.
   */
  _checkRole() {
    if (this.role !== 'Orion') {
      throw new Error('DatabaseTool is only accessible to Orion');
    }
  }

  /**
   * Save a pattern to the database.
   * @param {Object} pattern - Pattern object with name and definition.
   * @returns {Promise<Object>} The saved pattern with ID.
   */
  async savePattern(pattern) {
    this._checkRole();

    if (!pattern || !pattern.name || !pattern.definition) {
      throw new Error('Pattern must have name and definition');
    }

    const query = `
      INSERT INTO patterns (name, definition, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, name, definition, created_at
    `;
    const values = [pattern.name, JSON.stringify(pattern.definition)];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to save pattern: ${error.message}`);
    }
  }

  /**
   * Update a workflow definition.
   * @param {string} name - Workflow name.
   * @param {Object} definition - New workflow definition.
   * @returns {Promise<Object>} Update result.
   */
  async updateWorkflow(name, definition) {
    this._checkRole();

    if (!name || !definition) {
      throw new Error('Workflow name and definition are required');
    }

    const query = `
      UPDATE workflows
      SET definition = $2, updated_at = NOW()
      WHERE name = $1
      RETURNING id, name, definition, updated_at
    `;
    const values = [name, JSON.stringify(definition)];

    try {
      const result = await db.query(query, values);
      if (result.rowCount === 0) {
        throw new Error(`Workflow "${name}" not found`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  /**
   * Search logs for a query string.
   * @param {string} query - Search term.
   * @returns {Promise<Array>} Array of log entries.
   */
  async searchLogs(query) {
    this._checkRole();

    if (!query || typeof query !== 'string') {
      throw new Error('Search query must be a non-empty string');
    }

    const searchTerm = `%${query}%`;
    const searchQuery = `
      SELECT id, level, message, timestamp, metadata
      FROM system_logs
      WHERE message ILIKE $1 OR metadata::text ILIKE $1
      ORDER BY timestamp DESC
      LIMIT 50
    `;

    try {
      const result = await db.query(searchQuery, [searchTerm]);
      return result.rows;
    } catch (error) {
      // If the system_logs table doesn't exist, return empty array
      if (error.message.includes('relation "system_logs" does not exist')) {
        return [];
      }
      throw new Error(`Failed to search logs: ${error.message}`);
    }
  }
}

// Create a default instance with role 'Orion' for testing and general use
const defaultInstance = new DatabaseTool('Orion');

// Export the instance as default (for tests and direct use)
module.exports = defaultInstance;

// Also export the class for the registry and other uses
module.exports.DatabaseTool = DatabaseTool;
