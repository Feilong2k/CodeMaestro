const { query } = require('../db/connection');

/**
 * AgentRegistryService - Manages agents and their tool assignments from the database
 */
class AgentRegistryService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = null;
    this.CACHE_TTL = 60000; // 1 minute cache
  }

  /**
   * Get all active agents with their tools
   * @returns {Promise<Array>}
   */
  async getAllAgents() {
    const result = await query(`
      SELECT a.id, a.name, a.role, a.description,
             COALESCE(json_agg(
               json_build_object('name', t.name, 'description', t.description, 'class_name', t.class_name)
             ) FILTER (WHERE t.id IS NOT NULL), '[]') as tools
      FROM agents a
      LEFT JOIN agent_tools at ON a.id = at.agent_id
      LEFT JOIN tools t ON at.tool_id = t.id AND t.is_active = true
      WHERE a.is_active IS NOT FALSE
      GROUP BY a.id, a.name, a.role, a.description
      ORDER BY a.name
    `);
    return result.rows;
  }

  /**
   * Get tools for a specific agent
   * @param {string} agentName 
   * @returns {Promise<Array>}
   */
  async getToolsForAgent(agentName) {
    const result = await query(`
      SELECT t.name, t.description, t.class_name
      FROM tools t
      JOIN agent_tools at ON t.id = at.tool_id
      JOIN agents a ON at.agent_id = a.id
      WHERE a.name = $1 AND a.is_active = true AND t.is_active = true
    `, [agentName]);
    return result.rows;
  }

  /**
   * Get all active tools
   * @returns {Promise<Array>}
   */
  async getAllTools() {
    const result = await query(`
      SELECT name, description, class_name
      FROM tools
      WHERE is_active = true
      ORDER BY name
    `);
    return result.rows;
  }

  /**
   * Get cached agent/tool data (for system prompts)
   * @returns {Promise<Object>}
   */
  async getCachedRegistry() {
    const now = Date.now();
    
    if (this.cache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cache;
    }

    try {
      const agents = await this.getAllAgents();
      const tools = await this.getAllTools();

      this.cache = {
        agents,
        tools,
        toolDescriptions: tools.reduce((acc, t) => {
          acc[t.name] = t.description;
          return acc;
        }, {}),
        agentTools: agents.reduce((acc, a) => {
          acc[a.name] = a.tools.map(t => t.name);
          return acc;
        }, {})
      };
      this.cacheExpiry = now + this.CACHE_TTL;

      return this.cache;
    } catch (error) {
      console.error('[AgentRegistryService] Error loading registry:', error.message);
      // Return fallback if DB fails
      return this.getFallbackRegistry();
    }
  }

  /**
   * Fallback registry if database is unavailable
   */
  getFallbackRegistry() {
    return {
      agents: [
        { name: 'Orion', description: 'Strategic orchestrator', tools: [] },
        { name: 'Devon', description: 'Implementation agent', tools: [] },
        { name: 'Tara', description: 'Testing agent', tools: [] }
      ],
      tools: [
        { name: 'FileSystemTool', description: 'Read/write files' },
        { name: 'GitTool', description: 'Git operations' },
        { name: 'ShellTool', description: 'Shell commands' },
        { name: 'ProjectTool', description: 'Project management' },
        { name: 'DatabaseTool', description: 'Database queries' }
      ],
      toolDescriptions: {
        FileSystemTool: 'Read/write files with path traversal protection',
        GitTool: 'Git operations (commit, branch, push, pull) with safety checks',
        ShellTool: 'Execute shell commands with whitelist/blocklist safety',
        ProjectTool: 'CRUD operations for project management',
        DatabaseTool: 'Direct database queries (Orion-only access)'
      },
      agentTools: {
        Orion: ['FileSystemTool', 'GitTool', 'ShellTool', 'ProjectTool', 'DatabaseTool'],
        Devon: ['FileSystemTool', 'GitTool', 'ShellTool', 'ProjectTool'],
        Tara: ['FileSystemTool', 'GitTool', 'ShellTool']
      }
    };
  }

  /**
   * Invalidate cache (call after updates)
   */
  invalidateCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  // --- CRUD Operations ---

  /**
   * Add a new agent
   */
  async createAgent(id, name, role, description) {
    const result = await query(
      'INSERT INTO agents (id, name, role, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, role, description]
    );
    this.invalidateCache();
    return result.rows[0];
  }

  /**
   * Add a new tool
   */
  async createTool(name, description, className) {
    const result = await query(
      'INSERT INTO tools (name, description, class_name) VALUES ($1, $2, $3) RETURNING *',
      [name, description, className]
    );
    this.invalidateCache();
    return result.rows[0];
  }

  /**
   * Assign a tool to an agent
   */
  async assignToolToAgent(agentName, toolName) {
    await query(`
      INSERT INTO agent_tools (agent_id, tool_id)
      SELECT a.id, t.id FROM agents a, tools t
      WHERE a.name = $1 AND t.name = $2
      ON CONFLICT DO NOTHING
    `, [agentName, toolName]);
    this.invalidateCache();
  }

  /**
   * Remove a tool from an agent
   */
  async removeToolFromAgent(agentName, toolName) {
    await query(`
      DELETE FROM agent_tools
      WHERE agent_id = (SELECT id FROM agents WHERE name = $1)
        AND tool_id = (SELECT id FROM tools WHERE name = $2)
    `, [agentName, toolName]);
    this.invalidateCache();
  }

  // --- Permission Management ---

  /**
   * Check if an agent has permission for a path
   * @param {string} agentId - Agent ID (lowercase: 'tara', 'devon', 'orion')
   * @param {string} path - File path to check
   * @param {string} permission - 'read', 'write', or 'execute'
   * @returns {Promise<boolean>}
   */
  async checkPermission(agentId, path, permission) {
    try {
      // Get all matching permissions, ordered by priority (highest first)
      const result = await query(`
        SELECT path_pattern, is_allowed, priority
        FROM agent_permissions
        WHERE agent_id = $1 AND permission = $2
        ORDER BY priority DESC
      `, [agentId.toLowerCase(), permission]);

      if (result.rows.length === 0) {
        // No permissions defined = deny by default
        return false;
      }

      // Normalize path
      const normalizedPath = path.replace(/\\/g, '/');

      // Check each pattern (highest priority first)
      for (const row of result.rows) {
        if (this._matchesPattern(normalizedPath, row.path_pattern)) {
          return row.is_allowed;
        }
      }

      // No pattern matched = deny
      return false;
    } catch (error) {
      console.error('[AgentRegistryService] Permission check error:', error.message);
      return false; // Fail closed
    }
  }

  /**
   * Get all permissions for an agent
   */
  async getPermissionsForAgent(agentId) {
    const result = await query(`
      SELECT path_pattern, permission, is_allowed, priority
      FROM agent_permissions
      WHERE agent_id = $1
      ORDER BY permission, priority DESC
    `, [agentId.toLowerCase()]);
    return result.rows;
  }

  /**
   * Add a permission for an agent
   */
  async addPermission(agentId, pathPattern, permission, isAllowed, priority = 0) {
    await query(`
      INSERT INTO agent_permissions (agent_id, path_pattern, permission, is_allowed, priority)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (agent_id, path_pattern, permission) 
      DO UPDATE SET is_allowed = $4, priority = $5
    `, [agentId.toLowerCase(), pathPattern, permission, isAllowed, priority]);
  }

  /**
   * Remove a permission
   */
  async removePermission(agentId, pathPattern, permission) {
    await query(`
      DELETE FROM agent_permissions
      WHERE agent_id = $1 AND path_pattern = $2 AND permission = $3
    `, [agentId.toLowerCase(), pathPattern, permission]);
  }

  /**
   * Match a path against a pattern
   * Supports: * (wildcard), specific paths
   * @private
   */
  _matchesPattern(path, pattern) {
    // Normalize both
    const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
    const normalizedPattern = pattern.replace(/\\/g, '/').toLowerCase();

    // Exact match
    if (normalizedPattern === '*') {
      return true;
    }

    // Wildcard at end: 'src/*' matches 'src/file.js', 'src/sub/file.js'
    if (normalizedPattern.endsWith('/*')) {
      const prefix = normalizedPattern.slice(0, -2);
      return normalizedPath.includes(prefix);
    }

    // Extension match: '*.test.js' matches 'file.test.js'
    if (normalizedPattern.startsWith('*.')) {
      const ext = normalizedPattern.slice(1);
      return normalizedPath.endsWith(ext);
    }

    // Contains match: '__tests__' matches any path containing it
    if (!normalizedPattern.includes('/') && !normalizedPattern.includes('*')) {
      return normalizedPath.includes(normalizedPattern);
    }

    // Exact path match
    return normalizedPath === normalizedPattern;
  }
}

module.exports = new AgentRegistryService();

