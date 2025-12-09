const { exec } = require('child_process');
const util = require('util');

// Convert exec to promise-based for easier error handling
const execPromise = util.promisify(exec);

/**
 * Safe Git operations with command validation.
 */
class GitTool {
  /**
   * Validate a string for safe git arguments (basic safety).
   * @param {string} input - The input string to validate.
   * @returns {boolean} True if safe.
   * @throws {Error} If unsafe.
   */
  static validateInput(input) {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }

    // Block dangerous patterns
    const dangerousPatterns = [
      /;\s*rm\s+-rf/,
      /;\s*rm\s+-r/,
      /;\s*del\s+\/s/,
      /&&\s*rm/,
      /\|\s*rm/,
      /`.*`/,
      /\$\(.*\)/,
      /\.\.\//,
      /\.\.\\/,
      /\/etc/,
      /\/bin/,
      /\/usr/,
      /\/var/,
      /\/root/,
      /\/home/,
      /\/windows/,
      /\/system32/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        throw new Error(`Dangerous pattern detected: ${pattern}`);
      }
    }

    // Allow alphanumeric, spaces, dashes, underscores, dots, slashes, @, :, #, ? for git commands
    // This is a permissive validation; we rely on the whitelist of commands.
    return true;
  }

  /**
   * Execute a git command safely.
   * @param {string} command - The git command (without leading 'git').
   * @param {string[]} args - Additional arguments (will be sanitized).
   * @returns {Promise<{stdout: string, stderr: string}>} The result of the command.
   */
  async _runGitCommand(command, args = []) {
    // Validate each argument
    args.forEach(arg => GitTool.validateInput(arg));

    const fullCommand = `git ${command} ${args.join(' ')}`.trim();
    try {
      return await execPromise(fullCommand, { cwd: process.cwd() });
    } catch (error) {
      // If exec fails, throw with the error message
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  /**
   * Get the current git status.
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async status() {
    return this._runGitCommand('status');
  }

  /**
   * Add files to the staging area.
   * @param {string[]} files - Array of file paths to add.
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async add(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Files array must be non-empty');
    }
    // Validate each file
    files.forEach(file => GitTool.validateInput(file));
    return this._runGitCommand('add', files);
  }

  /**
   * Commit changes with a message.
   * @param {string} message - The commit message.
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async commit(message) {
    GitTool.validateInput(message);
    return this._runGitCommand('commit', ['-m', `"${message}"`]);
  }

  /**
   * Push changes to the remote repository.
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async push() {
    return this._runGitCommand('push');
  }

  /**
   * Checkout a branch.
   * @param {string} branch - The branch name.
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  async checkout(branch) {
    GitTool.validateInput(branch);
    return this._runGitCommand('checkout', [branch]);
  }

  /**
   * Generic execute method for AgentExecutor compatibility.
   * @param {Object} params - { action, ...actionParams }
   * @returns {Promise<any>} Result of the action
   */
  async execute(params) {
    const { action, ...actionParams } = params;
    
    switch (action) {
      case 'status':
        return this.status();
      case 'add':
        return this.add(actionParams.files || [actionParams.file]);
      case 'commit':
        return this.commit(actionParams.message);
      case 'push':
        return this.push();
      case 'checkout':
        return this.checkout(actionParams.branch);
      default:
        throw new Error(`Unknown GitTool action: ${action}`);
    }
  }
}

module.exports = new GitTool();
module.exports.GitTool = GitTool;
