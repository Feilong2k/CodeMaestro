/**
 * XmlOutputParser - Parses XML tool calls from LLM output and formats tool results as XML.
 */
class XmlOutputParser {
  /**
   * Extract tool calls from text containing XML tags.
   * @param {string} text - The text to parse
   * @returns {Array<Object>} Array of tool call objects with attributes and inner elements
   */
  extractToolCalls(text) {
    const toolCalls = [];
    const toolRegex = /<tool\s+([^>]+)>([\s\S]*?)<\/tool>/g;
    let match;
    
    while ((match = toolRegex.exec(text)) !== null) {
      const attrs = match[1];
      const content = match[2];
      const toolCall = {};

      // Parse attributes like name="FileSystemTool" action="write"
      const attrRegex = /(\w+)="([^"]+)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrs)) !== null) {
        toolCall[attrMatch[1]] = attrMatch[2];
      }

      // Handle CDATA sections first - extract and replace with content
      let processedContent = content;
      const cdataRegex = /<!\[CDATA\[(.*?)\]\]>/g;
      let cdataMatch;
      while ((cdataMatch = cdataRegex.exec(content)) !== null) {
        processedContent = processedContent.replace(cdataMatch[0], cdataMatch[1]);
      }

      // Parse inner elements like <path>test.js</path>
      const innerRegex = /<(\w+)>([^<]*)<\/\1>/g;
      let innerMatch;
      while ((innerMatch = innerRegex.exec(processedContent)) !== null) {
        toolCall[innerMatch[1]] = innerMatch[2];
      }

      toolCalls.push(toolCall);
    }
    
    return toolCalls;
  }

  /**
   * Format a tool result into XML.
   * @param {Object} result - The tool result object
   * @param {string} result.tool - Tool name
   * @param {string} result.action - Action performed
   * @param {boolean} result.success - Whether the operation succeeded
   * @param {string} [result.output] - Output message (if success is true)
   * @param {string} [result.error] - Error message (if success is false)
   * @returns {string} XML representation of the result
   */
  formatToolResult(result) {
    const { tool, action, success, output, error } = result;
    
    // Escape XML special characters
    const escapeXml = (str) => {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const escapedOutput = output ? escapeXml(output) : '';
    const escapedError = error ? escapeXml(error) : '';
    
    if (success) {
      return `<result tool="${tool}" action="${action}" success="true">\n  <output>${escapedOutput}</output>\n</result>`;
    } else {
      return `<result tool="${tool}" action="${action}" success="false">\n  <error>${escapedError}</error>\n</result>`;
    }
  }
}

module.exports = { XmlOutputParser };
