import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatPanel from '../../components/ChatPanel.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../../stores/chat'

// Mock the chat store
vi.mock('../../stores/chat', () => ({
  useChatStore: vi.fn(() => ({
    messages: [
      {
        id: 1,
        sender: 'Orion',
        content: "Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test.",
        timestamp: new Date('2025-12-05T10:00:00Z')
      }
    ],
    sending: false,
    error: null,
    sendMessage: vi.fn(),
    addMessage: vi.fn(),
    clearHistory: vi.fn()
  }))
}))

describe('ChatPanel.vue', () => {
  let mockStore

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset the mock store
    mockStore = {
      messages: [
        {
          id: 1,
          sender: 'Orion',
          content: "Welcome to CodeMaestro. I'm Orion, your AI development assistant. Ready to help you plan, build, and test.",
          timestamp: new Date('2025-12-05T10:00:00Z')
        }
      ],
      sending: false,
      error: null,
      sendMessage: vi.fn(),
      addMessage: vi.fn(),
      clearHistory: vi.fn()
    }
    useChatStore.mockReturnValue(mockStore)
  })

  it('should render chat panel container', () => {
    const wrapper = mount(ChatPanel)
    expect(wrapper.exists()).toBe(true)
    // Should have chat panel container
    expect(wrapper.classes()).toContain('chat-panel')
  })

  it('should display message list area', () => {
    const wrapper = mount(ChatPanel)
    const messageList = wrapper.find('.message-list')
    expect(messageList.exists()).toBe(true)
  })

  it('should display welcome message from Orion', () => {
    const wrapper = mount(ChatPanel)
    // The welcome message should be displayed via MessageItem components
    const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })
    expect(messageItems.length).toBe(1)
    expect(messageItems[0].props('sender')).toBe('Orion')
    expect(messageItems[0].props('message')).toContain('Welcome')
  })

  it('should have an input area for user messages', () => {
    const wrapper = mount(ChatPanel)
    const inputArea = wrapper.find('.chat-input')
    expect(inputArea.exists()).toBe(true)
    // Should be editable
    expect(inputArea.attributes('contenteditable')).toBe('true')
  })

  it('should have a send button', () => {
    const wrapper = mount(ChatPanel)
    const sendButton = wrapper.find('button.send-button')
    expect(sendButton.exists()).toBe(true)
    expect(sendButton.text()).toMatch(/send/i)
  })

  it('should apply matrix theme styling', () => {
    const wrapper = mount(ChatPanel)
    // Check for matrix theme classes
    const container = wrapper.find('.chat-panel')
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })

  describe('sendMessage', () => {
    it('should call store.sendMessage when send button is clicked', async () => {
      const wrapper = mount(ChatPanel)
      const input = wrapper.find('.chat-input')
      const sendButton = wrapper.find('button.send-button')

      // Simulate typing
      await input.trigger('focus')
      input.element.innerText = 'Hello, Orion'
      await input.trigger('input')

      // Click send button
      await sendButton.trigger('click')

      // Check that sendMessage was called with the input text
      expect(mockStore.sendMessage).toHaveBeenCalledWith('Hello, Orion')
    })

    it('should disable send button while sending', () => {
      mockStore.sending = true
      const wrapper = mount(ChatPanel)
      const sendButton = wrapper.find('button.send-button')
      expect(sendButton.attributes('disabled')).toBeDefined()
      expect(sendButton.text()).toMatch(/sending/i)
    })

    it('should show typing indicator when sending is true', () => {
      mockStore.sending = true
      const wrapper = mount(ChatPanel)
      const typingIndicator = wrapper.find('.typing-indicator')
      expect(typingIndicator.exists()).toBe(true)
      expect(typingIndicator.text()).toContain('Orion is typing')
    })
  })

  // Markdown features are not yet implemented, so we skip them
  describe.skip('Chat UX Enhancements', () => {
    it('should render Markdown-formatted messages', () => {
      // To be implemented later
    })

    it('should sanitize HTML in Markdown to prevent XSS', () => {
      // To be implemented later
    })

    it('should display typing effect for incoming assistant messages', () => {
      // To be implemented later
    })

    it('should auto-scroll while typing effect is active', () => {
      // To be implemented later
    })

    it('should handle code blocks with syntax highlighting', () => {
      // To be implemented later
    })

    it('should render lists, bold, and italics correctly', () => {
      // To be implemented later
    })
  })
})
