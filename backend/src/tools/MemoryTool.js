/**
 * MemoryTool - Search and manage project memories and conversation history.
 * Enables Orion to recall past discussions and stored context.
 */
const { query } = require('../db/connection');

class MemoryTool {
  constructor(agentName = 'Orion') {
    this.agentName = agentName;
  }

  /**
   * Search past conversations and memories using PostgreSQL full-text search.
   * @param {number} projectId - Project ID to search within
   * @param {string} searchQuery - Keywords to search for
   * @param {number} limit - Max results (default: 5)
   * @returns {Promise<Array>} Matching messages/memories
   */
  async search(projectId, searchQuery, limit = 5) {
    if (!searchQuery || typeof searchQuery !== 'string') {
      throw new Error('Search query is required');
    }

    // Clean the search query - remove special characters that break tsquery
    const cleanQuery = searchQuery
      .replace(/[^\w\s]/g, ' ')  // Remove special chars
      .trim()
      .split(/\s+/)              // Split into words
      .filter(w => w.length > 2) // Remove short words
      .join(' | ');              // OR between words

    if (!cleanQuery) {
      return [];
    }

    try {
      // Search chat_messages using full-text search
      const sql = `
        SELECT 
          id,
          role,
          content,
          agent,
          created_at,
          ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as relevance
        FROM chat_messages 
        WHERE project_id = $1 
          AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        ORDER BY relevance DESC, created_at DESC
        LIMIT $3
      `;
      
      const result = await query(sql, [projectId, searchQuery, limit]);
      
      // Format results for LLM consumption
      return result.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content.substring(0, 500) + (row.content.length > 500 ? '...' : ''),
        agent: row.agent,
        date: row.created_at,
        relevance: parseFloat(row.relevance).toFixed(3)
      }));
    } catch (error) {
      // If full-text search fails (e.g., no tsvector), fall back to ILIKE
      console.warn('[MemoryTool] Full-text search failed, using ILIKE fallback:', error.message);
      
      const fallbackSql = `
        SELECT id, role, content, agent, created_at
        FROM chat_messages 
        WHERE project_id = $1 
          AND content ILIKE $2
        ORDER BY created_at DESC
        LIMIT $3
      `;
      
      const result = await query(fallbackSql, [projectId, `%${searchQuery}%`, limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        role: row.role,
        content: row.content.substring(0, 500) + (row.content.length > 500 ? '...' : ''),
        agent: row.agent,
        date: row.created_at
      }));
    }
  }

  /**
   * Search memories table (if it exists with searchable content).
   * @param {number} projectId - Project ID
   * @param {string} searchQuery - Keywords
   * @returns {Promise<Array>} Matching memories
   */
  async searchMemories(projectId, searchQuery) {
    try {
      const sql = `
        SELECT key, value, type, created_at
        FROM memories
        WHERE (project_id = $1 OR project_id IS NULL)
          AND (
            key ILIKE $2 
            OR value::text ILIKE $2
          )
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const result = await query(sql, [projectId, `%${searchQuery}%`]);
      return result.rows;
    } catch (error) {
      console.warn('[MemoryTool] Memory search failed:', error.message);
      return [];
    }
  }

  /**
   * Execute method for AgentExecutor compatibility.
   * @param {Object} params - { action, query, limit, projectId }
   * @returns {Promise<any>} Search results
   */
  async execute(params) {
    const { action, query: searchQuery, limit, projectId } = params;
    
    switch (action) {
      case 'search':
        if (!projectId) {
          return { error: 'projectId is required to search memories' };
        }
        
        // Search both chat history and memories
        const [chatResults, memoryResults] = await Promise.all([
          this.search(projectId, searchQuery, limit || 5),
          this.searchMemories(projectId, searchQuery)
        ]);
        
        return {
          chatHistory: chatResults,
          memories: memoryResults,
          summary: `Found ${chatResults.length} messages and ${memoryResults.length} memories matching "${searchQuery}"`
        };
        
      default:
        throw new Error(`Unknown MemoryTool action: ${action}`);
    }
  }
}

module.exports = new MemoryTool();
module.exports.MemoryTool = MemoryTool;

