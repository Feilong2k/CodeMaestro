import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatPanel from '../../components/ChatPanel.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useChatStore } from '../../stores/chat'

// Define hoisted variables for mocks
const mocks = vi.hoisted(() => {
  return {
    render: vi.fn((text) => {
      if (!text) return ''
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }),
    sanitize: vi.fn((html) => html)
  }
})

// Mock markdown-it
vi.mock('markdown-it', () => {
  return {
    default: class MockMarkdownIt {
      constructor() {
        this.render = mocks.render
      }
    }
  }
})

// Mock DOMPurify
vi.mock('dompurify', () => {
  return {
    default: {
      sanitize: mocks.sanitize
    }
  }
})

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
    vi.useFakeTimers()

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

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should render chat panel container', () => {
    const wrapper = mount(ChatPanel)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('chat-panel')
  })

  it('should display message list area', () => {
    const wrapper = mount(ChatPanel)
    const messageList = wrapper.find('.message-list')
    expect(messageList.exists()).toBe(true)
  })

  it('should display welcome message from Orion', () => {
    const wrapper = mount(ChatPanel)
    const welcomeMessage = wrapper.find('.message-content')
    expect(welcomeMessage.exists()).toBe(true)
    expect(welcomeMessage.text()).toContain('Welcome')
  })

  it('should render Markdown-formatted messages', async () => {
    const wrapper = mount(ChatPanel)
    // The welcome message is rendered. Check if render was called.
    expect(mocks.render).toHaveBeenCalled()
  })

  it('should sanitize HTML in Markdown', () => {
    const wrapper = mount(ChatPanel)
    expect(mocks.sanitize).toHaveBeenCalled()
  })

  it('should display typing effect for incoming assistant messages', async () => {
    // Add a new message with typing effect to the store
    mockStore.messages.push({
      id: 2,
      sender: 'Orion',
      content: 'This is a typed response',
      timestamp: new Date(),
      typingEffect: true
    })

    const wrapper = mount(ChatPanel)
    // Fast-forward timers to process typing
    vi.runAllTimers()
    await flushPromises()

    const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })
    expect(messageItems.length).toBe(2)
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
})
