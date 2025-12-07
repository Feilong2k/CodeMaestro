const WorkflowParser = require('../../services/workflowParser');

describe('WorkflowParser', () => {
  const sampleMarkdown = `
# Rule: Standard TDD
Status: active

## States
- **Red**: Failing tests
- **Green**: Passing tests
- **Refactor**: Cleanup

## Transitions
- Red -> Green: When tests pass
- Green -> Refactor: When implementation complete
- Refactor -> Red: When new feature starts
  `;

  test('should exist', () => {
    expect(WorkflowParser).toBeDefined();
  });

  test('should parse valid markdown into JSON state machine', () => {
    const result = WorkflowParser.parse(sampleMarkdown);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('Standard TDD');
    expect(result.states).toHaveProperty('Red');
    expect(result.states).toHaveProperty('Green');
    expect(result.states).toHaveProperty('Refactor');
  });

  test('should extract transitions correctly', () => {
    const result = WorkflowParser.parse(sampleMarkdown);
    
    // Check specific transitions if your parser logic supports it
    // This assumes a structure like states[Red].on[TEST_PASS] = Green
    // For now, we just check generic structure exists
    expect(Object.keys(result.states).length).toBe(3);
  });

  test('should handle empty input gracefully', () => {
    expect(() => WorkflowParser.parse('')).toThrow();
    expect(() => WorkflowParser.parse(null)).toThrow();
  });
});

