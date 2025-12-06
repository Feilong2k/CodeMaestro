const AiService = require('../../services/aiService'); // Does not exist yet
const StrategicAdapter = require('../../llm/StrategicAdapter'); // Does not exist yet
const TacticalAdapter = require('../../llm/TacticalAdapter'); // Does not exist yet

// Mock adapters
jest.mock('../../llm/StrategicAdapter');
jest.mock('../../llm/TacticalAdapter');

describe('AiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should exist', () => {
    expect(AiService).toBeDefined();
  });

  describe('generate', () => {
    test('should use StrategicAdapter when mode is strategic', async () => {
      StrategicAdapter.prototype.generate.mockResolvedValue('Strategic response');
      
      const response = await AiService.generate('test prompt', 'strategic');
      
      expect(StrategicAdapter.prototype.generate).toHaveBeenCalledWith('test prompt');
      expect(response).toBe('Strategic response');
      expect(TacticalAdapter.prototype.generate).not.toHaveBeenCalled();
    });

    test('should use TacticalAdapter when mode is tactical', async () => {
      TacticalAdapter.prototype.generate.mockResolvedValue('Tactical response');
      
      const response = await AiService.generate('test prompt', 'tactical');
      
      expect(TacticalAdapter.prototype.generate).toHaveBeenCalledWith('test prompt');
      expect(response).toBe('Tactical response');
      expect(StrategicAdapter.prototype.generate).not.toHaveBeenCalled();
    });

    test('should default to tactical if mode is not specified', async () => {
      TacticalAdapter.prototype.generate.mockResolvedValue('Default response');
      
      const response = await AiService.generate('test prompt');
      
      expect(TacticalAdapter.prototype.generate).toHaveBeenCalledWith('test prompt');
      expect(response).toBe('Default response');
    });

    test('should throw error for invalid mode', async () => {
      await expect(AiService.generate('test prompt', 'invalid_mode'))
        .rejects
        .toThrow('Invalid AI mode: invalid_mode');
    });
  });
});
