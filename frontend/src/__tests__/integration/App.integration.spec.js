import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../App.vue'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('App.vue Integration', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render the App with TheHeader component', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
    
    // Check that TheHeader is rendered
    const header = wrapper.findComponent({ name: 'TheHeader' })
    expect(header.exists()).toBe(true)
    
    // Check main content
    expect(wrapper.text()).toContain('CodeMaestro Dashboard')
    expect(wrapper.text()).toContain('Backend Health')
  })

  it('should display backend health status on successful fetch', async () => {
    const mockResponse = { status: 'ok', message: 'Backend is healthy' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const wrapper = mount(App)
    
    // Wait for mounted async
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain(`Backend says: ${mockResponse.status} – ${mockResponse.message}`)
  })

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const wrapper = mount(App)
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain('Backend check failed')
  })

  it('should allow manual health check via button', async () => {
    const mockResponse1 = { status: 'ok', message: 'First check' }
    const mockResponse2 = { status: 'ok', message: 'Second check' }
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse1
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse2
      })

    const wrapper = mount(App)
    
    // Wait for initial mount
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain(`Backend says: ${mockResponse1.status} – ${mockResponse1.message}`)
    
    // Click the check button
    const button = wrapper.find('button')
    await button.trigger('click')
    
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(wrapper.text()).toContain(`Backend says: ${mockResponse2.status} – ${mockResponse2.message}`)
  })

  it('should integrate with Pinia store through TheHeader', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    
    // TheHeader should be connected to the same Pinia store
    const header = wrapper.findComponent({ name: 'TheHeader' })
    expect(header.exists()).toBe(true)
    
    // App should have dark theme classes
    expect(wrapper.classes()).toContain('bg-slate-900')
  })
})
