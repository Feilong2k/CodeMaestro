const path = require('path');
const fs = require('fs');

// Tool definitions will be imported here
const FileSystemTool = require('./FileSystemTool');
const GitTool = require('./GitTool');
const DatabaseTool = require('./DatabaseTool');

/**
 * Role-based tool registry.
 * Maps agent roles to the tools they are allowed to use.
 */
const roleCapabilities = {
  Devon: {
    FileSystemTool,
    GitTool
  },
  Tara: {
    FileSystemTool,
    GitTool  // Tara might need Git for test setup? We'll include for now.
  },
  Orion: {
    FileSystemTool,
    GitTool,
    DatabaseTool
  }
};

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
  getToolsForRole
};
