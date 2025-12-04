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

describe('ActivityLog Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks
    mockFetch.mockClear()
    // Setup Pinia
    setActivePinia(createPinia())
  })

  it('should render ActivityLog component in App.vue (left slot)', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    // Check that ActivityLog is rendered in the App's left slot
    // Since ActivityLog is not yet integrated into App.vue, this test will fail (Red)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    expect(activityLog.exists()).toBe(true)
  })

  it('should display a list view for agent actions in ActivityLog', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    const listView = activityLog.find('.activity-list')
    expect(listView.exists()).toBe(true)
  })

  it('should display mock data rows in ActivityLog', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    // Check for mock rows
    const rows = activityLog.findAll('.activity-row')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('should include mock row for "Orion: Planning" in ActivityLog', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    const orionRow = activityLog.find('[data-agent="Orion"]')
    expect(orionRow.exists()).toBe(true)
    expect(orionRow.text()).toContain('Orion')
    expect(orionRow.text()).toContain('Planning')
  })

  it('should include mock row for "Tara: Pending" in ActivityLog', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    const taraRow = activityLog.find('[data-agent="Tara"]')
    expect(taraRow.exists()).toBe(true)
    expect(taraRow.text()).toContain('Tara')
    expect(taraRow.text()).toContain('Pending')
  })

  it('should apply matrix theme styling to ActivityLog', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', message: 'Backend is healthy' })
    })

    const wrapper = mount(App)
    const activityLog = wrapper.findComponent({ name: 'ActivityLog' })
    // Check for matrix theme classes
    const container = activityLog.find('.activity-log')
    expect(container.exists()).toBe(true)
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })
})
