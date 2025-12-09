/**
 * Function Definitions for LLM Function Calling
 * 
 * This file defines all available tools as OpenAI-compatible function definitions.
 * The LLM will use these to select and call the appropriate tool.
 * 
 * Format: https://platform.openai.com/docs/guides/function-calling
 */

const functionDefinitions = [
  // ==================== ProjectTool ====================
  {
    type: "function",
    function: {
      name: "ProjectTool_create",
      description: "Create a new project. Creates both the database entry and the folder.",
      parameters: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            description: "The project name (required)" 
          },
          description: { 
            type: "string", 
            description: "Project description (optional)" 
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ProjectTool_list",
      description: "List all active projects in the system.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ProjectTool_get",
      description: "Get details of a specific project by ID.",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "integer", 
            description: "The project ID to retrieve" 
          }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ProjectTool_update",
      description: "Update a project's details (name, description, git_url, or path). If path is updated, creates the folder. Use this to set or change a project's Git repository URL.",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "integer", 
            description: "The project ID to update" 
          },
          name: { 
            type: "string", 
            description: "New project name (optional)" 
          },
          description: { 
            type: "string", 
            description: "New project description (optional)" 
          },
          git_url: { 
            type: "string", 
            description: "Git repository URL (optional, e.g., 'https://github.com/user/repo.git')" 
          },
          path: { 
            type: "string", 
            description: "New project path (optional, e.g., 'Projects/MyProject')" 
          }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ProjectTool_delete",
      description: "Soft-delete a project (marks as deleted, doesn't remove files).",
      parameters: {
        type: "object",
        properties: {
          projectId: { 
            type: "integer", 
            description: "The project ID to delete" 
          }
        },
        required: ["projectId"]
      }
    }
  },

  // ==================== DatabaseTool ====================
  {
    type: "function",
    function: {
      name: "DatabaseTool_getAgentPermissions",
      description: "Get the permissions for a specific agent (read/write access to paths).",
      parameters: {
        type: "object",
        properties: {
          agentName: { 
            type: "string", 
            description: "Agent name (e.g., 'Tara', 'Devon', 'Orion')" 
          }
        },
        required: ["agentName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "DatabaseTool_getAgentRegistry",
      description: "Get all agents and their assigned tools.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "DatabaseTool_listTables",
      description: "List all tables in the database.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "DatabaseTool_query",
      description: "Run a custom SQL query (SELECT only, no destructive operations).",
      parameters: {
        type: "object",
        properties: {
          sql: { 
            type: "string", 
            description: "The SQL query to execute" 
          },
          params: { 
            type: "array", 
            items: { type: "string" },
            description: "Query parameters (for parameterized queries)" 
          }
        },
        required: ["sql"]
      }
    }
  },

  // ==================== FileSystemTool ====================
  {
    type: "function",
    function: {
      name: "FileSystemTool_read",
      description: "Read the contents of a file.",
      parameters: {
        type: "object",
        properties: {
          path: { 
            type: "string", 
            description: "Path to the file to read" 
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "FileSystemTool_write",
      description: "Create or write a file. Creates parent directories automatically. Use this for 'create file' requests - no need to list or check first.",
      parameters: {
        type: "object",
        properties: {
          path: { 
            type: "string", 
            description: "Path to the file to create/write" 
          },
          content: { 
            type: "string", 
            description: "Content to write to the file" 
          }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "FileSystemTool_list",
      description: "List contents of a directory.",
      parameters: {
        type: "object",
        properties: {
          path: { 
            type: "string", 
            description: "Path to the directory to list" 
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "FileSystemTool_mkdir",
      description: "Create a directory (creates parent directories if needed).",
      parameters: {
        type: "object",
        properties: {
          path: { 
            type: "string", 
            description: "Path to the directory to create" 
          }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "FileSystemTool_delete",
      description: "Delete a file or directory (recursive for directories).",
      parameters: {
        type: "object",
        properties: {
          path: { 
            type: "string", 
            description: "Path to the file or directory to delete" 
          }
        },
        required: ["path"]
      }
    }
  },

  // ==================== GitTool ====================
  {
    type: "function",
    function: {
      name: "GitTool_status",
      description: "Get the current git status (modified files, branch, etc.).",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "GitTool_commit",
      description: "Commit staged changes with a message.",
      parameters: {
        type: "object",
        properties: {
          message: { 
            type: "string", 
            description: "Commit message" 
          }
        },
        required: ["message"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "GitTool_branch",
      description: "List branches or create a new branch.",
      parameters: {
        type: "object",
        properties: {
          name: { 
            type: "string", 
            description: "Branch name to create (omit to list branches)" 
          }
        },
        required: []
      }
    }
  },

  // ==================== ShellTool ====================
  {
    type: "function",
    function: {
      name: "ShellTool_execute",
      description: "Execute a shell command (restricted to safe commands only).",
      parameters: {
        type: "object",
        properties: {
          command: { 
            type: "string", 
            description: "The command to execute" 
          },
          cwd: { 
            type: "string", 
            description: "Working directory (optional)" 
          }
        },
        required: ["command"]
      }
    }
  },

  // ==================== MemoryTool ====================
  {
    type: "function",
    function: {
      name: "MemoryTool_search",
      description: "Search past conversations and project memories. Use this when user asks about past discussions, decisions, or context from earlier in the project.",
      parameters: {
        type: "object",
        properties: {
          query: { 
            type: "string", 
            description: "Keywords to search for in past conversations" 
          },
          limit: {
            type: "number",
            description: "Max results to return (default: 5)"
          }
        },
        required: ["query"]
      }
    }
  }
];

/**
 * Parse a function call response into tool/action/params
 * @param {Object} toolCall - The tool_call object from LLM response
 * @returns {Object} { tool, action, params }
 */
function parseFunctionCall(toolCall) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments || '{}');
  
  // Split ToolName_action into tool and action
  const [tool, action] = functionName.split('_');
  
  return {
    tool,
    action,
    params: args
  };
}

module.exports = functionDefinitions;
module.exports.parseFunctionCall = parseFunctionCall;

