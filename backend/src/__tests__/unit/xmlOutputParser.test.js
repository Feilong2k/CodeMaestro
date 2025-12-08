const { describe, test, expect } = require('@jest/globals');

// The module we're testing doesn't exist yet, so we'll try to import it and handle the error.
let XmlOutputParser;
try {
  XmlOutputParser = require('../../../src/services/XmlOutputParser');
} catch (error) {
  // This is expected in the Red phase. We'll create a dummy object that throws for all methods.
  XmlOutputParser = {};
}

// Helper to ensure we have a method to test, otherwise skip the test.
function requireXmlOutputParser() {
  if (Object.keys(XmlOutputParser).length === 0) {
    throw new Error('XmlOutputParser module not found. Tests are expected to fail.');
  }
  // If class, instantiate
  if (XmlOutputParser.XmlOutputParser) {
    return new XmlOutputParser.XmlOutputParser();
  }
  return XmlOutputParser;
}

describe('XML Output Parser', () => {

  describe('extractToolCalls(text)', () => {
    test('should parse valid XML tool calls', () => {
      const parser = requireXmlOutputParser();

      const text = `
        Some prefix
        <tool name="FileSystemTool" action="write">
          <path>test.js</path>
          <content>// test</content>
        </tool>
        Some suffix
      `;

      const toolCalls = parser.extractToolCalls(text);

      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0]).toHaveProperty('name', 'FileSystemTool');
      expect(toolCalls[0]).toHaveProperty('action', 'write');
      expect(toolCalls[0]).toHaveProperty('path', 'test.js');
      expect(toolCalls[0]).toHaveProperty('content', '// test');
    });

    test('should handle multiple tool calls in one message', () => {
      const parser = requireXmlOutputParser();

      const text = `
        <tool name="GitTool" action="status"></tool>
        <tool name="FileSystemTool" action="read">
          <path>file.txt</path>
        </tool>
      `;

      const toolCalls = parser.extractToolCalls(text);

      expect(toolCalls).toHaveLength(2);
      expect(toolCalls[0].name).toBe('GitTool');
      expect(toolCalls[1].name).toBe('FileSystemTool');
    });

    test('should handle partial/malformed XML gracefully', () => {
      const parser = requireXmlOutputParser();

      const text = `
        <tool name="Broken" action="test">
          <param>missing closing tag
        </tool>
      `;

      // We expect the parser to either return an empty array or throw an error.
      // Let's assume it returns an empty array for malformed XML.
      const toolCalls = parser.extractToolCalls(text);
      // Either empty or we expect an error. We'll check that the function doesn't crash.
      expect(Array.isArray(toolCalls)).toBe(true);
    });

    test('should handle text without any XML tags', () => {
      const parser = requireXmlOutputParser();

      const text = 'Just plain text with no XML.';
      const toolCalls = parser.extractToolCalls(text);

      expect(toolCalls).toEqual([]);
    });

    test('should handle CDATA sections inside XML', () => {
      const parser = requireXmlOutputParser();

      const text = `
        <tool name="EvalTool" action="run">
          <code><![CDATA[console.log("Hello")]]></code>
        </tool>
      `;

      const toolCalls = parser.extractToolCalls(text);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].code).toBe('console.log("Hello")');
    });
  });

  describe('formatToolResult(result)', () => {
    test('should format a tool result into XML', () => {
      const parser = requireXmlOutputParser();

      const result = {
        tool: 'FileSystemTool',
        action: 'write',
        success: true,
        output: 'File written successfully',
      };

      const formatted = parser.formatToolResult(result);

      // Expect XML structure
      expect(formatted).toMatch(/^<result/);
      expect(formatted).toContain('FileSystemTool');
      expect(formatted).toContain('write');
      expect(formatted).toContain('File written successfully');
    });

    test('should handle error results', () => {
      const parser = requireXmlOutputParser();

      const result = {
        tool: 'GitTool',
        action: 'push',
        success: false,
        error: 'Permission denied',
      };

      const formatted = parser.formatToolResult(result);
      expect(formatted).toContain('error');
      expect(formatted).toContain('Permission denied');
    });
  });
});
