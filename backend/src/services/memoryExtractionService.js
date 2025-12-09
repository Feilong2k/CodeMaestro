/**
 * MemoryExtractionService - Automatically extracts key facts from conversations.
 * Runs every 50 messages to create condensed "memories" from chat history.
 */
const { query } = require('../db/connection');

class MemoryExtractionService {
  constructor() {
    this.extractionInterval = 50; // Extract every N messages
  }

  /**
   * Check if extraction is needed and trigger if so.
   * @param {number} projectId - Project ID
   */
  async checkAndExtract(projectId) {
    if (!projectId) return;

    try {
      // Get message count for project
      const countResult = await query(
        'SELECT COUNT(*) as count FROM chat_messages WHERE project_id = $1',
        [projectId]
      );
      const messageCount = parseInt(countResult.rows[0].count, 10);

      // Get last extraction point
      const lastExtraction = await this.getLastExtractionPoint(projectId);
      
      // Check if we need to extract
      const messagesSinceExtraction = messageCount - lastExtraction;
      console.log(`[MemoryExtraction] Project ${projectId}: ${messageCount} total, ${messagesSinceExtraction} since last extraction`);

      if (messagesSinceExtraction >= this.extractionInterval) {
        console.log(`[MemoryExtraction] Triggering extraction for project ${projectId}`);
        await this.extractMemories(projectId, lastExtraction, messageCount);
        await this.setLastExtractionPoint(projectId, messageCount);
      }
    } catch (error) {
      console.error('[MemoryExtraction] Error checking extraction:', error.message);
    }
  }

