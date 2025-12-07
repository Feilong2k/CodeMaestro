const fs = require('fs');
const path = require('path');

/**
 * ConstraintService - Enforces safety and rate limits for agent operations
 */
class ConstraintService {
  constructor() {
    // In-memory store for rate limiting: agentId -> lastRequestTimestamp
    this.rateLimitMap = new Map();
    // Rate limit window in milliseconds (1 second)
    this.RATE_LIMIT_WINDOW_MS = 1000;
  }

  /**
   * Validates that a file path is safe to use.
   * Rejects paths containing '..', absolute paths, and paths outside the project root.
   * @param {string} inputPath - The path to validate
   * @throws {Error} If the path is unsafe
   */
  validatePathSafety(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }

    // Check for directory traversal patterns
    if (inputPath.includes('..')) {
      throw new Error('Unsafe path: outside project root (contains parent directory traversal)');
    }

    // Check for absolute paths (starting with / or drive letter)
    const isAbsolute = path.isAbsolute(inputPath);
    if (isAbsolute) {
      throw new Error('Unsafe path: absolute paths are not allowed');
    }

    // Normalize the path and resolve relative to the current working directory
    const normalized = path.normalize(inputPath);
    const resolved = path.resolve(process.cwd(), normalized);

    // Ensure the resolved path is within the current working directory
    const cwd = process.cwd();
    if (!resolved.startsWith(cwd)) {
      throw new Error('Unsafe path: outside project root');
    }

    // All checks passed
  }

  /**
   * Validates that a Git repository does not have an active lock file.
   * @param {string} repoPath - Path to the Git repository
   * @throws {Error} If .git/index.lock exists
   */
  validateGitLock(repoPath) {
    // Allow empty repoPath (no repository to check)
    if (repoPath === undefined || repoPath === null) {
      throw new Error('Repository path must be a string');
    }
    if (typeof repoPath !== 'string') {
      throw new Error('Repository path must be a string');
    }
    if (repoPath === '') {
      // Empty path means no repository, so no lock to check
      return;
    }

    const lockPath = path.posix.join(repoPath, '.git', 'index.lock');
    if (fs.existsSync(lockPath)) {
      throw new Error(`Git lock detected at ${lockPath}. Another Git operation may be in progress.`);
    }
  }

  /**
   * Enforces a rate limit of 1 request per second per agent.
   * @param {string} agentId - Unique identifier for the agent
   * @throws {Error} If the rate limit is exceeded
   */
  validateRateLimit(agentId) {
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('Agent ID must be a non-empty string');
    }

    const now = Date.now();
    const lastRequest = this.rateLimitMap.get(agentId);

    if (lastRequest !== undefined) {
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < this.RATE_LIMIT_WINDOW_MS) {
        throw new Error(`Rate limit exceeded for agent ${agentId}. Please wait ${this.RATE_LIMIT_WINDOW_MS - timeSinceLastRequest}ms.`);
      }
    }

    // Update the last request time
    this.rateLimitMap.set(agentId, now);
  }
}

// Export a singleton instance and the class
const instance = new ConstraintService();
module.exports = instance;
module.exports.ConstraintService = ConstraintService;
