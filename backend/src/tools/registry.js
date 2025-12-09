const path = require('path');
const fs = require('fs');

// Tool definitions will be imported here
const FileSystemTool = require('./FileSystemTool');
const GitTool = require('./GitTool');
const { DatabaseTool } = require('./DatabaseTool'); // Import the class, not instance
const ShellTool = require('./ShellTool');
const ProjectTool = require('./ProjectTool');

/**
 * Role-based tool registry.
 * Maps agent roles to the tools they are allowed to use.
 */
const roleCapabilities = {
  Devon: {
    FileSystemTool,
    GitTool,
    ShellTool,
    ProjectTool
  },
  Tara: {
    FileSystemTool,
    GitTool,
    ShellTool  // Tara needs shell for running tests
  },
  Orion: {
    FileSystemTool,
    GitTool,
    DatabaseTool,
    ShellTool,
    ProjectTool
  }
};

/**
 * Get list of all available tools with descriptions
 */
function getToolDescriptions() {
  return {
    FileSystemTool: 'Read/write files with path traversal protection',
    GitTool: 'Git operations (commit, branch, push, pull) with safety checks',
    ShellTool: 'Execute shell commands with whitelist/blocklist safety',
    ProjectTool: 'CRUD operations for project management',
    DatabaseTool: 'Direct database queries (Orion-only)'
  };
}

/**
 * Get the tools allowed for a given role.
 * @param {string} role - The agent role (Devon, Tara, Orion)
 * @returns {Object} An object mapping tool names to tool classes/instances
 */
function getToolsForRole(role) {
  // Normalize role name (capitalize first letter)
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  
  if (!roleCapabilities[normalizedRole]) {
    // Return empty object for unknown roles (as per test expectation)
    return {};
  }
  
  return roleCapabilities[normalizedRole];
}

module.exports = {
  getToolsForRole,
  getToolDescriptions
};
