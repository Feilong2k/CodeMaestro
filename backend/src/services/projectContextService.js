/**
 * ProjectContextService - Builds context about a project for AI agents.
 * Provides tech stack detection, file structure, and key file summaries.
 */
const fs = require('fs');
const path = require('path');
const { query, getProject } = require('../db/connection');
const memoryExtractionService = require('./memoryExtractionService');

// Project root for resolving paths
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '../../../');

class ProjectContextService {
  /**
   * Build full context for a project.
   * @param {number} projectId - Project ID
   * @returns {Object} Project context
   */
  async buildContext(projectId) {
    if (!projectId) return null;

    try {
      // Get project from database
      const project = await getProject(projectId);
      if (!project) return null;

      const projectPath = this.resolveProjectPath(project.path);
      
      // Build context object
      const context = {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          path: project.path,
          gitUrl: project.git_url
        },
        techStack: await this.detectTechStack(projectPath),
        structure: await this.getStructure(projectPath),
        keyFiles: await this.getKeyFiles(projectPath),
        recentActivity: await this.getRecentActivity(projectId),
        extractedMemories: await memoryExtractionService.getExtractedMemories(projectId)
      };

      return context;
    } catch (error) {
      console.error('[ProjectContext] Error building context:', error.message);
      return null;
    }
  }

  /**
   * Resolve project path relative to PROJECT_ROOT.
   */
  resolveProjectPath(projectPath) {
    if (!projectPath || projectPath === '.') {
      return PROJECT_ROOT;
    }
    if (path.isAbsolute(projectPath)) {
      return projectPath;
    }
    return path.resolve(PROJECT_ROOT, projectPath);
  }

  /**
   * Detect tech stack from project files.
   * @param {string} projectPath - Absolute path to project
   * @returns {Object} Tech stack info
   */
  async detectTechStack(projectPath) {
    const stack = {
      languages: [],
      frameworks: [],
      tools: [],
      packageManager: null
    };

    try {
      // Check package.json for Node.js projects
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        stack.languages.push('JavaScript/TypeScript');
        
        // Detect frameworks from dependencies
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (deps.vue) stack.frameworks.push('Vue.js');
        if (deps.react) stack.frameworks.push('React');
        if (deps.express) stack.frameworks.push('Express');
        if (deps.next) stack.frameworks.push('Next.js');
        if (deps.nuxt) stack.frameworks.push('Nuxt');
        if (deps.vite) stack.tools.push('Vite');
        if (deps.webpack) stack.tools.push('Webpack');
        if (deps.jest) stack.tools.push('Jest');
        if (deps.vitest) stack.tools.push('Vitest');
        if (deps.prisma) stack.tools.push('Prisma');
        if (deps.pg) stack.tools.push('PostgreSQL');
        if (deps.openai) stack.tools.push('OpenAI');
        
        // Package manager detection
        if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
          stack.packageManager = 'pnpm';
        } else if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
          stack.packageManager = 'yarn';
        } else if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) {
          stack.packageManager = 'npm';
        }
      }

      // Check for Python
      if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
          fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
        stack.languages.push('Python');
      }

      // Check for Go
      if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
        stack.languages.push('Go');
      }

      // Check for Rust
      if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
        stack.languages.push('Rust');
      }

    } catch (error) {
      console.warn('[ProjectContext] Tech stack detection error:', error.message);
    }

    return stack;
  }

  /**
   * Get project folder structure (top-level and key directories).
   * @param {string} projectPath - Absolute path to project
   * @returns {Array} Folder structure
   */
  async getStructure(projectPath) {
    const structure = [];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.venv'];

    try {
      if (!fs.existsSync(projectPath)) {
        return structure;
      }

      const items = fs.readdirSync(projectPath, { withFileTypes: true });
      
      for (const item of items) {
        if (ignoreDirs.includes(item.name) || item.name.startsWith('.')) {
          continue;
        }

        const entry = {
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file'
        };

        // For key directories, list their contents
        if (item.isDirectory() && ['src', 'backend', 'frontend', 'lib', 'app'].includes(item.name)) {
          const subPath = path.join(projectPath, item.name);
          const subItems = fs.readdirSync(subPath, { withFileTypes: true });
          entry.children = subItems
            .filter(s => !ignoreDirs.includes(s.name) && !s.name.startsWith('.'))
            .slice(0, 15) // Limit to 15 items
            .map(s => ({ name: s.name, type: s.isDirectory() ? 'directory' : 'file' }));
        }

        structure.push(entry);
      }
    } catch (error) {
      console.warn('[ProjectContext] Structure scan error:', error.message);
    }

    return structure;
  }

  /**
   * Get key configuration files content.
   * @param {string} projectPath - Absolute path to project
   * @returns {Object} Key files content
   */
  async getKeyFiles(projectPath) {
    const keyFiles = {};
    const filesToRead = [
      'package.json',
      'README.md',
      '.env.example',
      'tsconfig.json',
      'vite.config.js',
      'vite.config.ts'
    ];

    for (const fileName of filesToRead) {
      const filePath = path.join(projectPath, fileName);
      try {
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, 'utf8');
          // Truncate large files
          if (content.length > 2000) {
            content = content.substring(0, 2000) + '\n... (truncated)';
          }
          keyFiles[fileName] = content;
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return keyFiles;
  }

  /**
   * Get recent activity from chat history and activity logs.
   * @param {number} projectId - Project ID
   * @returns {Object} Recent activity
   */
  async getRecentActivity(projectId) {
    const activity = {
      recentChats: [],
      recentTasks: []
    };

    try {
      // Get recent chat topics
      const chatResult = await query(`
        SELECT content, created_at 
        FROM chat_messages 
        WHERE project_id = $1 AND role = 'user'
        ORDER BY created_at DESC 
        LIMIT 5
      `, [projectId]);
      activity.recentChats = chatResult.rows.map(r => ({
        message: r.content.substring(0, 100),
        at: r.created_at
      }));

      // Get recent tasks if available
      const taskResult = await query(`
        SELECT type, status, created_at 
        FROM tasks 
        WHERE project_id = $1
        ORDER BY created_at DESC 
        LIMIT 5
      `, [projectId]);
      activity.recentTasks = taskResult.rows;
    } catch (error) {
      // Tables might not exist yet, that's ok
    }

    return activity;
  }

  /**
   * Format context for LLM injection.
   * @param {Object} context - Full context object
   * @returns {string} Formatted string for LLM prompt
   */
  formatForLLM(context) {
    if (!context) return '';

    let formatted = `\n=== CURRENT PROJECT CONTEXT ===\n`;
    formatted += `Project: ${context.project.name}\n`;
    
    if (context.project.description) {
      formatted += `Description: ${context.project.description}\n`;
    }
    
    // Make path context clear
    const projectPath = context.project.path;
    if (projectPath === '.' || projectPath === '' || !projectPath) {
      formatted += `Working Directory: You are INSIDE the ${context.project.name} project root.\n`;
      formatted += `  - Use path "." or relative paths like "backend/src" to access files.\n`;
      formatted += `  - Do NOT look for a "${context.project.name}" subfolder - you're already in it.\n`;
    } else {
      formatted += `Working Directory: ${projectPath} (relative to workspace root)\n`;
      formatted += `  - All file operations are scoped to this directory.\n`;
    }

    // Tech stack
    if (context.techStack) {
      const { languages, frameworks, tools, packageManager } = context.techStack;
      if (languages.length) formatted += `Languages: ${languages.join(', ')}\n`;
      if (frameworks.length) formatted += `Frameworks: ${frameworks.join(', ')}\n`;
      if (tools.length) formatted += `Tools: ${tools.join(', ')}\n`;
      if (packageManager) formatted += `Package Manager: ${packageManager}\n`;
    }

    // Structure summary
    if (context.structure?.length) {
      formatted += `\nProject Structure:\n`;
      context.structure
        .filter(s => s.type === 'directory')
        .forEach(s => {
          formatted += `  📁 ${s.name}/`;
          if (s.children?.length) {
            formatted += ` (${s.children.length} items)`;
          }
          formatted += `\n`;
        });
    }

    // Recent activity
    if (context.recentActivity?.recentChats?.length) {
      formatted += `\nRecent discussions:\n`;
      context.recentActivity.recentChats.forEach(c => {
        formatted += `- "${c.message}..."\n`;
      });
    }

    // Extracted memories (key facts from past conversations)
    if (context.extractedMemories?.length) {
      formatted += `\n## Remembered Facts (from past conversations):\n`;
      context.extractedMemories.forEach(m => {
        formatted += `- **${m.key}**: ${m.value}\n`;
      });
    }

    formatted += `=== END PROJECT CONTEXT ===\n`;
    return formatted;
  }
}

module.exports = new ProjectContextService();

