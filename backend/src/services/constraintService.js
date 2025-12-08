const crypto = require('crypto');

/**
 * Constraint Service for RBAC and one-time override tokens.
 */
class ConstraintService {
  constructor() {
    // Store granted tokens: token -> { agent, command, used, reason, createdAt }
    this.grants = new Map();
  }

  /**
   * RBAC: Check if an agent can write to a given path.
   * @param {string} agentRole - 'Devon', 'Tara', or 'Orion'
   * @param {string} path - File path
   * @returns {boolean} True if allowed
   */
  canWrite(agentRole, path) {
    // Normalize path separators
    const normalizedPath = path.replace(/\\/g, '/');

    // Orion can write anywhere
    if (agentRole === 'Orion') {
      return true;
    }

    // Devon: can write to src/ directories, but not to __tests__ directories
    if (agentRole === 'Devon') {
      return normalizedPath.includes('src') && !normalizedPath.includes('__tests__');
    }

    // Tara: can write to __tests__ directories, but not to src/ directories
    if (agentRole === 'Tara') {
      // Block any path containing 'src' (unless it's a test file inside src? but spec says no)
      if (normalizedPath.includes('src')) {
        return false;
      }
      // Allow if it's a test directory or test file extension
      return (
        normalizedPath.includes('__tests__') ||
        normalizedPath.endsWith('.test.js') ||
        normalizedPath.endsWith('.spec.js') ||
        normalizedPath.endsWith('.spec.ts') ||
        normalizedPath.endsWith('.test.ts')
      );
    }

    // Default: deny
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
}

module.exports = new ConstraintService();
