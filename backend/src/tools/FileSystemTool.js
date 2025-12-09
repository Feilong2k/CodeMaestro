const fs = require('fs');
const path = require('path');

/**
 * Safe file system operations with path traversal protection.
 */
class FileSystemTool {
  /**
   * Validates that a given path is within the project root.
   * @param {string} inputPath - The path to validate.
   * @throws {Error} If the path is unsafe (outside project root).
   */
  static validatePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path');
    }

    // Resolve the path relative to current working directory (project root)
    const resolvedPath = path.resolve(process.cwd(), inputPath);
    const projectRoot = process.cwd();

    // Check if the resolved path is within the project root
    if (!resolvedPath.startsWith(projectRoot)) {
      throw new Error(`Unsafe path: ${inputPath} is outside project root`);
    }

    // Additional check for directory traversal patterns
    const normalized = path.normalize(inputPath);
    if (normalized.includes('..') && !resolvedPath.startsWith(projectRoot)) {
      throw new Error(`Path traversal detected: ${inputPath}`);
    }

    // Check for absolute paths that bypass the project root
    if (path.isAbsolute(inputPath) && !resolvedPath.startsWith(projectRoot)) {
      throw new Error(`Absolute path ${inputPath} is not allowed`);
    }

    return resolvedPath;
  }

  /**
   * Safely read a file within the project root.
   * @param {string} filePath - Path to the file.
   * @returns {string} File content.
   */
  safeRead(filePath) {
    // Validate the path (throws if unsafe)
    FileSystemTool.validatePath(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Safely write content to a file within the project root.
   * Creates directories if needed.
   * @param {string} filePath - Path to the file.
   * @param {string} content - Content to write.
   * @param {Object} [options] - Options for writing.
   * @param {boolean} [options.overwrite=false] - If true, overwrite existing file.
   */
  safeWrite(filePath, content, options = {}) {
    // Validate the path (throws if unsafe)
    FileSystemTool.validatePath(filePath);

    // Check if file exists and overwrite is not allowed
    if (fs.existsSync(filePath) && !options.overwrite) {
      throw new Error(`File ${filePath} already exists. Use { overwrite: true } to overwrite.`);
    }

    // Ensure the directory exists (use the original path for directory creation)
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Safely list contents of a directory within the project root.
   * @param {string} dirPath - Path to the directory.
   * @returns {string[]} Array of filenames.
   */
  safeList(dirPath) {
    // Validate the path (throws if unsafe)
    FileSystemTool.validatePath(dirPath);

    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    try {
      return fs.readdirSync(dirPath);
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Generic execute method for AgentExecutor compatibility.
   * @param {Object} params - { action, path, content }
   * @returns {Promise<any>} Result of the action
   */
  async execute(params) {
    const { action, path: filePath, content, dirPath } = params;
    
    switch (action) {
      case 'read':
        return this.safeRead(filePath);
      case 'write':
        return this.safeWrite(filePath, content);
      case 'list':
        return this.safeList(dirPath || filePath);
      default:
        throw new Error(`Unknown FileSystemTool action: ${action}`);
    }
  }
}

module.exports = new FileSystemTool();
module.exports.FileSystemTool = FileSystemTool;
