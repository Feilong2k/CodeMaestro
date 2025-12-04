// Error mapping unit tests for task 2-1-5
// Tests for the implemented error mapping utility
import { describe, test, expect } from 'vitest';

// Import the error mapping utility
import { mapBackendErrorToUI, formatRetryCountdown } from '@/utils/errorMapper';

describe('Error Mapping Utility (2-1-5)', () => {
  describe('mapBackendErrorToUI', () => {
    test('should map VALIDATION_ERROR to friendly UI message', () => {
      // Arrange
      const backendError = {
        error: 'VALIDATION_ERROR',
        message: 'Message must not exceed 2000 characters',
      };
      const expectedUIMessage = 'Please check your input and try again.';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should map RATE_LIMIT_ERROR with retryAfter to UI message with placeholder', () => {
      // Arrange
      const backendError = {
        error: 'RATE_LIMIT_ERROR',
        message: 'Rate limit exceeded',
        retryAfter: 60,
      };
      const expectedUIMessage = 'We’re receiving many requests. Please wait 60s and try again.';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should map CONTENT_FILTER_ERROR to appropriate UI message', () => {
      // Arrange
      const backendError = {
        error: 'CONTENT_FILTER_ERROR',
        message: 'Content violates policy',
      };
      const expectedUIMessage = 'This content can’t be processed. Try rephrasing.';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should map SERVICE_UNAVAILABLE to appropriate UI message', () => {
      // Arrange
      const backendError = {
        error: 'SERVICE_UNAVAILABLE',
        message: 'Service is temporarily unavailable',
      };
      const expectedUIMessage = 'Service is temporarily unavailable. Please try again shortly.';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should map INTERNAL_ERROR to appropriate UI message', () => {
      // Arrange
      const backendError = {
        error: 'INTERNAL_ERROR',
        message: 'Internal server error',
      };
      const expectedUIMessage = 'Something went wrong. Please try again.';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should handle unknown error codes gracefully', () => {
      // Arrange
      const backendError = {
        error: 'UNKNOWN_ERROR',
        message: 'Some unknown error',
      };
      const expectedUIMessage = 'Some unknown error';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });

    test('should preserve original message if no mapping exists but default is used', () => {
      // Arrange
      const backendError = {
        error: 'CUSTOM_ERROR',
        message: 'Custom error details',
      };
      const expectedUIMessage = 'Custom error details';

      // Act
      const result = mapBackendErrorToUI(backendError);

      // Assert
      expect(result).toBe(expectedUIMessage);
    });
  });

  describe('formatRetryCountdown', () => {
    test('should format seconds into minutes and seconds when >= 60', () => {
      // Arrange
      const seconds = 125;
      const expected = '2m 5s';

      // Act
      const result = formatRetryCountdown(seconds);

      // Assert
      expect(result).toBe(expected);
    });

    test('should format seconds as just seconds when < 60', () => {
      // Arrange
      const seconds = 45;
      const expected = '45s';

      // Act
      const result = formatRetryCountdown(seconds);

      // Assert
      expect(result).toBe(expected);
    });

    test('should handle zero seconds', () => {
      // Arrange
      const seconds = 0;
      const expected = '';

      // Act
      const result = formatRetryCountdown(seconds);

      // Assert
      expect(result).toBe(expected);
    });

    test('should handle negative seconds by returning empty string', () => {
      // Arrange
      const seconds = -10;
      const expected = '';

      // Act
      const result = formatRetryCountdown(seconds);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
