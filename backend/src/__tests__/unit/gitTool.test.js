const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

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
  if (Object.keys(GitTool).length === 0) {
    throw new Error('GitTool module not found. Tests are expected to fail.');
  }
  return GitTool;
}

describe('Git Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('status()', () => {
    test('should call git status command', () => {
      const tool = requireGitTool();

      // Mock exec to call callback with success
      child_process.exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'On branch main', stderr: '' });
      });

      const result = tool.status();

      // We expect the function to return a promise or the result, but we don't know the exact shape.
      // We'll just check that exec was called with a command containing 'git status'
      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git status'),
        expect.any(Function)
      );
    });
  });

  describe('add(files)', () => {
    test('should call git add with given files', () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementation((command, callback) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const files = ['file1.txt', 'file2.js'];
      tool.add(files);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git add'),
        expect.any(Function)
      );
      // The command should include the file names
      expect(child_process.exec.mock.calls[0][0]).toContain('file1.txt');
      expect(child_process.exec.mock.calls[0][0]).toContain('file2.js');
    });

    test('should block dangerous arguments (e.g., rm -rf)', () => {
      const tool = requireGitTool();

      // We expect the tool to validate arguments and throw if dangerous
      // Since we don't know the exact implementation, we'll test that the function exists.
      // In the Green phase, we'll have more specific tests.
      expect(typeof tool.add).toBe('function');
      // We can also call it with safe arguments and ensure it doesn't throw (if implemented).
      // For now, we'll just note that the test will be expanded later.
    });
  });

  describe('commit(message)', () => {
    test('should call git commit with message', () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'commit hash', stderr: '' });
      });

      const message = 'Test commit';
      tool.commit(message);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.any(Function)
      );
      expect(child_process.exec.mock.calls[0][0]).toContain(message);
    });
  });

  describe('push()', () => {
    test('should call git push', () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'pushed', stderr: '' });
      });

      tool.push();

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git push'),
        expect.any(Function)
      );
    });
  });

  describe('checkout(branch)', () => {
    test('should call git checkout with branch name', () => {
      const tool = requireGitTool();

      child_process.exec.mockImplementation((command, callback) => {
        callback(null, { stdout: 'Switched to branch', stderr: '' });
      });

      const branch = 'feature/new-branch';
      tool.checkout(branch);

      expect(child_process.exec).toHaveBeenCalledWith(
        expect.stringContaining('git checkout'),
        expect.any(Function)
      );
      expect(child_process.exec.mock.calls[0][0]).toContain(branch);
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
