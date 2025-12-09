const db = require('../db/connection');

/**
 * Database operations tool (Orion-only).
 * Requires role to be 'Orion' for all operations.
 * Safety: Blocks DROP, TRUNCATE, DELETE without WHERE
 */
class DatabaseTool {
  constructor(role) {
    if (!role) {
      throw new Error('DatabaseTool requires a role');
    }
    this.role = role;
    
    // Dangerous SQL patterns that could wipe data
    this.BLOCKED_PATTERNS = [
      /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX)/i,
      /\bTRUNCATE\b/i,
      /\bDELETE\s+FROM\s+\w+\s*$/i,  // DELETE without WHERE
      /\bDELETE\s+FROM\s+\w+\s*;/i,  // DELETE without WHERE ending with ;
      /\bALTER\s+TABLE\s+\w+\s+DROP/i,
    ];
    
    // Allowed tables for modifications (whitelist)
    this.MODIFIABLE_TABLES = [
      'agent_permissions',
      'agent_tools', 
      'patterns',
      'workflows',
      'memories',
      'tasks',
      'events',
      'logs'
    ];
    
    // Protected tables (read-only unless specific methods)
    this.PROTECTED_TABLES = [
      'agents',
      'tools', 
      'projects',
      'subtasks',
      'features',
      '_migrations'
    ];
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
   * Check if a SQL query is safe to execute.
   * @param {string} sql - SQL query
   * @throws {Error} If query is dangerous
   */
  _checkSafety(sql) {
    if (!sql || typeof sql !== 'string') {
      throw new Error('SQL query must be a non-empty string');
    }
    const normalizedSql = sql.trim();
    
    // Check for blocked patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(normalizedSql)) {
        throw new Error(`Blocked: Dangerous SQL pattern detected. Cannot DROP, TRUNCATE, or DELETE without WHERE clause.`);
      }
    }
    
    // Check for modifications to protected tables
    const modifyPatterns = [
      /\bINSERT\s+INTO\s+(\w+)/i,
      /\bUPDATE\s+(\w+)/i,
      /\bDELETE\s+FROM\s+(\w+)/i,
    ];
    
    for (const pattern of modifyPatterns) {
      const match = normalizedSql.match(pattern);
      if (match) {
        const tableName = match[1].toLowerCase();
        if (this.PROTECTED_TABLES.includes(tableName)) {
          throw new Error(`Blocked: Table "${tableName}" is protected. Use specific methods to modify.`);
        }
      }
    }
    
    return true;
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
   * Get permissions for an agent.
   * @param {string} agentId - Agent ID (e.g., 'tara', 'devon', 'orion')
   * @returns {Promise<Array>} Array of permission entries.
   */
  async getAgentPermissions(agentId) {
    this._checkRole();

    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Agent ID must be a non-empty string');
    }

    const permQuery = `
      SELECT path_pattern, permission, is_allowed, priority
      FROM agent_permissions
      WHERE agent_id = $1
      ORDER BY permission, priority DESC
    `;

    try {
      const result = await db.query(permQuery, [agentId.toLowerCase()]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  }

  /**
   * Get all agents with their tools.
   * @returns {Promise<Array>} Array of agents with tools.
   */
  async getAgentRegistry() {
    this._checkRole();

    const registryQuery = `
      SELECT a.id, a.name, a.role, a.description,
             COALESCE(json_agg(
               json_build_object('name', t.name, 'description', t.description)
             ) FILTER (WHERE t.id IS NOT NULL), '[]') as tools
      FROM agents a
      LEFT JOIN agent_tools at ON a.id = at.agent_id
      LEFT JOIN tools t ON at.tool_id = t.id AND t.is_active = true
      WHERE a.is_active IS NOT FALSE
      GROUP BY a.id, a.name, a.role, a.description
      ORDER BY a.name
    `;

    try {
      const result = await db.query(registryQuery);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get agent registry: ${error.message}`);
    }
  }

  /**
   * Execute a generic SQL query with safety checks.
   * Blocks dangerous operations like DROP, TRUNCATE, DELETE without WHERE.
   * @param {string} sql - SQL query to execute
   * @param {Array} params - Query parameters (optional)
   * @returns {Promise<Object>} Query result { rows, rowCount }
   */
  async query(sql, params = []) {
    this._checkRole();
    this._checkSafety(sql);

    try {
      const result = await db.query(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        command: result.command
      };
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * List all tables in the database.
   * @returns {Promise<Array>} Array of table names.
   */
  async listTables() {
    this._checkRole();

    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
  }

  /**
   * Describe a table's columns.
   * @param {string} tableName - Table name
   * @returns {Promise<Array>} Array of column definitions.
   */
  async describeTable(tableName) {
    this._checkRole();

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error('Invalid table name');
    }

    const result = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
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

  /**
   * Generic execute method for AgentExecutor compatibility.
   * Routes to specific methods based on action parameter.
   * @param {Object} params - { action, ...actionParams }
   * @returns {Promise<any>} Result of the action
   */
  async execute(params) {
    this._checkRole();
    
    const { action, ...actionParams } = params;
    
    switch (action) {
      case 'query':
        return this.query(actionParams.sql, actionParams.params || []);
      
      case 'getAgentPermissions':
        return this.getAgentPermissions(actionParams.agentName || actionParams.agentId);
      
      case 'getAgentRegistry':
        return this.getAgentRegistry();
      
      case 'listTables':
        return this.listTables();
      
      case 'describeTable':
        return this.describeTable(actionParams.tableName);
      
      case 'savePattern':
        return this.savePattern(actionParams.pattern);
      
      case 'updateWorkflow':
        return this.updateWorkflow(actionParams.name, actionParams.definition);
      
      case 'searchLogs':
        return this.searchLogs(actionParams.query);
      
      default:
        throw new Error(`Unknown DatabaseTool action: ${action}`);
    }
  }
}

// Create a default instance with role 'Orion' for testing and general use
const defaultInstance = new DatabaseTool('Orion');

// Export the instance as default (for tests and direct use)
module.exports = defaultInstance;

// Also export the class for the registry and other uses
module.exports.DatabaseTool = DatabaseTool;