  /**
   * Get the message count at last extraction.
   * @param {number} projectId
   * @returns {number}
   */
  async getLastExtractionPoint(projectId) {
    try {
      const result = await query(
        `SELECT value->>'count' as count FROM memories 
         WHERE project_id = $1 AND key = 'last_extraction_point' AND type = 'system'`,
        [projectId]
      );
      return result.rows.length > 0 ? parseInt(result.rows[0].count, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Save the extraction point.
   * @param {number} projectId
   * @param {number} messageCount
   */
  async setLastExtractionPoint(projectId, messageCount) {
    const valueJson = JSON.stringify({ count: messageCount });
    await query(
      `INSERT INTO memories (project_id, key, value, type, updated_at)
       VALUES ($1, 'last_extraction_point', $2::jsonb, 'system', NOW())
       ON CONFLICT (key, type, project_id, user_id) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [projectId, valueJson]
    );
  }

  /**
   * Extract memories from recent messages using LLM.
   * @param {number} projectId
   * @param {number} fromMessage - Start message index
   * @param {number} toMessage - End message index
   */
  async extractMemories(projectId, fromMessage, toMessage) {
    try {
      // Get messages in range (by offset/limit based on count)
      const messagesResult = await query(
        `SELECT role, content, created_at 
         FROM chat_messages 
         WHERE project_id = $1 
         ORDER BY created_at ASC
         OFFSET $2 LIMIT $3`,
        [projectId, fromMessage, toMessage - fromMessage]
      );

      if (messagesResult.rows.length === 0) {
        console.log('[MemoryExtraction] No messages to extract from');
        return;
      }

      // Format messages for extraction
      const conversationText = messagesResult.rows.map(m => 
        `${m.role.toUpperCase()}: ${m.content}`
      ).join('\n\n');

      // Use LLM to extract key facts
      const extractedFacts = await this.callLLMForExtraction(conversationText, projectId);
      
      if (extractedFacts && extractedFacts.length > 0) {
        await this.saveExtractedFacts(projectId, extractedFacts);
        console.log(`[MemoryExtraction] Saved ${extractedFacts.length} memories for project ${projectId}`);
      }
    } catch (error) {
      console.error('[MemoryExtraction] Extraction failed:', error.message);
    }
  }

  /**
   * Call LLM to extract key facts from conversation.
   * @param {string} conversationText
   * @param {number} projectId
   * @returns {Array<{key: string, value: string}>}
   */
  async callLLMForExtraction(conversationText, projectId) {
    try {
      const TacticalAdapter = require('../llm/TacticalAdapter');
      const adapter = new TacticalAdapter();

      const prompt = `You are a memory extraction system. Analyze the following conversation and extract KEY FACTS that should be remembered for future context.

Focus on:
1. User preferences and decisions
2. Project requirements and constraints
3. Technical decisions (e.g., "using TypeScript", "prefer React over Vue")
4. Important names, URLs, or identifiers
5. Goals and objectives stated by the user
6. Problems encountered and solutions found

DO NOT include:
- Trivial greetings or acknowledgments
- Temporary states or in-progress items
- Questions without answers
- Duplicate information

Return a JSON array of facts. Each fact should have:
- "key": A short, searchable identifier (e.g., "tech_stack", "user_preference_testing", "project_goal")
- "value": The factual information (1-2 sentences max)

Example output:
[
  {"key": "tech_stack", "value": "Project uses Node.js backend with Vue.js frontend"},
  {"key": "user_preference_tdd", "value": "User prefers TDD approach with tests written before implementation"},
  {"key": "project_name", "value": "CodeMaestro - a multi-agent AI development platform"}
]

If no significant facts to extract, return an empty array: []

CONVERSATION:
${conversationText}

JSON ARRAY OF FACTS:`;

      const result = await adapter.generateWithFunctions(prompt, false);
      
      // Parse JSON from response
      const content = result.content || '';
      console.log('[MemoryExtraction] LLM response:', content.substring(0, 500));
      
      // Try to find JSON array in response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          const facts = JSON.parse(jsonMatch[0]);
          console.log('[MemoryExtraction] Parsed facts:', facts.length);
          return Array.isArray(facts) ? facts : [];
        } catch (parseError) {
          console.log('[MemoryExtraction] Failed to parse JSON:', parseError.message);
          console.log('[MemoryExtraction] Raw match:', jsonMatch[0].substring(0, 200));
          return [];
        }
      }
      
      console.log('[MemoryExtraction] No JSON array found in response');
      return [];
    } catch (error) {
      console.error('[MemoryExtraction] LLM extraction failed:', error.message);
      return [];
    }
  }

  /**
   * Save extracted facts to memories table.
   * @param {number} projectId
   * @param {Array<{key: string, value: string}>} facts
   */
  async saveExtractedFacts(projectId, facts) {
    for (const fact of facts) {
      if (!fact.key || !fact.value) continue;
      
      // Wrap value in JSON object for JSONB column
      const valueJson = JSON.stringify({ text: fact.value });
      
      // Use 'extracted' type to distinguish from manual context
      try {
        await query(
          `INSERT INTO memories (project_id, key, value, type, updated_at)
           VALUES ($1, $2, $3::jsonb, 'extracted', NOW())
           ON CONFLICT (key, type, project_id, user_id) 
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [projectId, fact.key, valueJson]
        );
        console.log(`[MemoryExtraction] Saved: ${fact.key}`);
      } catch (err) {
        console.error(`[MemoryExtraction] Failed to save ${fact.key}:`, err.message);
      }
    }
  }

  /**
   * Get all extracted memories for a project.
   * @param {number} projectId
   * @returns {Array}
   */
  async getExtractedMemories(projectId) {
    try {
      const result = await query(
        `SELECT key, value->>'text' as value, updated_at 
         FROM memories 
         WHERE project_id = $1 AND type = 'extracted'
         ORDER BY updated_at DESC`,
        [projectId]
      );
      return result.rows;
    } catch (err) {
      console.warn('[MemoryExtraction] Error getting memories:', err.message);
      return [];
    }
  }

  /**
   * Format extracted memories for LLM context.
   * @param {number} projectId
   * @returns {string}
   */
  async formatMemoriesForContext(projectId) {
    const memories = await this.getExtractedMemories(projectId);
    
    if (memories.length === 0) return '';

    const lines = memories.map(m => `- ${m.key}: ${m.value}`);
    return `\n## Extracted Memories (Key Facts)\n${lines.join('\n')}`;
  }
}

module.exports = new MemoryExtractionService();

