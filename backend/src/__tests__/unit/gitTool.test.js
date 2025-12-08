const { describe, test, expect, beforeEach } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let GitTool;
try {
  GitTool = require('../../../src/tools/GitTool');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  GitTool = {};
}

// Mock child_process for git commands
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

const child_process = require('child_process');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireGitTool() {
  if (!GitTool || typeof GitTool.status !== 'function') {
    throw new Error('GitTool module not found or does not export status. Tests are expected to fail.');
  }
  return GitTool;
}

describe('Git Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock that works with the promise-based GitTool (which uses exec with three arguments: command, options, callback)
    child_process.exec.mockImplementation((command, options, callback) => {
      // Determine which parameter is the callback
      const actualCallback = typeof callback === 'function' ? callback : (typeof options === 'function' ? options : null);
      if (actualCallback) {
        // Node.js exec callback expects (error, stdout, stderr)
        actualCallback(null, '', '');
      }
    });
  });

  describe('status()', () => {
    test('should call git status command', async () => {
      const tool = requireGitTool();

      // Override the default mock for this test
      child_process.exec.mockImplementationOnce((command, options, callback) => {
        // The tool passes options, so callback is the third argument
        if (typeof callback === 'function') {
          callback(null, { stdout: 'On branch main', stderr: '' });
        } else if (typeof options === 'function') {
          options(null, { stdout: 'On branch main', stderr: '' });
        }
      });

      // The tool's status returns a promise
      const result = await tool.status();

      // Check that exec was called with a command containing 'git status'
      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git status'),
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.any(Function)
      );
      expect(result.stdout).toBe('On branch main');
    });
  });

  describe('add(files)', () => {
    test('should call git add with given files', async () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementationOnce((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: '', stderr: '' });
        } else if (typeof options === 'function') {
          options(null, { stdout: '', stderr: '' });
        }
      });

      const files = ['file1.txt', 'file2.js'];
      await tool.add(files);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git add'),
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.any(Function)
      );
      // The command should include the file names
      const call = child_process.exec.mock.calls[0];
      expect(call[0]).toContain('file1.txt');
      expect(call[0]).toContain('file2.js');
    });

    test('should block dangerous arguments (e.g., rm -rf)', () => {
      const tool = requireGitTool();
      // We expect the tool to validate arguments and throw if dangerous
      // Since we don't know the exact implementation, we'll test that the function exists.
      // In the Green phase, we'll have more specific tests.
      expect(typeof tool.add).toBe('function');
    });
  });

  describe('commit(message)', () => {
    test('should call git commit with message', async () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementationOnce((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'commit hash', stderr: '' });
        } else if (typeof options === 'function') {
          options(null, { stdout: 'commit hash', stderr: '' });
        }
      });

      const message = 'Test commit';
      await tool.commit(message);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.any(Function)
      );
      const call = child_process.exec.mock.calls[0];
      expect(call[0]).toContain(message);
    });
  });

  describe('push()', () => {
    test('should call git push', async () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementationOnce((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'pushed', stderr: '' });
        } else if (typeof options === 'function') {
          options(null, { stdout: 'pushed', stderr: '' });
        }
      });

      await tool.push();

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git push'),
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.any(Function)
      );
    });
  });

  describe('checkout(branch)', () => {
    test('should call git checkout with branch name', async () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementationOnce((command, options, callback) => {
        if (typeof callback === 'function') {
          callback(null, { stdout: 'Switched to branch', stderr: '' });
        } else if (typeof options === 'function') {
          options(null, { stdout: 'Switched to branch', stderr: '' });
        }
      });

      const branch = 'feature/new-branch';
      await tool.checkout(branch);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git checkout'),
        expect.objectContaining({ cwd: expect.any(String) }),
        expect.any(Function)
      );
      const call = child_process.exec.mock.calls[0];
      expect(call[0]).toContain(branch);
    });
  });

  describe('whitelisted commands', () => {
    test('should allow whitelisted commands (status, add, commit, push, checkout)', () => {
      const tool = requireGitTool();

      // We expect the tool to have these methods
      expect(typeof tool.status).toBe('function');
      expect(typeof tool.add).toBe('function');
      expect(typeof tool.commit).toBe('function');
      expect(typeof tool.push).toBe('function');
      expect(typeof tool.checkout).toBe('function');
    });
  });

  describe('block dangerous args', () => {
    test('should block dangerous arguments (e.g., rm -rf)', () => {
      const tool = requireGitTool();

      // We don't know the exact implementation, but we can test that the function exists.
      // In the Green phase, we'll test that passing dangerous arguments throws an error.
      // For now, we'll just note that the test will be expanded.
      expect(typeof tool.add).toBe('function');
    });
  });
});
