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

describe('StatusBar Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render StatusBar component in App.vue', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    // Check that StatusBar is rendered in the App
    // Since StatusBar is not yet integrated into App.vue, this test will fail (Red)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    expect(statusBar.exists()).toBe(true)
  })

  it('should display a traffic light visual indicator in StatusBar', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    const trafficLight = statusBar.find('.traffic-light')
    expect(trafficLight.exists()).toBe(true)
  })

  it('should show a color in the traffic light (green, yellow, or red) in StatusBar', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    const trafficLight = statusBar.find('.traffic-light')
    // Should have a color class
    const hasColor = trafficLight.classes().some(className => 
      className.includes('green') || className.includes('yellow') || className.includes('red')
    )
    expect(hasColor).toBe(true)
  })

  it('should display current state text in StatusBar', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    const stateText = statusBar.find('.state-text')
    expect(stateText.exists()).toBe(true)
    expect(stateText.text()).toContain('System Idle')
  })

  it('should be positioned at the bottom or in a designated location in StatusBar', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    // Check for positioning classes (could be fixed, absolute, etc.)
    const positioningClass = statusBar.classes().find(className => 
      className.includes('fixed') || className.includes('absolute') || className.includes('sticky')
    )
    // At least one of these or a specific class for bottom
    const bottomClass = statusBar.classes().find(className => 
      className.includes('bottom')
    )
    expect(positioningClass || bottomClass).toBeTruthy()
  })

  it('should apply matrix theme styling to StatusBar', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const statusBar = wrapper.findComponent({ name: 'StatusBar' })
    // Check for matrix theme classes
    const container = statusBar.find('.status-bar')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })
})
