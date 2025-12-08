const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

/**
 * Advanced Shell Tool with command validation, chaining, and cwd persistence.
 */
class ShellTool {
  constructor() {
    // Current working directory, updated after each cd command
    this.cwd = process.cwd();

    // Blocklist: commands or patterns that are never allowed
    this.blocklist = [
      'sudo',
      'rm -rf',
      'rm -r',
      'del /s',
      'format',
      'mkfs',
      'dd',
      'shutdown',
      'reboot',
      'halt',
      'init',
      'kill',
      'pkill',
      'killall',
      '> /dev',
      '>> /dev',
      '`',
      '$(',
      '..',
    ];

    // Whitelist: allowed command prefixes (first word)
    this.whitelist = [
      'ls',
      'cd',
      'pwd',
      'npm',
      'node',
      'git',
      'echo',
      'cat',
      'grep',
      'mkdir',
      'touch',
      'cp',
      'mv',
      'chmod',
      'chown',
      'python',
      'pip',
      'yarn',
      'docker', // assuming safe usage
      'docker-compose',
      'curl',
      'wget',
      'tar',
      'zip',
      'unzip',
      'find',
      'which',
      'where',
      'type',
      'command',
      'env',
      'export',
      'source',
      '.',
    ];
  }

  /**
   * Validate a command against blocklist and whitelist.
   * @param {string} command - The command to validate.
   * @throws {Error} If the command is blocked or not allowed.
   */
  validateCommand(command) {
    if (typeof command !== 'string') {
      throw new Error('Command must be a string');
    }

    const trimmed = command.trim();
    if (trimmed.length === 0) {
      throw new Error('Empty command');
    }

    // Check blocklist (substring match, case-insensitive)
    const lowerCommand = trimmed.toLowerCase();
    for (const blocked of this.blocklist) {
      if (lowerCommand.includes(blocked.toLowerCase())) {
        throw new Error(`Command blocked: contains '${blocked}'`);
      }
    }

    // Extract the first word (command name)
    const firstWord = trimmed.split(' ')[0].toLowerCase();
    // Check whitelist
    let allowed = false;
    for (const allowedCmd of this.whitelist) {
      if (firstWord.startsWith(allowedCmd.toLowerCase())) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      throw new Error(`Command '${firstWord}' is not allowed`);
    }
  }

  /**
   * Split a chained command by '&&' and trim each part.
   * @param {string} command - The chained command.
   * @returns {string[]} Array of individual commands.
   */
  splitChain(command) {
    if (typeof command !== 'string') {
      throw new Error('Command must be a string');
    }
    return command.split('&&').map(part => part.trim()).filter(part => part.length > 0);
  }

  /**
   * Execute a single command with current cwd.
   * @param {string} command - The command to execute.
   * @returns {Promise<{stdout: string, stderr: string}>} Execution result.
   * @private
   */
  async _executeSingle(command) {
    // Check if it's a cd command
    if (command.toLowerCase().startsWith('cd ')) {
      const arg = command.substring(3).trim();
      let newPath;
      if (arg.startsWith('/')) {
        newPath = arg;
      } else {
        newPath = path.resolve(this.cwd, arg);
      }
      // Update cwd
      this.cwd = newPath;
      // cd doesn't produce output; simulate success
      return { stdout: '', stderr: '' };
    }

    // Regular command execution
    try {
      const result = await execPromise(command, { cwd: this.cwd });
      return result;
    } catch (error) {
      // execPromise rejects on non-zero exit code; we still return stdout/stderr
      return { stdout: error.stdout || '', stderr: error.stderr || error.message };
    }
  }

  /**
   * Execute a command (possibly chained) with validation.
   * @param {string} command - The command(s) to execute.
   * @returns {Promise<{stdout: string, stderr: string}>} The result of the last command.
   */
  async execute(command) {
    // Validate the whole command string (before splitting) to catch blocklisted patterns
    this.validateCommand(command);

    const parts = this.splitChain(command);
    let lastResult = { stdout: '', stderr: '' };

    for (const part of parts) {
      // Validate each part individually (in case splitting creates new issues)
      this.validateCommand(part);
      lastResult = await this._executeSingle(part);
    }

    return lastResult;
  }
}

module.exports = new ShellTool();
