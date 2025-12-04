import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ActivityLog from '../../components/ActivityLog.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ActivityLog.vue', () => {
  // Setup Pinia if needed
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render activity log container', () => {
    const wrapper = mount(ActivityLog)
    expect(wrapper.exists()).toBe(true)
    // Should have activity log container
    expect(wrapper.classes()).toContain('activity-log')
  })

  it('should display a list view for agent actions', () => {
    const wrapper = mount(ActivityLog)
    const listView = wrapper.find('.activity-list')
    expect(listView.exists()).toBe(true)
  })

  it('should display mock data rows', () => {
    const wrapper = mount(ActivityLog)
    // Check for mock rows
    const rows = wrapper.findAll('.activity-row')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('should include mock row for "Orion: Planning"', () => {
    const wrapper = mount(ActivityLog)
    const orionRow = wrapper.find('[data-agent="Orion"]')
    expect(orionRow.exists()).toBe(true)
    expect(orionRow.text()).toContain('Orion')
    expect(orionRow.text()).toContain('Planning')
  })

  it('should include mock row for "Tara: Pending"', () => {
    const wrapper = mount(ActivityLog)
    const taraRow = wrapper.find('[data-agent="Tara"]')
    expect(taraRow.exists()).toBe(true)
    expect(taraRow.text()).toContain('Tara')
    expect(taraRow.text()).toContain('Pending')
  })

  it('should apply matrix theme styling', () => {
    const wrapper = mount(ActivityLog)
    // Check for matrix theme classes
    const container = wrapper.find('.activity-log')
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })
})
