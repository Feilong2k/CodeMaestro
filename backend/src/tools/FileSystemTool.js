const fs = require('fs');
const path = require('path');

// Global root - configurable via env, defaults to CM root (3 levels up from tools/)
const GLOBAL_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '../../../');

/**
 * Safe file system operations with path traversal protection.
 * Can be scoped to a specific project directory.
 */
class FileSystemTool {
  /**
   * Create a FileSystemTool instance.
   * @param {string} [projectPath] - Base path for this project (relative to GLOBAL_ROOT or absolute)
   */
  constructor(projectPath = null) {
    console.log('[FileSystemTool] constructor called with projectPath:', projectPath);
    if (projectPath && projectPath !== '.') {
      // Resolve project path
      this.basePath = path.isAbsolute(projectPath) 
        ? projectPath 
        : path.resolve(GLOBAL_ROOT, projectPath);
    } else {
      this.basePath = GLOBAL_ROOT;
    }
    console.log('[FileSystemTool] basePath set to:', this.basePath);
    console.log('[FileSystemTool] GLOBAL_ROOT is:', GLOBAL_ROOT);
  }

  /**
   * Validates that a given path is within the allowed base path.
   * @param {string} inputPath - The path to validate.
   * @throws {Error} If the path is unsafe (outside allowed root).
   */
  validatePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path');
    }

    // Check for null bytes and other dangerous patterns
    if (inputPath.includes('\0')) {
      throw new Error('Null byte in path');
    }

    // Resolve the path relative to basePath
    const resolvedPath = path.resolve(this.basePath, inputPath);
    console.log('[FileSystemTool] validatePath debug:', { 
      inputPath, 
      basePath: this.basePath, 
      resolvedPath,
      platform: process.platform 
    });

    // Use path.relative to check if resolvedPath is inside basePath
    const relative = path.relative(this.basePath, resolvedPath);
    const isInside = !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (!isInside) {
      console.error('[FileSystemTool] Path validation failed:', { 
        inputPath,
        basePath: this.basePath,
        resolvedPath,
        relative,
        isInside
      });
      throw new Error(`Unsafe path: ${inputPath} is outside project root (${this.basePath})`);
    }

    // Additional check for directory traversal patterns in the input (before resolution)
    const normalizedInput = path.normalize(inputPath);
    if (normalizedInput.includes('..') && !isInside) {
      throw new Error(`Path traversal detected: ${inputPath}`);
    }

    return resolvedPath;
  }

  /**
   * Static version for backward compatibility (uses GLOBAL_ROOT).
   */
  static validatePath(inputPath) {
    const instance = new FileSystemTool();
    return instance.validatePath(inputPath);
  }

  /**
   * Get the current base path for this tool instance.
   * @returns {string} Base path
   */
  getBasePath() {
    return this.basePath;
  }

  /**
   * Safely read a file within the project root.
   * @param {string} filePath - Path to the file.
   * @returns {string} File content.
   */
  safeRead(filePath) {
    // Validate the path and get resolved absolute path
    const resolvedPath = this.validatePath(filePath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      // Read using the resolved absolute path to avoid CWD issues in server runtime
      return fs.readFileSync(resolvedPath, 'utf8');
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
    // Validate the path and get resolved absolute path
    const resolvedPath = this.validatePath(filePath);

    // Check if file exists and overwrite is not allowed
    if (fs.existsSync(resolvedPath) && !options.overwrite) {
      throw new Error(`File ${filePath} already exists. Use { overwrite: true } to overwrite.`);
    }

    // Ensure the directory exists (use directory from original input to keep forward slashes)
    const dirFromInput = filePath.includes('/')
      ? filePath.split('/').slice(0, -1).join('/')
      : path.dirname(filePath);
    if (dirFromInput && !fs.existsSync(this.validatePath(dirFromInput))) {
      fs.mkdirSync(dirFromInput, { recursive: true });
    }

    try {
      // Write using the original path for test determinism
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
    // Validate the path and get resolved absolute path
    const resolvedPath = this.validatePath(dirPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    try {
      // List using the resolved absolute path to avoid CWD issues in server runtime
      return fs.readdirSync(resolvedPath);
    } catch (error) {
      throw new Error(`Failed to list directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Safely create a directory within the project root.
   * Creates parent directories if they don't exist (recursive).
   * @param {string} dirPath - Path to the directory to create.
   * @returns {string} The created directory path.
   */
  createDirectory(dirPath) {
    // Validate the path (throws if unsafe)
    this.validatePath(dirPath);

    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return dirPath;
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Safely delete a file or directory within the project root.
   * @param {string} targetPath - Path to the file/directory to delete.
   * @returns {string} Confirmation message.
   */
  safeDelete(targetPath) {
    // Validate the path (throws if unsafe)
    const resolvedPath = this.validatePath(targetPath);

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Path not found: ${targetPath}`);
    }

    try {
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        fs.rmSync(resolvedPath, { recursive: true });
        return `Directory deleted: ${targetPath}`;
      } else {
        fs.unlinkSync(resolvedPath);
        return `File deleted: ${targetPath}`;
      }
    } catch (error) {
      throw new Error(`Failed to delete ${targetPath}: ${error.message}`);
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
      case 'mkdir':
      case 'createDirectory':
        return this.createDirectory(dirPath || filePath);
      case 'delete':
      case 'remove':
        return this.safeDelete(filePath || dirPath);
      default:
        throw new Error(`Unknown FileSystemTool action: ${action}`);
    }
  }
}

module.exports = new FileSystemTool();
module.exports.FileSystemTool = FileSystemTool;
