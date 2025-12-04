import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'
import MainLayout from '../../components/MainLayout.vue'

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

describe('MainLayout Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render MainLayout component in App.vue', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
    
    // Check that MainLayout is rendered
    const mainLayout = wrapper.findComponent(MainLayout)
    expect(mainLayout.exists()).toBe(true)
    
    // Check MainLayout props/classes
    expect(mainLayout.classes()).toContain('main-layout')
  })

  it('should have 12-column grid structure in desktop layout', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const mainLayout = wrapper.findComponent(MainLayout)
    
    // Check for grid container
    const gridContainer = mainLayout.find('.grid')
    expect(gridContainer.exists()).toBe(true)
    
    // Should have responsive grid classes for desktop (12-column grid)
    expect(gridContainer.classes()).toContain('lg:grid-cols-12')
  })

  it('should render all three slots (left, default, right) in App.vue', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const mainLayout = wrapper.findComponent(MainLayout)
    
    // Check left slot content (activity log) - by text
    expect(mainLayout.text()).toContain('Activity Log')
    
    // Check default slot content (main dashboard)
    const defaultSlot = mainLayout.find('h1')
    expect(defaultSlot.exists()).toBe(true)
    expect(defaultSlot.text()).toContain('CodeMaestro Dashboard')
    
    // Check right slot content (status) - by text
    expect(mainLayout.text()).toContain('Status')
  })

  it('should maintain proper z-index hierarchy (above MatrixBackground, below Header)', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    
    // Find MatrixBackground (should be present)
    const matrixBg = wrapper.findComponent({ name: 'MatrixBackground' })
    expect(matrixBg.exists()).toBe(true)
    
    // Find MainLayout
    const mainLayout = wrapper.findComponent(MainLayout)
    expect(mainLayout.exists()).toBe(true)
    
    // Find Header
    const header = wrapper.findComponent({ name: 'TheHeader' })
    expect(header.exists()).toBe(true)
    
    // Check z-index classes (Header should be z-50, MainLayout should be z-10 or similar)
    expect(header.classes()).toContain('z-50')
    // MainLayout should have a z-index class that positions it correctly
    const mainLayoutContainer = wrapper.find('.relative.z-10')
    expect(mainLayoutContainer.exists()).toBe(true)
  })

  it('should apply matrix theme styling to MainLayout elements', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const mainLayout = wrapper.findComponent(MainLayout)
    
    // Check for matrix theme classes in MainLayout content
    const matrixGlowElements = mainLayout.findAll('.shadow-matrix-glow')
    expect(matrixGlowElements.length).toBeGreaterThan(0)
    
    const matrixBorderElements = mainLayout.findAll('.border-line-base')
    expect(matrixBorderElements.length).toBeGreaterThan(0)
    
    const matrixFontElements = mainLayout.findAll('.font-matrix-sans, .font-matrix-mono')
    expect(matrixFontElements.length).toBeGreaterThan(0)
  })

  it('should have responsive behavior (hide sidebars on mobile)', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const mainLayout = wrapper.findComponent(MainLayout)
    
    // Check for responsive classes
    const gridContainer = mainLayout.find('.grid')
    expect(gridContainer.classes()).toContain('grid-cols-1') // Mobile single column
    expect(gridContainer.classes()).toContain('lg:grid-cols-12') // Desktop 12-column grid
  })

  it('should maintain layout when switching Plan/Act modes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const header = wrapper.findComponent({ name: 'TheHeader' })
    
    // Find Plan/Act toggle buttons
    const toggleButtons = header.findAll('button.px-4.py-1\\.5')
    expect(toggleButtons).toHaveLength(2)
    
    // Click Act button
    await toggleButtons[1].trigger('click')
    
    // Verify MainLayout still renders correctly after mode change
    const mainLayout = wrapper.findComponent(MainLayout)
    expect(mainLayout.exists()).toBe(true)
    
    // All slots should still be present
    expect(mainLayout.text()).toContain('Activity Log')
    expect(mainLayout.text()).toContain('CodeMaestro Dashboard')
    expect(mainLayout.text()).toContain('Status')
  })
})
