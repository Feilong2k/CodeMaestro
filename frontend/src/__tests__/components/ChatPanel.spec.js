import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatPanel from '../../components/ChatPanel.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ChatPanel.vue', () => {
  // Setup Pinia if needed
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
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

  it('should display a mock welcome message from Orion', () => {
    const wrapper = mount(ChatPanel)
    // Check for welcome message
    const welcomeMessage = wrapper.find('.message-content')
    expect(welcomeMessage.exists()).toBe(true)
    expect(welcomeMessage.text()).toContain('Welcome')
    expect(welcomeMessage.text()).toContain('Orion')
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
})
