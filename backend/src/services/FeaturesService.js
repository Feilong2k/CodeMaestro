const db = require('../db/connection');

/**
 * Service for managing features from the backlog.
 */
const FeaturesService = {
  /**
   * Get all features from the database.
   * @returns {Promise<Array>} List of features.
   */
  async getAllFeatures() {
    const query = `
      SELECT * FROM features
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  /**
   * Search features by title or description.
   * @param {string} query - Search term.
   * @returns {Promise<Array>} Matching features.
   */
  async searchFeatures(query) {
    const searchTerm = `%${query}%`;
    const sql = `
      SELECT * FROM features
      WHERE title ILIKE $1 OR description ILIKE $1
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;
    const result = await db.query(sql, [searchTerm]);
    return result.rows;
  },

  /**
   * Get a single feature by ID.
   * @param {number} id - Feature ID.
   * @returns {Promise<Object|null>} Feature or null if not found.
   */
  async getFeatureById(id) {
    const query = 'SELECT * FROM features WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  }
};

module.exports = FeaturesService;
