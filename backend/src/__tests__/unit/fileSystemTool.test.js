const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let FileSystemTool;
try {
  FileSystemTool = require('../../../src/tools/FileSystemTool');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  FileSystemTool = {};
}

// Mock the fs module for file operations
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn()
}));

const fs = require('fs');

// Helper to ensure we have a method to test, otherwise skip the test.
function requireFileSystemTool() {
  if (Object.keys(FileSystemTool).length === 0) {
    throw new Error('FileSystemTool module not found. Tests are expected to fail.');
  }
  return FileSystemTool;
}

describe('FileSystem Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('safeRead(path)', () => {
    test('should prevent path traversal outside project root', () => {
      const tool = requireFileSystemTool();

      const unsafePaths = [
        '../etc/passwd',
        '../../../../windows/system32',
        '..\\..\\..\\windows\\system32',
        '/etc/passwd',
        '//server/share'
      ];

      unsafePaths.forEach(path => {
        expect(() => tool.safeRead(path)).toThrow(/unsafe path|outside project root/i);
      });
    });

    test('should allow reading within allowed directories', () => {
      const tool = requireFileSystemTool();

      // Mock fs.existsSync to return true (path exists)
      fs.existsSync.mockReturnValue(true);
      // Mock fs.readFileSync to return some content
      const mockContent = 'file content';
      fs.readFileSync.mockReturnValue(mockContent);

      const safePath = 'src/tools/FileSystemTool.js';

      const content = tool.safeRead(safePath);

      // Should not throw
      expect(content).toBe(mockContent);
      expect(fs.readFileSync).toHaveBeenCalledWith(safePath, 'utf8');
    });

    test('should handle non-existent file gracefully', () => {
      const tool = requireFileSystemTool();

      fs.existsSync.mockReturnValue(false);

      const safePath = 'nonexistent/file.txt';

      expect(() => tool.safeRead(safePath)).toThrow(/file not found/i);
    });
  });

  describe('safeWrite(path, content)', () => {
    test('should prevent path traversal outside project root', () => {
      const tool = requireFileSystemTool();

      const unsafePaths = [
        '../etc/passwd',
        '../../../../windows/system32',
        '..\\..\\..\\windows\\system32',
        '/etc/passwd'
      ];

      unsafePaths.forEach(path => {
        expect(() => tool.safeWrite(path, 'content')).toThrow(/unsafe path|outside project root/i);
      });
    });

    test('should allow writing within allowed directories', () => {
      const tool = requireFileSystemTool();

      // Mock fs.existsSync for parent directory
      fs.existsSync.mockReturnValue(true);

      const safePath = 'src/tools/test-output.txt';
      const content = 'test content';

      tool.safeWrite(safePath, content);

      // Should not throw
      expect(fs.writeFileSync).toHaveBeenCalledWith(safePath, content, 'utf8');
    });

    test('should create directory if it does not exist', () => {
      const tool = requireFileSystemTool();

      // Mock fs.existsSync to return false (directory doesn't exist)
      fs.existsSync.mockReturnValue(false);

      const safePath = 'src/tools/newdir/test.txt';
      const content = 'content';

      tool.safeWrite(safePath, content);

      // Should have attempted to create directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('src/tools/newdir'), { recursive: true });
    });
  });

  describe('safeList(path)', () => {
    test('should prevent path traversal outside project root', () => {
      const tool = requireFileSystemTool();

      const unsafePaths = [
        '../etc',
        '../../../../windows',
        '..\\..\\..\\windows'
      ];

      unsafePaths.forEach(path => {
        expect(() => tool.safeList(path)).toThrow(/unsafe path|outside project root/i);
      });
    });

    test('should list directory contents within allowed directories', () => {
      const tool = requireFileSystemTool();

      // Mock fs.existsSync to return true (directory exists)
      fs.existsSync.mockReturnValue(true);
      const mockFiles = ['file1.txt', 'file2.js', 'subdir'];
      fs.readdirSync.mockReturnValue(mockFiles);

      const safePath = 'src/tools';

      const files = tool.safeList(safePath);

      expect(files).toEqual(mockFiles);
      expect(fs.readdirSync).toHaveBeenCalledWith(safePath);
    });

    test('should handle non-existent directory', () => {
      const tool = requireFileSystemTool();

      fs.existsSync.mockReturnValue(false);

      const safePath = 'nonexistent/dir';

      expect(() => tool.safeList(safePath)).toThrow(/directory not found/i);
    });
  });
});
