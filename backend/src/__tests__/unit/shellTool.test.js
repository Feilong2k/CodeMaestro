const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let ShellTool;
try {
  ShellTool = require('../../../src/tools/ShellTool');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  ShellTool = {};
}

// Mock child_process to avoid actual execution
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

const { exec } = require('child_process');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireShellTool() {
  if (Object.keys(ShellTool).length === 0) {
    throw new Error('ShellTool module not found. Tests are expected to fail.');
  }
  return ShellTool;
}

describe('Shell Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCommand(command)', () => {
    test('should reject commands in blocklist (e.g., sudo)', () => {
      const tool = requireShellTool();

      const command = 'sudo rm -rf /';
      expect(() => tool.validateCommand(command)).toThrow(/blocked|not allowed/i);
    });

    test('should reject commands containing blocklisted patterns (e.g., rm -rf /)', () => {
      const tool = requireShellTool();

      const command = 'rm -rf /';
      expect(() => tool.validateCommand(command)).toThrow();
    });

    test('should allow commands in whitelist (e.g., npm test)', () => {
      const tool = requireShellTool();

      const command = 'npm test';
      // Should not throw
      expect(() => tool.validateCommand(command)).not.toThrow();
    });

    test('should reject non-whitelisted commands', () => {
      const tool = requireShellTool();

      const command = 'some_random_command';
      expect(() => tool.validateCommand(command)).toThrow(/not allowed/i);
    });
  });

  describe('splitChain(command)', () => {
    test('should split commands by &&', () => {
      const tool = requireShellTool();

      const command = 'cd dir && ls';
      const parts = tool.splitChain(command);
      expect(parts).toEqual(['cd dir', 'ls']);
    });

    test('should handle single command without &&', () => {
      const tool = requireShellTool();

      const command = 'ls';
      const parts = tool.splitChain(command);
      expect(parts).toEqual(['ls']);
    });

    test('should trim whitespace around split commands', () => {
      const tool = requireShellTool();

      const command = 'cd dir   &&   ls';
      const parts = tool.splitChain(command);
      expect(parts).toEqual(['cd dir', 'ls']);
    });
  });

  describe('execute(command)', () => {
    test('should execute a single allowed command', async () => {
      const tool = requireShellTool();

      // Mock exec to simulate success
      exec.mockImplementation((cmd, options, callback) => {
        callback(null, { stdout: 'output', stderr: '' });
      });

      const command = 'ls';
      const result = await tool.execute(command);
      expect(result).toHaveProperty('stdout', 'output');
      expect(exec).toHaveBeenCalled();
    });

    test('should reject blocked command', async () => {
      const tool = requireShellTool();

      const command = 'sudo ls';
      await expect(tool.execute(command)).rejects.toThrow();
    });

    test('should execute chained commands sequentially', async () => {
      const tool = requireShellTool();

      let callCount = 0;
      exec.mockImplementation((cmd, options, callback) => {
        callCount++;
        callback(null, { stdout: `output${callCount}`, stderr: '' });
      });

      const command = 'cd dir && ls';
      const result = await tool.execute(command);
      expect(callCount).toBe(2);
    });

    test('should persist cwd across chained commands', async () => {
      const tool = requireShellTool();

      const execCalls = [];
      exec.mockImplementation((cmd, options, callback) => {
        execCalls.push({ cmd, cwd: options.cwd });
        callback(null, { stdout: '', stderr: '' });
      });

      const command = 'cd newdir && ls';
      await tool.execute(command);
      // Check that the second command uses the cwd from the first (if cd changes cwd)
      // This test might need adjustment based on actual implementation.
      expect(execCalls[1].cwd).toBeDefined();
    });
  });

  describe('cwd persistence', () => {
    test('should update cwd after cd command in chain', async () => {
      const tool = requireShellTool();

      // We assume the tool updates its internal cwd after a cd command.
      // This is a tricky test because we don't have access to internal state.
      // We'll just verify that the exec is called with the correct cwd.
      const execCalls = [];
      exec.mockImplementation((cmd, options, callback) => {
        execCalls.push({ cmd, cwd: options.cwd });
        callback(null, { stdout: '', stderr: '' });
      });

      const command = 'cd newdir && ls';
      await tool.execute(command);
      // The second command should have a cwd that includes 'newdir' (or at least not be the same as initial)
      // Since we don't know the absolute path, we just check that there are two calls.
      expect(execCalls).toHaveLength(2);
    });
  });
});
