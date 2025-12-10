// ObservationStage Unit Tests (Red Phase)
// These tests are expected to fail until subtask 6-101 is implemented.

const { DeepseekClient } = require('../../src/llm/DeepseekClient');

// Mock the LLM client
jest.mock('../../src/llm/DeepseekClient', () => ({
    DeepseekClient: {
        generate: jest.fn(),
    }
}));

describe('ObservationStage', () => {
    let ObservationStage;

    beforeAll(() => {
        try {
            ObservationStage = require('../../src/services/ObservationStage');
        } catch (error) {
            ObservationStage = null;
        }
    });

    it('should exist as a class or function', () => {
        expect(ObservationStage).toBeDefined();
        expect(typeof ObservationStage).toBe('function');
    });

    describe('constructor', () => {
        it('should accept configuration options', () => {
            if (!ObservationStage) {
                return;
            }
            const config = { llmClient: 'deepseek', classificationThreshold: 0.8 };
            const instance = new ObservationStage(config);
            expect(instance).toBeInstanceOf(ObservationStage);
        });
    });

    describe('Classification logic', () => {
        it('should have a method to classify user input', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            expect(typeof stage.classify).toBe('function');
        });

        it('should classify bug reports', async () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            const userInput = 'The app crashes when I click the button.';
            const mockClassification = {
                category: 'bug',
                confidence: 0.9,
                tags: ['crash', 'ui']
            };

            // Mock LLM client response
            DeepseekClient.generate.mockResolvedValue(JSON.stringify(mockClassification));

            const result = await stage.classify(userInput);
            expect(DeepseekClient.generate).toHaveBeenCalledWith(
                expect.stringContaining(userInput),
                expect.any(Object)
            );
            expect(result.category).toBe('bug');
            expect(result.tags).toContain('crash');
        });

        it('should classify feature requests', async () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            const userInput = 'Can you add dark mode?';
            const mockClassification = {
                category: 'feature',
                confidence: 0.85,
                tags: ['ui', 'theme']
            };

            DeepseekClient.generate.mockResolvedValue(JSON.stringify(mockClassification));

            const result = await stage.classify(userInput);
            expect(result.category).toBe('feature');
        });

        it('should handle classification errors', async () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            DeepseekClient.generate.mockRejectedValue(new Error('LLM error'));

            await expect(stage.classify('test')).rejects.toThrow('LLM error');
        });
    });

    describe('Observation tags', () => {
        it('should have a method to generate observation tags', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            expect(typeof stage.generateTags).toBe('function');
        });

        it('should generate tags based on classification', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            const classification = {
                category: 'bug',
                confidence: 0.9,
                tags: ['crash', 'ui']
            };
            const tags = stage.generateTags(classification);
            expect(Array.isArray(tags)).toBe(true);
            expect(tags).toContain('bug');
            expect(tags).toContain('crash');
        });

        it('should include confidence in tag formatting', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            const classification = {
                category: 'feature',
                confidence: 0.85,
                tags: ['ui']
            };
            const tags = stage.generateTags(classification);
            const confidenceTag = tags.find(tag => tag.includes('confidence'));
            expect(confidenceTag).toBeDefined();
        });
    });

    describe('UI-displayed observation formatting', () => {
        it('should have a method to format observation for UI', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            expect(typeof stage.formatForUI).toBe('function');
        });

        it('should format observation with timestamp and tags', () => {
            if (!ObservationStage) {
                return;
            }
            const stage = new ObservationStage();
            const observation = {
                id: 'obs_123',
                userInput: 'App crashes',
                classification: {
                    category: 'bug',
                    confidence: 0.9,
                    tags: ['crash']
                },
                timestamp: new Date('2025-12-10T10:00:00Z')
            };

            const uiFormat = stage.formatForUI(observation);
            expect(uiFormat.id).toBe('obs_123');
            expect(uiFormat.title).toContain('Bug');
            expect(uiFormat.tags).toContain('crash');
            expect(uiFormat.timestamp).toBe('2025-12-10T10:00:00Z');
            expect(uiFormat.displayText).toBeDefined();
        });
    });
});
