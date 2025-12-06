const TaskRouter = require('../../services/taskRouter'); // Does not exist yet

describe('TaskRouter', () => {
  test('should exist', () => {
    expect(TaskRouter).toBeDefined();
  });

  describe('classify', () => {
    test('should return "strategic" for planning/architecture keywords', () => {
      const tasks = [
        'Create architecture for new feature',
        'Plan phase 4 roadmap',
        'Design database schema',
        'High-level overview'
      ];
      
      tasks.forEach(task => {
        expect(TaskRouter.classify(task)).toBe('strategic');
      });
    });

    test('should return "tactical" for fix/implementation keywords', () => {
      const tasks = [
        'Fix bug in login',
        'Implement button component',
        'Update css styles',
        'Refactor utils function'
      ];
      
      tasks.forEach(task => {
        expect(TaskRouter.classify(task)).toBe('tactical');
      });
    });

    test('should default to "tactical" for ambiguous input', () => {
      expect(TaskRouter.classify('Some random task')).toBe('tactical');
    });

    test('should handle empty input', () => {
      expect(TaskRouter.classify('')).toBe('tactical');
      expect(TaskRouter.classify(null)).toBe('tactical');
    });
  });
});
