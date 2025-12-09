const crypto = require('crypto');
const agentRegistryService = require('./agentRegistryService');

/**
 * Constraint Service for RBAC and one-time override tokens.
 */
class ConstraintService {
  constructor() {
    // Store granted tokens: token -> { agent, command, used, reason, createdAt }
    this.grants = new Map();
    // Allowed test file extensions for Tara (fallback)
    this.TEST_EXTENSIONS = new Set(['.test.js', '.spec.js', '.test.ts', '.spec.ts']);
  }

  /**
   * RBAC: Check if an agent can write to a given path (async, uses DB).
   * @param {string} agentRole - 'Devon', 'Tara', or 'Orion'
   * @param {string} path - File path
   * @returns {Promise<boolean>} True if allowed
   */
  async canWrite(agentRole, path) {
    try {
      return await agentRegistryService.checkPermission(agentRole, path, 'write');
    } catch (error) {
      console.error('[ConstraintService] DB permission check failed, using fallback:', error.message);
      return this._canWriteFallback(agentRole, path);
    }
  }

  /**
   * RBAC: Check if an agent can read a given path (async, uses DB).
   * @param {string} agentRole - 'Devon', 'Tara', or 'Orion'
   * @param {string} path - File path
   * @returns {Promise<boolean>} True if allowed
   */
  async canRead(agentRole, path) {
    try {
      return await agentRegistryService.checkPermission(agentRole, path, 'read');
    } catch (error) {
      console.error('[ConstraintService] DB permission check failed, using fallback:', error.message);
      // Default: all agents can read
      return true;
    }
  }

  /**
   * Fallback write check if DB is unavailable
   * @private
   */
  _canWriteFallback(agentRole, path) {
    const normalizedPath = path.replace(/\\/g, '/');

    if (agentRole.toLowerCase() === 'orion') {
      return true;
    }

    if (agentRole.toLowerCase() === 'devon') {
      return this._isSrcPath(normalizedPath) && !this._isTestPath(normalizedPath);
    }

    if (agentRole.toLowerCase() === 'tara') {
      if (this._isSrcPath(normalizedPath)) {
        return false;
      }
      return this._isTestPath(normalizedPath);
    }

    return false;
  }

  /**
   * Generate a one-time access token for a command.
   * @param {string} agentRole - Agent requesting the token
   * @param {string} command - Command to be allowed
   * @param {string} reason - Reason for the override
   * @returns {string} UUID token
   */
  grantOneTimeAccess(agentRole, command, reason) {
    const token = crypto.randomUUID();
    this.grants.set(token, {
      agent: agentRole,
      command,
      reason,
      used: false,
      createdAt: Date.now(),
    });
    return token;
  }

  /**
   * Validate a grant token for a specific agent and command.
   * Marks the token as used if valid.
   * @param {string} agentRole - Agent using the token
   * @param {string} command - Command being executed
   * @param {string} token - The token to validate
   * @returns {boolean} True if token is valid and not yet used
   */
  validateGrant(agentRole, command, token) {
    const grant = this.grants.get(token);
    if (!grant) {
      return false;
    }
    if (grant.used) {
      return false;
    }
    if (grant.agent !== agentRole) {
      return false;
    }
    if (grant.command !== command) {
      return false;
    }
    // Mark as used
    grant.used = true;
    this.grants.set(token, grant);
    return true;
  }

  /**
   * Check if a command is allowed without a token.
   * Currently, no commands are allowed without a token (non-whitelisted).
   * @param {string} agentRole - Agent role
   * @param {string} command - Command to check
   * @returns {boolean} True if allowed
   */
  isCommandAllowed(agentRole, command) {
    // No whitelist implemented; all commands require a token.
    // In the future, we can add a whitelist per agent.
    return false;
  }

  /**
   * Check if a command is allowed with a token.
   * @param {string} agentRole - Agent role
   * @param {string} command - Command to check
   * @param {string} token - Token to validate
   * @returns {boolean} True if token is valid and command matches
   */
  isCommandAllowedWithToken(agentRole, command, token) {
    return this.validateGrant(agentRole, command, token);
  }

  // Private helper methods

  /**
   * Check if path is a source path (contains 'src').
   * @private
   */
  _isSrcPath(normalizedPath) {
    return normalizedPath.includes('src');
  }

  /**
   * Check if path is a test path (contains __tests__ or has test extension).
   * @private
   */
  _isTestPath(normalizedPath) {
    // Check for __tests__ directory
    if (normalizedPath.includes('__tests__')) {
      return true;
    }
    // Check for test file extensions
    for (const ext of this.TEST_EXTENSIONS) {
      if (normalizedPath.endsWith(ext)) {
        return true;
      }
    }
    return false;
  }
}

// Export a singleton instance
const instance = new ConstraintService();
module.exports = instance;
