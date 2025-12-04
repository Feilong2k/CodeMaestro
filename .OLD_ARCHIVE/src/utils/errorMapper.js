// Error mapping utility for frontend (subtask 2-1-5)
// Maps backend error codes to user-friendly UI messages

/**
 * Maps a backend error object to a user-friendly UI message.
 * @param {Object} backendError - The error object from the backend.
 * @param {string} backendError.error - Error code (e.g., 'VALIDATION_ERROR', 'RATE_LIMIT_ERROR')
 * @param {string} backendError.message - Original error message (for fallback)
 * @param {number} [backendError.retryAfter] - Retry after seconds (for 429)
 * @returns {string} User-friendly UI message.
 */
export function mapBackendErrorToUI(backendError) {
  const { error: errorCode, message, retryAfter } = backendError || {};

  // Default mapping based on error codes from Agents/logs/2-1-5.yml
  switch (errorCode) {
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'RATE_LIMIT_ERROR':
      if (retryAfter !== undefined && retryAfter !== null) {
        return `We’re receiving many requests. Please wait {{seconds}}s and try again.`.replace('{{seconds}}', retryAfter);
      }
      return 'We’re receiving many requests. Please wait and try again.';
    case 'CONTENT_FILTER_ERROR':
      return 'This content can’t be processed. Try rephrasing.';
    case 'SERVICE_UNAVAILABLE':
      return 'Service is temporarily unavailable. Please try again shortly.';
    case 'INTERNAL_ERROR':
      return 'Something went wrong. Please try again.';
    default:
      // If no mapping, return the original message or a generic one.
      return message || 'Something went wrong. Please try again.';
  }
}

/**
 * Formats a countdown in seconds to a human-readable string (e.g., "2m 5s", "45s").
 * @param {number} seconds - The number of seconds.
 * @returns {string} Formatted countdown string.
 */
export function formatRetryCountdown(seconds) {
  if (seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

/**
 * Extracts the numeric retryAfter value from a RATE_LIMIT_ERROR message.
 * This is a helper for when the error message already contains the retryAfter.
 * @param {string} message - The error message.
 * @returns {number|null} The retryAfter in seconds, or null if not found.
 */
export function extractRetryAfterFromMessage(message) {
  if (!message) return null;
  const match = message.match(/(\d+)\s*s/);
  return match ? parseInt(match[1], 10) : null;
}
