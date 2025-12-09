/**
 * Service for logging Agent FSM transitions to the database.
 */
const db = require('../db/connection');

class AgentFsmLogService {
  /**
   * Log a state transition.
   * @param {string} subtaskId - The subtask identifier (e.g., '6-1')
   * @param {string} agent - Agent name (e.g., 'Orion', 'Devon', 'Tara')
   * @param {string} fromState - State before transition (e.g., 'OBSERVE')
   * @param {string} toState - State after transition (e.g., 'THINK')
   * @returns {Promise<Object>} The inserted log entry
   */
  static async logTransition(subtaskId, agent, fromState, toState) {
    const query = `
      INSERT INTO agent_fsm_log (subtask_id, agent, from_state, to_state, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *;
    `;
    const values = [subtaskId, agent, fromState, toState];
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Failed to log Agent FSM transition:', error);
      // We don't want to break the agent loop if logging fails, so we return a stub.
      return {
        subtask_id: subtaskId,
        agent,
        from_state: fromState,
        to_state: toState,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Retrieve all transitions for a given subtask, ordered by timestamp.
   * @param {string} subtaskId - The subtask identifier
   * @returns {Promise<Array>} Array of log entries
   */
  static async getTransitionsBySubtask(subtaskId) {
    const query = `
      SELECT id, subtask_id, agent, from_state, to_state, timestamp
      FROM agent_fsm_log
      WHERE subtask_id = $1
      ORDER BY timestamp ASC;
    `;
    const values = [subtaskId];
    try {
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Failed to fetch Agent FSM logs:', error);
      return [];
    }
  }

  /**
   * Retrieve the latest transition for a given subtask.
   * @param {string} subtaskId - The subtask identifier
   * @returns {Promise<Object|null>} The latest log entry or null
   */
  static async getLatestTransition(subtaskId) {
    const query = `
      SELECT id, subtask_id, agent, from_state, to_state, timestamp
      FROM agent_fsm_log
      WHERE subtask_id = $1
      ORDER BY timestamp DESC
      LIMIT 1;
    `;
    const values = [subtaskId];
    try {
      const result = await db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Failed to fetch latest Agent FSM log:', error);
      return null;
    }
  }
}

module.exports = AgentFsmLogService;
