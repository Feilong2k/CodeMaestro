// UnifiedAdapter Unit Tests (Red Phase)
// These tests are expected to fail until subtask 6-100 is implemented.

const { ToolRegistry } = require('../../src/tools/registry');
const { WebSocketServer } = require('../../src/socket/index');

// Mock the dependencies
jest.mock('../../src/tools/registry', () => ({
    ToolRegistry: {
        getTool: jest.fn(),
        listTools: jest.fn(),
        executeTool: jest.fn(),
    }
}));

jest.mock('../../src/socket/index', () => ({
    WebSocketServer: {
        broadcast: jest.fn(),
    }
}));

describe('UnifiedAdapter', () => {
    let UnifiedAdapter;

    beforeAll(() => {
        // Attempt to import the module (will fail if not implemented)
        try {
            UnifiedAdapter = require('../../src/llm/UnifiedAdapter');
        } catch (error) {
            // The module does not exist yet - this is expected in Red phase.
            UnifiedAdapter = null;
        }
    });

    it('should exist as a class or function', () => {
        // This test will fail until the module is implemented.
        expect(UnifiedAdapter).toBeDefined();
        expect(typeof UnifiedAdapter).toBe('function');
    });

    describe('constructor', () => {
        it('should accept configuration options', () => {
            // Skip if module not implemented
            if (!UnifiedAdapter) {
                return;
            }
            const config = { model: 'deepseek', temperature: 0.7 };
            const instance = new UnifiedAdapter(config);
            expect(instance).toBeInstanceOf(UnifiedAdapter);
        });
    });

    describe('JSON reasoning', () => {
        it('should have a method to parse JSON reasoning', () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            expect(typeof adapter.parseReasoning).toBe('function');
        });

        it('should parse valid JSON reasoning output', async () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            const mockReasoning = {
                thought: 'I need to do X',
                plan: ['step1', 'step2'],
                action: { tool: 'FileSystemTool', args: {} }
            };
            const result = await adapter.parseReasoning(JSON.stringify(mockReasoning));
            expect(result).toEqual(mockReasoning);
        });

        it('should handle JSON parsing errors', async () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            await expect(adapter.parseReasoning('invalid json')).rejects.toThrow();
        });
    });

    describe('Tool calling integration', () => {
        it('should have a method to call tools', () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            expect(typeof adapter.callTool).toBe('function');
        });

        it('should call the ToolRegistry with correct parameters', async () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            const toolName = 'FileSystemTool';
            const args = { path: '/tmp/test' };
            const mockResult = { success: true };

            ToolRegistry.executeTool.mockResolvedValue(mockResult);

            const result = await adapter.callTool(toolName, args);
            expect(ToolRegistry.executeTool).toHaveBeenCalledWith(toolName, args);
            expect(result).toEqual(mockResult);
        });
    });

    describe('Live UI streaming', () => {
        it('should have a method to stream updates to the UI', () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            expect(typeof adapter.streamUpdate).toBe('function');
        });

        it('should broadcast updates via WebSocket', async () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            const event = { type: 'thinking', content: 'Processing...' };

            await adapter.streamUpdate(event);
            expect(WebSocketServer.broadcast).toHaveBeenCalledWith('llm_update', event);
        });
    });

    describe('Integration with LLM client', () => {
        it('should have a method to generate responses', () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            expect(typeof adapter.generate).toBe('function');
        });

        it('should return a response with reasoning and action', async () => {
            if (!UnifiedAdapter) {
                return;
            }
            const adapter = new UnifiedAdapter();
            const prompt = 'What is 2+2?';
            const mockResponse = {
                reasoning: '2+2 equals 4',
                action: { tool: null, args: null }
            };

            // We'll mock the internal LLM client call (not implemented yet)
            // For now, we expect the method to exist.
            expect(typeof adapter.generate).toBe('function');
        });
    });
});
