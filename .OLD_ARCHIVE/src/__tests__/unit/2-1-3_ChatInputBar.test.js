// Component tests for ChatInputBar.vue (subtask 2-1-3)
// These tests should fail initially until the component is properly wired
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, beforeEach, test, expect, vi } from 'vitest';

// Mock the useChatApi composable
vi.mock('@/composables/useChatApi', () => ({
  __esModule: true,
  default: () => ({
    sendMessage: vi.fn(),
    loading: false,
    error: null,
  }),
}));

describe('ChatInputBar.vue', () => {
  let wrapper;
  let mockSendMessage;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock for sendMessage
    mockSendMessage = vi.fn();
    
    // Re-import the module with fresh mocks
    vi.isolateModules(async () => {
      vi.mock('@/composables/useChatApi', () => ({
        __esModule: true,
        default: () => ({
          sendMessage: mockSendMessage,
          loading: false,
          error: null,
        }),
      }));
      
      // Re-import the component with the new mock
      const module = await import('@/components/ChatInputBar.vue');
      const ChatInputBar = module.default;
      wrapper = mount(ChatInputBar);
    });
  });

  describe('initial state', () => {
    test('should render textarea input', () => {
      const textarea = wrapper.find('textarea');
      expect(textarea.exists()).toBe(true);
    });

    test('should render send button', () => {
      const button = wrapper.find('button');
      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('Send');
    });

    test('should have empty input initially', () => {
      const textarea = wrapper.find('textarea');
      expect(textarea.element.value).toBe('');
    });

    test('send button should be disabled when input is empty', () => {
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('input validation', () => {
    test('should enable send button when input has non-whitespace content', async () => {
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Hello');
      
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
    });

    test('should disable send button when input is only whitespace', async () => {
      const textarea = wrapper.find('textarea');
      await textarea.setValue('   \n\t  ');
      
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    test('should disable send button when input exceeds 2000 characters', async () => {
      const longMessage = 'A'.repeat(2001);
      const textarea = wrapper.find('textarea');
      await textarea.setValue(longMessage);
      
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });

    test('should enable send button when input is exactly 2000 characters', async () => {
      const exactMessage = 'A'.repeat(2000);
      const textarea = wrapper.find('textarea');
      await textarea.setValue(exactMessage);
      
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeUndefined();
    });
  });

  describe('sending messages', () => {
    test('should call sendMessage when send button is clicked', async () => {
      const message = 'Test message';
      const textarea = wrapper.find('textarea');
      await textarea.setValue(message);
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith(message, expect.any(Array));
    });

    test('should clear input after sending message', async () => {
      const message = 'Test message';
      const textarea = wrapper.find('textarea');
      await textarea.setValue(message);
      
      mockSendMessage.mockResolvedValueOnce({});
      const button = wrapper.find('button');
      await button.trigger('click');
      
      // Wait for Vue to update
      await nextTick();
      
      expect(textarea.element.value).toBe('');
    });

    test('should send message on Enter key (without Shift)', async () => {
      const message = 'Test message';
      const textarea = wrapper.find('textarea');
      await textarea.setValue(message);
      
      await textarea.trigger('keydown.enter');
      
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith(message, expect.any(Array));
    });

    test('should NOT send message on Shift+Enter', async () => {
      const message = 'Test message';
      const textarea = wrapper.find('textarea');
      await textarea.setValue(message);
      
      await textarea.trigger('keydown.enter', { shiftKey: true });
      
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('should NOT send message when input is empty or whitespace', async () => {
      const textarea = wrapper.find('textarea');
      await textarea.setValue('   ');
      
      const button = wrapper.find('button');
      await button.trigger('click');
      
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('should show loading state when sendMessage is in progress', async () => {
      // Re-mount with loading true
      await vi.isolateModules(async () => {
        vi.mock('@/composables/useChatApi', () => ({
          __esModule: true,
          default: () => ({
            sendMessage: mockSendMessage,
            loading: true,
            error: null,
          }),
        }));
        
        const module = await import('@/components/ChatInputBar.vue');
        const ChatInputBar = module.default;
        wrapper = mount(ChatInputBar);
      });
      
      const button = wrapper.find('button');
      expect(button.text()).toContain('Sending');
      expect(button.attributes('disabled')).toBeDefined();
    });

    test('should disable send button when loading', async () => {
      // Re-mount with loading true
      await vi.isolateModules(async () => {
        vi.mock('@/composables/useChatApi', () => ({
          __esModule: true,
          default: () => ({
            sendMessage: mockSendMessage,
            loading: true,
            error: null,
          }),
        }));
        
        const module = await import('@/components/ChatInputBar.vue');
        const ChatInputBar = module.default;
        wrapper = mount(ChatInputBar);
      });
      
      const button = wrapper.find('button');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('error handling', () => {
    test('should display error message when error is present', async () => {
      const errorMessage = 'Network error';
      
      // Re-mount with error
      await vi.isolateModules(async () => {
        vi.mock('@/composables/useChatApi', () => ({
          __esModule: true,
          default: () => ({
            sendMessage: mockSendMessage,
            loading: false,
            error: { message: errorMessage },
          }),
        }));
        
        const module = await import('@/components/ChatInputBar.vue');
        const ChatInputBar = module.default;
        wrapper = mount(ChatInputBar);
      });
      
      expect(wrapper.text()).toContain(errorMessage);
    });

    test('should clear error when user starts typing', async () => {
      const errorMessage = 'Network error';
      
      // Re-mount with error
      await vi.isolateModules(async () => {
        const mockClearError = vi.fn();
        vi.mock('@/composables/useChatApi', () => ({
          __esModule: true,
          default: () => ({
            sendMessage: mockSendMessage,
            loading: false,
            error: { message: errorMessage },
            clearError: mockClearError,
          }),
        }));
        
        const module = await import('@/components/ChatInputBar.vue');
        const ChatInputBar = module.default;
        wrapper = mount(ChatInputBar);
      });
      
      const textarea = wrapper.find('textarea');
      await textarea.setValue('H');
      
      // Check if clearError was called (if the component implements it)
      // This test might fail if the component doesn't clear error on input, which is acceptable
      // We're testing the expected behavior
      expect(wrapper.vm.error).toBeUndefined(); // or check if clearError was called
    });
  });

  describe('accessibility', () => {
    test('should have aria-label on send button', () => {
      const button = wrapper.find('button');
      expect(button.attributes('aria-label')).toContain('Send');
    });

    test('should have placeholder in textarea', () => {
      const textarea = wrapper.find('textarea');
      expect(textarea.attributes('placeholder')).toBeDefined();
    });

    test('textarea should be focused after sending message', async () => {
      // Mock focus method
      const mockFocus = vi.fn();
      const textarea = wrapper.find('textarea');
      textarea.element.focus = mockFocus;
      
      const message = 'Test message';
      await textarea.setValue(message);
      
      mockSendMessage.mockResolvedValueOnce({});
      const button = wrapper.find('button');
      await button.trigger('click');
      
      await nextTick();
      expect(mockFocus).toHaveBeenCalled();
    });
  });
});
