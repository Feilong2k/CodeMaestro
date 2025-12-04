import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'

// Mock fetch globally for health checks
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('ChatPanel Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render ChatPanel component in App.vue', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    // Check that ChatPanel is rendered in the App
    // We expect the ChatPanel to be present in the MainLayout's default slot
    // Since ChatPanel is not yet integrated, this test will fail (Red)
    const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
    expect(chatPanel.exists()).toBe(true)
  })

  it('should display a welcome message from Orion in ChatPanel', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
    // Within the ChatPanel, look for the welcome message
    const welcomeMessage = chatPanel.find('.message-content')
    expect(welcomeMessage.exists()).toBe(true)
    expect(welcomeMessage.text()).toContain('Welcome')
    expect(welcomeMessage.text()).toContain('Orion')
  })

  it('should have an editable input area for user messages in ChatPanel', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
    const inputArea = chatPanel.find('.chat-input')
    expect(inputArea.exists()).toBe(true)
    // Should be editable
    expect(inputArea.attributes('contenteditable')).toBe('true')
  })

  it('should have a send button in ChatPanel', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
    const sendButton = chatPanel.find('button.send-button')
    expect(sendButton.exists()).toBe(true)
    expect(sendButton.text()).toMatch(/send/i)
  })

  it('should apply matrix theme styling to ChatPanel', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const chatPanel = wrapper.findComponent({ name: 'ChatPanel' })
    // Check for matrix theme classes
    const container = chatPanel.find('.chat-panel')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })
})
