/**
 * Parser for extracting structured actions from LLM output
 */
class ResponseParser {
  constructor() {
    this.patterns = {
      createFile: /create\s+(?:file|module|class)\s+['"]?([\w\/\.\-]+\.(?:js|vue|ts|yml|yaml|json|md))['"]?(?:\s+with\s+(.+))?/gi,
      updateStatus: /update\s+(?:the\s+)?status\s+(?:to\s+)?['"]?(\w+)['"]?/gi,
      askQuestion: /question(?::|\s+)?\s*(.+)/gi
    };
  }

  /**
   * Parse LLM output to extract actions
   * @param {string} llmOutput - Raw LLM output text
   * @returns {Array<Object>} Array of action objects
   */
  parse(llmOutput) {
    const actions = [];
    
    // Normalize input
    const normalized = llmOutput.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract file creation actions
    const fileMatches = this.extractFileCreations(normalized);
    actions.push(...fileMatches);
    
    // Extract status update actions
    const statusMatches = this.extractStatusUpdates(normalized);
    actions.push(...statusMatches);
    
    // Extract question actions
    const questionMatches = this.extractQuestions(normalized);
    actions.push(...questionMatches);
    
    // If no specific actions detected but there's content, create a generic action
    if (actions.length === 0 && normalized.length > 0) {
      actions.push({
        type: 'generic',
        payload: {
          text: normalized
        }
      });
    }
    
    return actions;
  }

  /**
   * Extract file creation actions
   * @param {string} text - Normalized text
   * @returns {Array<Object>} File creation actions
   */
  extractFileCreations(text) {
    const actions = [];
    const pattern = /(?:create|write|implement)\s+(?:the\s+)?(?:file|module|class)\s+['"]?([\w\/\.\-]+\.(?:js|vue|ts|yml|yaml|json|md|css|html))['"]?(?:\s+(?:with|containing|including)\s+(.+))?/gi;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const filePath = match[1];
      const contentHint = match[2] || '';
      
      actions.push({
        type: 'create_file',
        payload: {
          path: filePath,
          content: contentHint || `// Auto-generated file: ${filePath}`,
          description: `Create ${filePath}`
        }
      });
    }
    
    return actions;
  }

  /**
   * Extract status update actions
   * @param {string} text - Normalized text
   * @returns {Array<Object>} Status update actions
   */
  extractStatusUpdates(text) {
    const actions = [];
    const pattern = /(?:update|change|set)\s+(?:the\s+)?(?:status|state)\s+(?:to\s+)?['"]?(\w+)['"]?/gi;
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const status = match[1].toLowerCase();
      
      // Validate status against known states
      const validStatuses = ['pending', 'in_progress', 'red', 'green', 'refactor', 
                            'integration_red', 'integration_green', 'verification', 
                            'completed', 'blocked', 'failed'];
      
      if (validStatuses.includes(status)) {
        actions.push({
          type: 'update_status',
          payload: {
            status,
            description: `Update status to ${status}`
          }
        });
      }
    }
    
    return actions;
  }

  /**
   * Extract question actions
   * @param {string} text - Normalized text
   * @returns {Array<Object>} Question actions
   */
  extractQuestions(text) {
    const actions = [];
    
    // Look for question patterns
    const patterns = [
      /question(?::|\s+)?\s*(.+?)(?=\s*(?:action|next|step|$))/gi,
      /what\s+(?:should|is|are|does|do)\s+.+\?/gi,
      /how\s+(?:should|do|does|can)\s+.+\?/gi,
      /should\s+.+\?/gi,
      /can\s+.+\?/gi
    ];
    
    const allQuestions = new Set();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const question = match[1] || match[0];
        if (question.trim().length > 0) {
          allQuestions.add(question.trim().replace(/\?$/, '') + '?');
        }
      }
    });
    
    for (const question of allQuestions) {
      actions.push({
        type: 'ask_question',
        payload: {
          question,
          description: `Question: ${question}`
        }
      });
    }
    
    return actions;
  }

  /**
   * Extract code blocks from LLM output
   * @param {string} llmOutput - Raw LLM output
   * @returns {Array<Object>} Code blocks with language and content
   */
  extractCodeBlocks(llmOutput) {
    const codeBlocks = [];
    const pattern = /```(\w*)\n([\s\S]*?)```/g;
    
    let match;
    while ((match = pattern.exec(llmOutput)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }
    
    return codeBlocks;
  }

  /**
   * Combine code blocks with file creation actions
   * @param {string} llmOutput - Raw LLM output
   * @returns {Array<Object>} Enhanced actions with code content
   */
  parseWithCode(llmOutput) {
    const actions = this.parse(llmOutput);
    const codeBlocks = this.extractCodeBlocks(llmOutput);
    
    // Try to match code blocks with file creation actions
    actions.forEach(action => {
      if (action.type === 'create_file' && codeBlocks.length > 0) {
        // If there's a code block, use its content
        action.payload.content = codeBlocks[0].content;
      }
    });
    
    return actions;
  }
}

module.exports = new ResponseParser();
module.exports.ResponseParser = ResponseParser;
