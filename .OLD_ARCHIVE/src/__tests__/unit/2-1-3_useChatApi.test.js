// Unit tests for useChatApi composable (subtask 2-1-3)
import { describe, beforeEach, test, expect, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

describe('useChatApi composable', () => {
  let useChatApi;
  let messages;
  let loading;
  let error;
  let sendMessage;
  let retry;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset module cache to ensure fresh import
    vi.resetModules();
    
    // Import the composable
    const module = await import('@/composables/useChatApi');
    useChatApi = module.default || module.useChatApi;
  });

  describe('initial state', () => {
    test('should initialize with one welcome message', () => {
      const { messages } = useChatApi();
      expect(messages.value).toHaveLength(1);
      expect(messages.value[0]).toMatchObject({
        role: 'assistant',
        messageId: 'welcome',
      });
    });

    test('should initialize with loading false', () => {
      const { loading } = useChatApi();
      expect(loading.value).toBe(false);
    });

    test('should initialize with error null', () => {
      const { error } = useChatApi();
      expect(error.value).toBe(null);
    });
  });

  describe('sendMessage function', () => {
    test('should send message to /api/orion/chat endpoint', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          response: 'Test response from Orion',
          messageId: 'msg_123',
          timestamp: '2025-12-02T15:30:00.000Z',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          finishReason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage } = useChatApi();
      const message = 'Hello, Orion!';
      const history = [
        { role: 'user', content: 'Previous message' }
      ];

      // Act
      await sendMessage(message, history);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orion/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello, Orion!',
            history: [{ role: 'user', content: 'Previous message' }],
          }),
        })
      );
    });

    test('should include context if provided', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage } = useChatApi();
      const context = { projectId: 'project-123' };

      // Act
      await sendMessage('Hello', [], context);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orion/chat',
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Hello',
            history: [],
            context: { projectId: 'project-123' },
          }),
        })
      );
    });

    test('should truncate history to last 20 messages', async () => {
      // Arrange
      const longHistory = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage } = useChatApi();

      // Act
      await sendMessage('Hello', longHistory);

      // Assert
      const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(callBody.history).toHaveLength(20); // Should be truncated to last 20
      expect(callBody.history[0].content).toBe('Message 5'); // First should be message 5 (25-20=5)
    });

    test('should set loading state during request', async () => {
      // Arrange
      let resolveRequest;
      const promise = new Promise(resolve => {
        resolveRequest = () => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
      global.fetch.mockReturnValue(promise);
      
      const { sendMessage, loading } = useChatApi();

      // Act - start request
      const requestPromise = sendMessage('Hello', []);
      
      // Assert - loading should be true during request
      expect(loading.value).toBe(true);
      
      // Complete request
      resolveRequest();
      await requestPromise;
      
      // Loading should be false after request
      expect(loading.value).toBe(false);
    });

    test('should handle 429 RATE_LIMIT_ERROR with retryAfter', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({
          error: 'RATE_LIMIT_ERROR',
          message: 'Rate limit exceeded',
          retryAfter: 60,
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage, error } = useChatApi();

      // Act & Assert
      await expect(sendMessage('Hello', [])).rejects.toThrow('Rate limit exceeded');
      expect(error.value).toBeDefined();
      expect(error.value?.retryAfter).toBe(60);
      expect(error.value?.error).toBe('RATE_LIMIT_ERROR');
    });

    test('should handle 400 VALIDATION_ERROR', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: 'VALIDATION_ERROR',
          message: 'Message too long',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage, error } = useChatApi();

      // Act & Assert
      await expect(sendMessage('A'.repeat(2001), [])).rejects.toThrow('Message too long');
      expect(error.value?.error).toBe('VALIDATION_ERROR');
    });

    test('should handle 503 SERVICE_UNAVAILABLE', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({
          error: 'SERVICE_UNAVAILABLE',
          message: 'Upstream service unavailable',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage, error } = useChatApi();

      // Act & Assert
      await expect(sendMessage('Hello', [])).rejects.toThrow('Upstream service unavailable');
      expect(error.value?.error).toBe('SERVICE_UNAVAILABLE');
    });

    test('should handle network errors', async () => {
      // Arrange
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      const { sendMessage, error } = useChatApi();

      // Act & Assert
      await expect(sendMessage('Hello', [])).rejects.toThrow('Network error');
      expect(error.value).toBeDefined();
      expect(error.value?.error).toBe('NETWORK_ERROR');
    });

    test('should update messages array on successful response', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          response: 'Orion response',
          messageId: 'msg_123',
          timestamp: '2025-12-02T15:30:00.000Z',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          finishReason: 'stop',
        }),
      };
      global.fetch.mockResolvedValue(mockResponse);
      
      const { sendMessage, messages } = useChatApi();
      const initialLength = messages.value.length;

      // Act
      await sendMessage('Hello', []);

      // Assert
      expect(messages.value).toHaveLength(initialLength + 2); // User message + assistant response
      expect(messages.value[messages.value.length - 2]).toEqual({
        role: 'user',
        content: 'Hello',
        timestamp: expect.any(String),
      });
      expect(messages.value[messages.value.length - 1]).toEqual({
        role: 'assistant',
        content: 'Orion response',
        messageId: 'msg_123',
        timestamp: '2025-12-02T15:30:00.000Z',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      });
    });
  });

  describe('retry function', () => {
    test('should retry last failed request with same parameters', async () => {
      // Arrange - first request fails
      const mockErrorResponse = {
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({
          error: 'SERVICE_UNAVAILABLE',
          message: 'Service down',
        }),
      };
      
      const mockSuccessResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          response: 'Success after retry',
        }),
      };
      
      global.fetch
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockSuccessResponse);
      
      const { sendMessage, retry, error } = useChatApi();

      // Act - first request fails
      await expect(sendMessage('Hello', [])).rejects.toThrow('Service down');
      
      // Assert - error should be set
      expect(error.value?.error).toBe('SERVICE_UNAVAILABLE');
      
      // Act - retry
      await retry();
      
      // Assert - fetch should have been called twice with same parameters
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const firstCall = global.fetch.mock.calls[0];
      const secondCall = global.fetch.mock.calls[1];
      expect(firstCall).toEqual(secondCall);
    });

    test('should do nothing if no previous request failed', async () => {
      const { retry } = useChatApi();
      
      // Act & Assert - should not throw
      await expect(retry()).resolves.not.toThrow();
    });
  });
});
