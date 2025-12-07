import { describe, test, expect } from 'vitest';
import { generateMermaid } from '../../utils/mermaidGenerator.js';

describe('Mermaid Generator', () => {
  describe('generateMermaid(json)', () => {
    test('should return a valid mermaid string', () => {
      const workflowJson = {
        states: {
          initial: { on: { START: 'running' } },
          running: { on: { COMPLETE: 'done' } },
          done: { type: 'final' }
        },
        initial: 'initial'
      };

      const result = generateMermaid(workflowJson);

      // We expect the result to be a string that starts with the mermaid graph declaration
      expect(typeof result).toBe('string');
      expect(result).toContain('graph');
      // Should contain state nodes
      expect(result).toContain('initial');
      expect(result).toContain('running');
      expect(result).toContain('done');
    });

    test('should handle initial state correctly ( [*] --> Initial )', () => {
      const workflowJson = {
        states: {
          Initial: { on: { NEXT: 'NextState' } },
          NextState: { type: 'final' }
        },
        initial: 'Initial'
      };

      const result = generateMermaid(workflowJson);

      // Check that the initial state is correctly represented as [*] --> Initial
      expect(result).toContain('[*] --> Initial');
    });

    test('should map on transitions ( StateA --> StateB : Event )', () => {
      const workflowJson = {
        states: {
          StateA: { on: { EVENT1: 'StateB', EVENT2: 'StateC' } },
          StateB: { on: { EVENT3: 'StateD' } },
          StateC: { type: 'final' },
          StateD: { type: 'final' }
        },
        initial: 'StateA'
      };

      const result = generateMermaid(workflowJson);

      // Check that transitions are correctly represented
      expect(result).toContain('StateA --> StateB : EVENT1');
      expect(result).toContain('StateA --> StateC : EVENT2');
      expect(result).toContain('StateB --> StateD : EVENT3');
    });

    test('should handle final states', () => {
      const workflowJson = {
        states: {
          Start: { on: { FINISH: 'End' } },
          End: { type: 'final' }
        },
        initial: 'Start'
      };

      const result = generateMermaid(workflowJson);

      // Final state should be represented appropriately (usually with double circle or [*])
      // In mermaid, final states are often represented as a circle with a double border.
      // We'll check that the final state is present and marked appropriately.
      expect(result).toContain('End');
      // The exact representation depends on the implementation, but we can check for a marker.
      // For now, we just ensure the state is present.
    });

    test('should handle empty or invalid JSON gracefully', () => {
      // Test with empty object
      const emptyResult = generateMermaid({});
      expect(typeof emptyResult).toBe('string');

      // Test with missing states
      const missingStates = { initial: 'Start' };
      const result2 = generateMermaid(missingStates);
      expect(typeof result2).toBe('string');
    });
  });
});
