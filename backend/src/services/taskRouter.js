class TaskRouter {
  /**
   * Classify a task message into 'strategic' or 'tactical'
   * @param {string} message - The user's task description
   * @returns {string} - 'strategic' | 'tactical'
   */
  static classify(message) {
    if (!message || typeof message !== 'string') {
      return 'tactical';
    }

    const lowerMsg = message.toLowerCase();

    // Strategic Keywords (High Risk / Planning / Architecture)
    const strategicKeywords = [
      'architecture',
      'plan',
      'design',
      'database',
      'schema',
      'migration',
      'security',
      'auth',
      'devops',
      'docker',
      'research',
      'review',
      'strategy',
      'roadmap',
      'high-level'
    ];

    // Check for strategic keywords
    if (strategicKeywords.some(keyword => lowerMsg.includes(keyword))) {
      return 'strategic';
    }

    // Default to Tactical (Implementation, Fixes, etc.)
    return 'tactical';
  }
}

module.exports = TaskRouter;

