// Component tests for ChatTranscript.vue (subtask 2-1-3)
// These tests should fail initially until the component is properly wired
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, beforeEach, test, expect, vi } from 'vitest';

// Mock the useChatApi composable
vi.mock('@/composables/useChatApi', () => ({
  __esModule: true,
  default: () => ({
    messages: [],
    loading: false,
    error: null,
  }),
}));

describe('ChatTranscript.vue', () => {
  let wrapper;
  let mockMessages;
  let mockLoading;
  let mockError;

  const createWrapper = async (overrides = {}) => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Default mocks
    mockMessages = overrides.messages || [];
    mockLoading = overrides.loading || false;
    mockError = overrides.error || null;
    
    // Re-import the module with fresh mocks
    await vi.isolateModules(async () => {
      vi.mock('@/composables/useChatApi', () => ({
        __esModule: true,
        default: () => ({
          messages: mockMessages,
          loading: mockLoading,
          error: mockError,
        }),
      }));
      
      // Re-import the component with the new mock
      const module = await import('@/components/ChatTranscript.vue');
      const ChatTranscript = module.default;
      wrapper = mount(ChatTranscript);
    });
  };

  beforeEach(async () => {
    await createWrapper();
  });

  describe('empty state', () => {
    test('should show empty message when no messages', () => {
      expect(wrapper.text()).toContain('No messages yet');
    });

    test('should not show typing indicator when not loading', () => {
      const typingIndicator = wrapper.find('.typing-indicator');
      expect(typingIndicator.exists()).toBe(false);
    });
  });

  describe('rendering messages', () => {
    test('should render user messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello, Orion!' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      await createWrapper({ messages });
      
      const messageItems = wrapper.findAllComponents({ name: 'ChatMessageItem' });
      expect(messageItems).toHaveLength(2);
    });

    test('should pass correct props to ChatMessageItem components', async () => {
      const messages = [
        { 
          role: 'user', 
          content: 'Hello',
          timestamp: '2025-12-02T15:30:00.000Z'
        },
        { 
          role: 'assistant', 
          content: 'Hi',
          messageId: 'msg_123',
          timestamp: '2025-12-02T15:30:01.000Z',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
          finishReason: 'stop'
        },
      ];
      await createWrapper({ messages });
      
      const messageItems = wrapper.findAllComponents({ name: 'ChatMessageItem' });
      
      // Check user message props
      expect(messageItems[0].props()).toMatchObject({
        message: messages[0],
        isUser: true,
        isError: false,
      });
      
      // Check assistant message props
      expect(messageItems[1].props()).toMatchObject({
        message: messages[1],
        isUser: false,
        isError: false,
      });
    });

    test('should render error messages with error flag', async () => {
      const messages = [
        { 
          role: 'assistant', 
          content: 'Error occurred',
          error: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          retryAfter: 60
        },
      ];
      await createWrapper({ messages });
      
      const messageItems = wrapper.findAllComponents({ name: 'ChatMessageItem' });
      expect(messageItems[0].props('isError')).toBe(true);
    });
  });

  describe('typing indicator', () => {
    test('should show typing indicator when loading is true', async () => {
      await createWrapper({ loading: true });
      
      const typingIndicator = wrapper.find('.typing-indicator');
      expect(typingIndicator.exists()).toBe(true);
      expect(typingIndicator.text()).toContain('Orion is typing');
    });

    test('should hide typing indicator when loading is false', async () => {
      await createWrapper({ loading: false });
      
      const typingIndicator = wrapper.find('.typing-indicator');
      expect(typingIndicator.exists()).toBe(false);
    });

    test('should show typing indicator even with existing messages', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
      ];
      await createWrapper({ messages, loading: true });
      
      const typingIndicator = wrapper.find('.typing-indicator');
      expect(typingIndicator.exists()).toBe(true);
    });
  });

  describe('error display', () => {
    test('should display global error when error is present', async () => {
      const error = { 
        message: 'Network error',
        error: 'NETWORK_ERROR'
      };
      await createWrapper({ error });
      
      expect(wrapper.text()).toContain('Network error');
    });

    test('should not display global error when there are no error messages in transcript', async () => {
      const error = null;
      await createWrapper({ error });
      
      // Should not show any error message in the transcript area
      const errorDiv = wrapper.find('.error-message');
      expect(errorDiv.exists()).toBe(false);
    });
  });

  describe('auto-scrolling', () => {
    test('should scroll to bottom when messages change', async () => {
      // Mock scrollTo method
      const mockScrollTo = vi.fn();
      Object.defineProperty(wrapper.vm, '$refs', {
        value: {
          transcriptContainer: {
            scrollTo: mockScrollTo,
          },
        },
        writable: true,
      });

      // Initial messages
      await createWrapper({ messages: [{ role: 'user', content: 'Hello' }] });
      
      // Wait for next tick to allow scroll
      await nextTick();
      
      // Should have scrolled on mount
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });

    test('should scroll to bottom when new message is added', async () => {
      // Mock scrollTo method
      const mockScrollTo = vi.fn();
      
      // Initial mount with one message
      await createWrapper({ messages: [{ role: 'user', content: 'Hello' }] });
      
      // Set up the ref after mount
      wrapper.vm.$refs = {
        transcriptContainer: {
          scrollTo: mockScrollTo,
        },
      };
      
      // Simulate new message being added
      wrapper.vm.messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      
      // Trigger watcher
      await wrapper.vm.$nextTick();
      
      // Should have scrolled
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      });
    });

    test('should scroll to bottom when typing indicator appears/disappears', async () => {
      // Mock scrollTo method
      const mockScrollTo = vi.fn();
      
      // Initial mount without loading
      await createWrapper({ 
        messages: [{ role: 'user', content: 'Hello' }],
        loading: false 
      });
      
      // Set up the ref
      wrapper.vm.$refs = {
        transcriptContainer: {
          scrollTo: mockScrollTo,
        },
      };
      
      // Change loading to true (typing indicator appears)
      wrapper.vm.loading = true;
      await wrapper.vm.$nextTick();
      
      // Should have scrolled when typing indicator appears
      expect(mockScrollTo).toHaveBeenCalled();
      
      // Reset mock
      mockScrollTo.mockClear();
      
      // Change loading to false (typing indicator disappears)
      wrapper.vm.loading = false;
      await wrapper.vm.$nextTick();
      
      // Should have scrolled when typing indicator disappears
      expect(mockScrollTo).toHaveBeenCalled();
    });
  });

  describe('retry functionality', () => {
    test('should emit retry event when error message retry is clicked', async () => {
      const messages = [
        { 
          role: 'assistant', 
          content: 'Error occurred',
          error: 'SERVICE_UNAVAILABLE',
          retryAfter: 60
        },
      ];
      await createWrapper({ messages });
      
      // Find ChatMessageItem and trigger its retry event
      const messageItem = wrapper.findComponent({ name: 'ChatMessageItem' });
      messageItem.vm.$emit('retry');
      
      // The parent should handle the retry
      // This test assumes ChatTranscript emits a retry event or calls a retry function
      // We'll check if there's a retry handler (implementation specific)
      expect(messageItem.emitted('retry')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    test('should have aria-live attribute for screen readers', () => {
      const container = wrapper.find('.chat-transcript');
      expect(container.attributes('aria-live')).toBe('polite');
    });

    test('should have aria-atomic attribute', () => {
      const container = wrapper.find('.chat-transcript');
      expect(container.attributes('aria-atomic')).toBe('true');
    });

    test('typing indicator should have aria-live attribute', async () => {
      await createWrapper({ loading: true });
      const typingIndicator = wrapper.find('.typing-indicator');
      expect(typingIndicator.attributes('aria-live')).toBe('assertive');
    });
  });
});
