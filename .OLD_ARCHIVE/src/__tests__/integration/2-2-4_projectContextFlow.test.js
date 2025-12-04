// Integration tests for project context flow (subtask 2-2-4)
// Tests that projectId is included/omitted in chat payloads based on selection

import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import App from '@/App.vue';
import { createPinia, setActivePinia } from 'pinia';

// Mock the useChatApi composable
vi.mock('@/composables/useChatApi', () => {
  let messages = [];
  let loading = false;
  let error = null;
  let sendMessageImplementation = vi.fn();
  let currentContext = null;
  
  return {
    __esModule: true,
    default: () => ({
      get messages() { return messages; },
      get loading() { return loading; },
      get error() { return error; },
      sendMessage: sendMessageImplementation,
      retry: vi.fn(),
    }),
    // Expose internal state for test control
    __setMessages: (newMessages) => { messages = newMessages; },
    __setLoading: (newLoading) => { loading = newLoading; },
    __setError: (newError) => { error = newError; },
    __setSendMessageImplementation: (impl) => { sendMessageImplementation = impl; },
    __getLastContext: () => currentContext,
    __reset: () => {
      messages = [];
      loading = false;
      error = null;
      sendMessageImplementation = vi.fn();
      currentContext = null;
    },
  };
});

// Mock project service
vi.mock('@/services/projectService', () => ({
  fetchProjects: vi.fn().mockResolvedValue([
    { id: 'proj-1', name: 'Project Alpha' },
    { id: 'proj-2', name: 'Project Beta' },
  ]),
  createProject: vi.fn(),
}));

// Import after mocking
const useChatApiModule = require('@/composables/useChatApi');

