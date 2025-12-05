import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ChatPanel from '../../components/ChatPanel.vue'
import { createPinia, setActivePinia } from 'pinia'

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
  // Must return a class or constructor function for default export
  return {
    default: class MockMarkdownIt {
      constructor() {
        // Bind the render method to the hoisted mock
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

describe('ChatPanel.vue', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    vi.useFakeTimers()
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

  it('should display a mock welcome message from Orion', () => {
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
    const wrapper = mount(ChatPanel)
    
    const input = wrapper.find('.chat-input')
    await input.trigger('focus')
    input.element.innerText = 'Hello'
    await input.trigger('input')
    
    const sendButton = wrapper.find('button.send-button')
    await sendButton.trigger('click')
    
    // Fast-forward timers to process typing
    vi.runAllTimers()
    await flushPromises()

    const messageItems = wrapper.findAllComponents({ name: 'MessageItem' })
    expect(messageItems.length).toBeGreaterThanOrEqual(2)
  })
})
