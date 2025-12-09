const execa = require('execa');
const path = require('path');

// Project root - one level up from backend
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '../../../');

/**
 * Advanced Shell Tool using execa for reliable cross-platform execution.
 * Features: command validation, whitelisting, blocklisting, cwd management.
 */
class ShellTool {
  constructor() {
    // Current working directory - default to project root
    this.cwd = PROJECT_ROOT;
    console.log('[ShellTool] Initialized with cwd:', this.cwd);

    // Blocklist: commands or patterns that are never allowed
    this.blocklist = [
      'sudo',
      'rm -rf',
      'rm -r',
      'rmdir /s',
      'del /s',
      'del /q',
      'format',
      'mkfs',
      'dd if=',
      'shutdown',
      'reboot',
      'halt',
      'init 0',
      'init 6',
      'kill -9',
      'pkill',
      'killall',
      '> /dev',
      '>> /dev',
      ':(){',  // fork bomb
      '`',     // command substitution
      '$(',    // command substitution
      '| rm',
      '| del',
    ];

    // Whitelist: allowed command prefixes (first word)
    this.whitelist = [
      'ls', 'dir',
      'cd',
      'pwd',
      'npm', 'npx',
      'node',
      'git',
      'echo',
      'cat', 'type',  // type is Windows cat
      'grep', 'findstr',  // findstr is Windows grep
      'mkdir', 'md',
      'touch',
      'cp', 'copy',
      'mv', 'move',
      'chmod',
      'chown',
      'python', 'python3',
      'pip', 'pip3',
      'yarn', 'pnpm',
      'docker',
      'docker-compose',
      'curl',
      'wget',
      'tar',
      'zip', 'unzip',
      'find',
      'which', 'where',
      'env',
      'export', 'set',  // set is Windows export
      'head', 'tail',
      'wc',
      'sort',
      'tree',
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
        throw new Error(`Blocked command: contains '${blocked}'`);
      }
    }

    // Extract the first word (command name)
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    
    // Check whitelist
    let allowed = false;
    for (const allowedCmd of this.whitelist) {
      if (firstWord === allowedCmd.toLowerCase() || firstWord.endsWith('/' + allowedCmd.toLowerCase())) {
        allowed = true;
        break;
      }
    }
    
    if (!allowed) {
      throw new Error(`Command '${firstWord}' is not in the allowed list. Allowed: ${this.whitelist.join(', ')}`);
    }
  }

  /**
   * Execute a single command using execa.
   * @param {string} command - The command to execute.
   * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
   * @private
   */
  async _executeSingle(command) {
    // Handle cd command specially (changes cwd for subsequent commands)
    const cdMatch = command.match(/^cd\s+(.+)$/i);
    if (cdMatch) {
      const targetDir = cdMatch[1].trim().replace(/["']/g, '');
      let newPath;
      
      if (path.isAbsolute(targetDir)) {
        newPath = targetDir;
      } else {
        newPath = path.resolve(this.cwd, targetDir);
      }
      
      this.cwd = newPath;
      console.log('[ShellTool] Changed cwd to:', this.cwd);
      return { stdout: `Changed directory to ${newPath}`, stderr: '', exitCode: 0 };
    }

    // Execute with execa (shell: true for complex commands)
    try {
      console.log('[ShellTool] Executing:', command, 'in', this.cwd);
      
      const result = await execa.command(command, {
        cwd: this.cwd,
        shell: true,
        timeout: 60000,  // 60 second timeout
        reject: false,   // Don't throw on non-zero exit
        env: {
          ...process.env,
          // Ensure git doesn't open editors
          GIT_EDITOR: 'true',
          EDITOR: 'true',
        }
      });

      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode
      };
    } catch (error) {
      console.error('[ShellTool] Execution error:', error.message);
      return {
        stdout: '',
        stderr: error.message || 'Unknown error',
        exitCode: error.exitCode || 1
      };
    }
  }

  /**
   * Execute a command (possibly chained with &&) with validation.
   * @param {string|Object} commandOrParams - Command string or { action, command, cwd }
   * @returns {Promise<{stdout: string, stderr: string, exitCode?: number}>}
   */
  async execute(commandOrParams) {
    console.log('[ShellTool] execute called with:', JSON.stringify(commandOrParams));
    
    // Handle both string and object formats
    let command;
    if (typeof commandOrParams === 'object' && commandOrParams !== null) {
      command = commandOrParams.command || commandOrParams.cmd || commandOrParams.args;
      console.log('[ShellTool] Extracted command:', command);
      
      // Set cwd if provided (convert relative to absolute)
      if (commandOrParams.cwd) {
        const requestedCwd = commandOrParams.cwd;
        if (path.isAbsolute(requestedCwd)) {
          this.cwd = requestedCwd;
        } else {
          this.cwd = path.resolve(PROJECT_ROOT, requestedCwd);
        }
        console.log('[ShellTool] Set cwd to:', this.cwd);
      }
    } else {
      command = commandOrParams;
    }

    // Validate command is a string
    if (typeof command !== 'string') {
      console.error('[ShellTool] Invalid command type:', typeof command);
      throw new Error(`Command must be a string. Received: ${JSON.stringify(commandOrParams)}`);
    }

    // Validate the command
    this.validateCommand(command);

    // Handle chained commands (split by &&)
    const parts = command.split('&&').map(p => p.trim()).filter(p => p.length > 0);
    let lastResult = { stdout: '', stderr: '', exitCode: 0 };
    let allStdout = [];
    let allStderr = [];

    for (const part of parts) {
      // Validate each part
      this.validateCommand(part);
      
      const result = await this._executeSingle(part);
      lastResult = result;
      
      if (result.stdout) allStdout.push(result.stdout);
      if (result.stderr) allStderr.push(result.stderr);
      
      // Stop chain if command failed (like bash &&)
      if (result.exitCode !== 0) {
        console.log('[ShellTool] Command failed, stopping chain. Exit code:', result.exitCode);
        break;
      }
    }

    return {
      stdout: allStdout.join('\n'),
      stderr: allStderr.join('\n'),
      exitCode: lastResult.exitCode
    };
  }

  /**
   * Get current working directory.
   * @returns {string}
   */
  getCwd() {
    return this.cwd;
  }

  /**
   * Reset cwd to project root.
   */
  resetCwd() {
    this.cwd = PROJECT_ROOT;
    console.log('[ShellTool] Reset cwd to:', this.cwd);
  }
}

module.exports = new ShellTool();