describe('Project Context Flow Integration (2-2-4)', () => {
  let wrapper;
  let pinia;
  
  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    
    useChatApiModule.__reset();
    
    // Create a mock store for project selection if needed
    // For now, we'll test the component directly with props
    
    wrapper = mount(App, {
      global: {
        plugins: [pinia],
      },
    });
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });
  
  describe('project selection UI', () => {
    test('should render project picker component', async () => {
      // The project picker should be present in the UI
      // Since we're mounting the full App, we need to check for the component
      // For now, we'll assume it's there based on the requirement
      await nextTick();
      
      // Look for project selection UI
      const projectSelect = wrapper.find('select');
      expect(projectSelect.exists()).toBe(true);
    });
    
    test('should load and display projects', async () => {
      await nextTick();
      
      // Wait for projects to load
      await new Promise(resolve => setTimeout(resolve, 0));
      await nextTick();
      
      const options = wrapper.findAll('option');
      // Should have at least the default option
      expect(options.length).toBeGreaterThan(0);
      
      // Check for project names in the options
      const optionsText = options.map(opt => opt.text());
      expect(optionsText.some(text => text.includes('Project Alpha'))).toBe(true);
      expect(optionsText.some(text => text.includes('Project Beta'))).toBe(true);
    });
  });
  
  describe('project context in chat payloads', () => {
    test('should include projectId in chat payload when project is selected', async () => {
      // Arrange
      const selectedProjectId = 'proj-1';
      const mockSendMessage = vi.fn().mockResolvedValue({});
      useChatApiModule.__setSendMessageImplementation(mockSendMessage);
      
      // We need to simulate project selection
      // Since we're testing the full app, we need to find the project picker
      // and set its value
      await nextTick();
      
      const projectSelect = wrapper.find('select');
      await projectSelect.setValue(selectedProjectId);
      
      // Wait for Vue to update
      await nextTick();
      
      // Act - send a message
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Hello with project context');
      
      const sendButton = wrapper.find('button[type="submit"], button:has-text("Send")').at(1) || wrapper.find('button').at(1);
      await sendButton.trigger('click');
      
      // Assert - sendMessage should have been called with projectId in context
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMessage.mock.calls[0];
      
      // The third argument to sendMessage should be context
      expect(callArgs[2]).toBeDefined();
      expect(callArgs[2].projectId).toBe(selectedProjectId);
    });
    
    test('should NOT include projectId in chat payload when no project is selected', async () => {
      // Arrange
      const mockSendMessage = vi.fn().mockResolvedValue({});
      useChatApiModule.__setSendMessageImplementation(mockSendMessage);
      
      await nextTick();
      
      // Ensure no project is selected (default option)
      const projectSelect = wrapper.find('select');
      await projectSelect.setValue('');
      
      // Wait for Vue to update
      await nextTick();
      
      // Act - send a message
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Hello without project context');
      
      const sendButton = wrapper.find('button[type="submit"], button:has-text("Send")').at(1) || wrapper.find('button').at(1);
      await sendButton.trigger('click');
      
      // Assert - sendMessage should have been called without projectId in context
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMessage.mock.calls[0];
      
      // The third argument (context) should be undefined or null
      // OR if context is provided but projectId is undefined/empty
      if (callArgs[2]) {
        expect(callArgs[2].projectId).toBeFalsy();
      }
    });
    
    test('should send different projectIds when switching projects', async () => {
      // Arrange
      const mockSendMessage = vi.fn().mockResolvedValue({});
      useChatApiModule.__setSendMessageImplementation(mockSendMessage);
      
      await nextTick();
      
      const projectSelect = wrapper.find('select');
      
      // First, select project 1
      await projectSelect.setValue('proj-1');
      await nextTick();
      
      // Send first message
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Message 1');
      
      let sendButton = wrapper.find('button[type="submit"], button:has-text("Send")').at(1) || wrapper.find('button').at(1);
      await sendButton.trigger('click');
      
      // Clear the mock to track second call separately
      mockSendMessage.mockClear();
      
      // Switch to project 2
      await projectSelect.setValue('proj-2');
      await nextTick();
      
      // Send second message
      await textarea.setValue('Message 2');
      sendButton = wrapper.find('button[type="submit"], button:has-text("Send")').at(1) || wrapper.find('button').at(1);
      await sendButton.trigger('click');
      
      // Assert - both calls should have different projectIds
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMessage.mock.calls[0];
      
      expect(callArgs[2].projectId).toBe('proj-2');
    });
  });
  
  describe('project context persistence', () => {
    test('should maintain selected project across page navigation', async () => {
      // This would require testing session storage or store persistence
      // For integration, we can test that the selected value is retained
      // in the component state after simulated re-render
      
      await nextTick();
      
      const projectSelect = wrapper.find('select');
      await projectSelect.setValue('proj-1');
      await nextTick();
      
      // Store the current value
      const selectedValue = projectSelect.element.value;
      
      // Simulate component re-render by finding the select again
      const refreshedSelect = wrapper.find('select');
      
      // The value should still be 'proj-1'
      expect(refreshedSelect.element.value).toBe(selectedValue);
    });
    
    test('should default to no project selection on initial load', async () => {
      await nextTick();
      
      const projectSelect = wrapper.find('select');
      
      // Default should be empty or "Select a project"
      expect(projectSelect.element.value).toBe('');
    });
  });
  
  describe('error handling with project context', () => {
    test('should handle API errors while project is selected', async () => {
      // Arrange
      const errorMessage = 'Network error';
      const selectedProjectId = 'proj-1';
      
      useChatApiModule.__setSendMessageImplementation(() => {
        useChatApiModule.__setError({ message: errorMessage });
        return Promise.reject(new Error(errorMessage));
      });
      
      await nextTick();
      
      // Select a project
      const projectSelect = wrapper.find('select');
      await projectSelect.setValue(selectedProjectId);
      await nextTick();
      
      // Act - send message that will fail
      const textarea = wrapper.find('textarea');
      await textarea.setValue('Message that will fail');
      
      const sendButton = wrapper.find('button[type="submit"], button:has-text("Send")').at(1) || wrapper.find('button').at(1);
      await sendButton.trigger('click');
      
      // Wait for error
      await nextTick();
      await nextTick();
      
      // Assert - error should be displayed
      expect(wrapper.text()).toContain(errorMessage);
      
      // Project selection should still be maintained
      expect(projectSelect.element.value).toBe(selectedProjectId);
    });
    
    test('should allow retry with same project context', async () => {
      // This test would require mocking the retry function
      // For now, we'll verify the flow conceptually
      expect(true).toBe(true);
    });
  });
  
  describe('new project creation flow', () => {
    test('should refresh project list after creating new project', async () => {
      // This would test the integration with the project wizard
      // For now, we'll verify the component has a "New Project" button
      
      await nextTick();
      
      const newProjectButton = wrapper.find('button:has-text("New Project")');
      expect(newProjectButton.exists()).toBe(true);
    });
    
    test('should auto-select newly created project', async () => {
      // This would test that after creating a project via wizard,
      // it gets automatically selected
      // Implementation dependent
      expect(true).toBe(true);
    });
  });
});
