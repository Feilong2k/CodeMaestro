import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'
import TheHeader from '../../components/TheHeader.vue'

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
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('Matrix Theme Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render MatrixBackground component in App.vue', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
    
    // Check that MatrixBackground is rendered
    const matrixBackground = wrapper.findComponent({ name: 'MatrixBackground' })
    expect(matrixBackground.exists()).toBe(true)
    
    // Check MatrixBackground props
    expect(matrixBackground.props('mode')).toBe('matrixAmbient')
    expect(matrixBackground.props('enabled')).toBe(true)
    expect(matrixBackground.props('density')).toBe(0.5)
    expect(matrixBackground.props('speed')).toBe(0.6)
  })

  it('should apply matrix theme classes to App.vue elements', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    
    // Check for matrix theme classes
    expect(wrapper.classes()).toContain('min-h-screen')
    
    // Check for matrix glow shadow on main container
    const mainContainer = wrapper.find('.bg-bg-elevated')
    expect(mainContainer.classes()).toContain('shadow-matrix-glow')
    
    // Check for matrix font classes
    const healthStatus = wrapper.find('.font-matrix-mono')
    expect(healthStatus.exists()).toBe(true)
    
    // Check for matrix theme border colors
    const borders = wrapper.findAll('.border-line-base')
    expect(borders.length).toBeGreaterThan(0)
  })

  it('should apply matrix theme to TheHeader component', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const header = wrapper.findComponent(TheHeader)
    
    expect(header.exists()).toBe(true)
    
    // Check TheHeader for matrix theme classes
    expect(header.classes()).toContain('sticky')
    expect(header.classes()).toContain('top-0')
    expect(header.classes()).toContain('z-50')
    
    // Check for matrix glow on logo
    const logo = header.find('.shadow-matrix-glow')
    expect(logo.exists()).toBe(true)
    
    // Check for matrix font usage
    const appName = header.find('.font-matrix-sans')
    expect(appName.exists()).toBe(true)
    expect(appName.text()).toContain('CodeMaestro')
    
    // Check for matrix theme border classes
    const borderElements = header.findAll('.border-line-base')
    expect(borderElements.length).toBeGreaterThan(0)
  })

  it('should have consistent matrix theme colors across components', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    
    // Check color classes in App.vue
    const accentElements = wrapper.findAll('.text-accent-primary')
    expect(accentElements.length).toBeGreaterThan(0)
    
    const bgElements = wrapper.findAll('.bg-bg-elevated, .bg-bg-layer')
    expect(bgElements.length).toBeGreaterThan(0)
    
    // Check TheHeader for same color classes
    const header = wrapper.findComponent(TheHeader)
    const headerAccent = header.findAll('.text-accent-primary')
    expect(headerAccent.length).toBeGreaterThan(0)
    
    // Verify the accent color is consistent (should be #00E5FF from tailwind config)
    const accentButton = wrapper.find('button.bg-accent-primary')
    expect(accentButton.exists()).toBe(true)
  })

  it('should maintain theme when toggling Plan/Act mode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const header = wrapper.findComponent(TheHeader)
    
    // Find Plan/Act toggle buttons
    const toggleButtons = header.findAll('button.px-4.py-1\\.5')
    expect(toggleButtons).toHaveLength(2)
    
    // Click Act button
    await toggleButtons[1].trigger('click')
    
    // Check that matrix theme classes persist after interaction
    const activeButton = toggleButtons[1]
    expect(activeButton.classes()).toContain('bg-accent-primary')
    expect(activeButton.classes()).toContain('text-bg-base')
    expect(activeButton.classes()).toContain('shadow-matrix-glow')
    
    // Verify MatrixBackground still exists
    const matrixBackground = wrapper.findComponent({ name: 'MatrixBackground' })
    expect(matrixBackground.exists()).toBe(true)
  })
})
