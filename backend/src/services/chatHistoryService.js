/**
 * ChatHistoryService - Manages conversation history per project.
 * Each project has its own chat history that Orion can access.
 */
const { query } = require('../db/connection');

class ChatHistoryService {
  /**
   * Save a message to the project's chat history.
   * @param {Object} params
   * @param {number} params.projectId - Project ID (required)
   * @param {string} params.role - 'user', 'assistant', or 'system'
   * @param {string} params.content - Message content
   * @param {string} [params.agent] - Agent name (default: 'Orion')
   * @param {string} [params.mode] - 'tactical' or 'strategic'
   * @param {Object} [params.metadata] - Additional data (tool calls, etc.)
   */
  async saveMessage({ projectId, role, content, agent = 'Orion', mode, metadata }) {
    if (!projectId) {
      console.warn('[ChatHistory] No projectId provided, message not saved');
      return null;
    }
    
    const sql = `
      INSERT INTO chat_messages (project_id, role, content, agent, mode, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;
    const result = await query(sql, [
      projectId,
      role,
      content,
      agent,
      mode || null,
      metadata ? JSON.stringify(metadata) : null
    ]);
    return result.rows[0];
  }

  /**
   * Get conversation history for a project.
   * @param {number} projectId - Project ID
   * @param {number} [limit=20] - Max messages to retrieve
   * @returns {Array} Messages in chronological order
   */
  async getHistory(projectId, limit = 20) {
    if (!projectId) return [];
    
    const sql = `
      SELECT id, role, content, agent, mode, metadata, created_at
      FROM chat_messages
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await query(sql, [projectId, limit]);
    // Return in chronological order (oldest first)
    return result.rows.reverse();
  }

  /**
   * Get recent messages formatted for LLM context.
   * @param {number} projectId - Project ID
   * @param {number} [limit=10] - Max messages
   * @returns {Array} Messages in [{role, content}] format
   */
  async getHistoryForLLM(projectId, limit = 10) {
    const messages = await this.getHistory(projectId, limit);
    return messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));
  }

  /**
   * Clear chat history for a project.
   * @param {number} projectId - Project ID
   */
  async clearProjectHistory(projectId) {
    const sql = 'DELETE FROM chat_messages WHERE project_id = $1';
    await query(sql, [projectId]);
  }

  /**
   * Clear old messages across all projects (retention policy).
   * @param {number} daysToKeep - Keep messages from last N days
   */
  async cleanupOldMessages(daysToKeep = 30) {
    const sql = `
      DELETE FROM chat_messages 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;
    const result = await query(sql);
    return result.rowCount;
  }

  /**
   * Get message count per project (for stats).
   * @returns {Array} [{project_id, message_count, last_message_at}]
   */
  async getProjectStats() {
    const sql = `
      SELECT 
        project_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at
      FROM chat_messages
      GROUP BY project_id
      ORDER BY MAX(created_at) DESC
    `;
    const result = await query(sql);
    return result.rows;
  }
}

module.exports = new ChatHistoryService();

