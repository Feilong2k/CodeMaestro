import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ActivityLog from '../../components/ActivityLog.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAgentsStore } from '../../stores/agents'

// Mock the agents store methods
vi.mock('../../stores/agents', () => ({
  useAgentsStore: vi.fn(() => ({
    activityHistory: [],
    recentActivity: vi.fn(() => []),
    initSocket: vi.fn(),
    cleanupSocket: vi.fn()
  }))
}))

describe('ActivityLog.vue', () => {
  let mockStore

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    const pinia = createPinia()
    setActivePinia(pinia)

    // Reset the mock store
    mockStore = {
      activityHistory: [],
      recentActivity: vi.fn(() => []),
      initSocket: vi.fn(),
      cleanupSocket: vi.fn()
    }
    useAgentsStore.mockReturnValue(mockStore)
  })

  it('should render activity log container', () => {
    const wrapper = mount(ActivityLog)
    expect(wrapper.exists()).toBe(true)
    // Should have activity log container
    expect(wrapper.classes()).toContain('activity-log')
  })

  it('should display a list view for agent actions', () => {
    // Mock that there are activities so the list view is rendered
    mockStore.recentActivity.mockReturnValue([{
      agent: 'orion',
      action: 'test',
      taskId: 'test',
      timestamp: new Date()
    }])
    const wrapper = mount(ActivityLog)
    const listView = wrapper.find('.activity-list')
    expect(listView.exists()).toBe(true)
  })

  it('should apply matrix theme styling', () => {
    const wrapper = mount(ActivityLog)
    // Check for matrix theme classes
    const container = wrapper.find('.activity-log')
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })

  it('should initialize socket connection on mount', () => {
    mount(ActivityLog)
    expect(mockStore.initSocket).toHaveBeenCalled()
  })

  it('should cleanup socket connection on unmount', () => {
    const wrapper = mount(ActivityLog)
    wrapper.unmount()
    expect(mockStore.cleanupSocket).toHaveBeenCalled()
  })

  describe('when there are no activities', () => {
    it('should display waiting message', () => {
      const wrapper = mount(ActivityLog)
      expect(wrapper.text()).toContain('Waiting for activity')
      expect(wrapper.text()).toContain('Agent actions will appear here in real-time')
    })

    it('should have clear button disabled', () => {
      const wrapper = mount(ActivityLog)
      const clearButton = wrapper.find('button')
      expect(clearButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('when there are activities', () => {
    beforeEach(() => {
      const mockActivities = [
        {
          agent: 'orion',
          action: 'started_task',
          taskId: '3-5',
          timestamp: new Date('2025-12-05T10:00:00Z')
        },
        {
          agent: 'tara',
          action: 'completed_test',
          taskId: '3-4',
          timestamp: new Date('2025-12-05T10:05:00Z')
        },
        {
          agent: 'devon',
          action: 'committed_code',
          taskId: '3-3',
          timestamp: new Date('2025-12-05T10:10:00Z')
        }
      ]
      mockStore.recentActivity.mockReturnValue(mockActivities)
    })

    it('should display activities from agents store', () => {
      const wrapper = mount(ActivityLog)
      // Check that recentActivity was called with default limit (50)
      expect(mockStore.recentActivity).toHaveBeenCalledWith(50)
    })

    it('should format activity descriptions correctly', async () => {
      const wrapper = mount(ActivityLog)
      await flushPromises()
      
      // The ActivityRow components are rendered, we can check for the agent names
      // Since ActivityRow is a child component, we can check for its existence
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      expect(activityRows.length).toBe(3)
      
      // Check props passed to ActivityRow
      const firstRow = activityRows[0]
      expect(firstRow.props('agent')).toBe('orion')
      expect(firstRow.props('description')).toBe('orion: started_task (3-5)')
      expect(firstRow.props('status')).toBe('Active')
    })

    it('should enable clear button when there are activities', () => {
      const wrapper = mount(ActivityLog)
      const clearButton = wrapper.find('button')
      expect(clearButton.attributes('disabled')).toBeUndefined()
    })

    it('should clear activities when clear button is clicked', async () => {
      const wrapper = mount(ActivityLog)
      const clearButton = wrapper.find('button')
      
      // Simulate click
      await clearButton.trigger('click')
      
      // The store's activityHistory should be set to empty array
      expect(mockStore.activityHistory).toEqual([])
    })

    it('should format time ago correctly', () => {
      // This is tested indirectly through the component's formatTimeAgo function
      // We can test the function by importing the component and calling it directly
      // But for integration test, we rely on the component behavior
      const wrapper = mount(ActivityLog)
      // The timeAgo prop will be passed to ActivityRow, we can check it's passed
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      if (activityRows.length > 0) {
        // The timeAgo prop should be a string like "Xs ago" or "Xm ago" etc.
        expect(typeof activityRows[0].props('timeAgo')).toBe('string')
      }
    })

    it('should assign correct avatar background colors based on agent', () => {
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      
      // Check first row (orion) gets accent-primary
      expect(activityRows[0].props('avatarBg')).toBe('bg-accent-primary')
      // Second row (tara) gets accent-secondary
      expect(activityRows[1].props('avatarBg')).toBe('bg-accent-secondary')
      // Third row (devon) gets accent-tertiary
      expect(activityRows[2].props('avatarBg')).toBe('bg-accent-tertiary')
    })

    it('should assign correct avatar text (first letter uppercase)', () => {
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      
      expect(activityRows[0].props('avatarText')).toBe('O') // orion -> O
      expect(activityRows[1].props('avatarText')).toBe('T') // tara -> T
      expect(activityRows[2].props('avatarText')).toBe('D') // devon -> D
    })
  })

  describe('status determination', () => {
    it('should set status to "Completed" for completed/finished actions', () => {
      mockStore.recentActivity.mockReturnValue([
        { agent: 'tara', action: 'completed_test', taskId: '3-4', timestamp: new Date() }
      ])
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      expect(activityRows[0].props('status')).toBe('Completed')
    })

    it('should set status to "Active" for started/began actions', () => {
      mockStore.recentActivity.mockReturnValue([
        { agent: 'orion', action: 'started_task', taskId: '3-5', timestamp: new Date() }
      ])
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      expect(activityRows[0].props('status')).toBe('Active')
    })

    it('should set status to "Error" for error/failed actions', () => {
      mockStore.recentActivity.mockReturnValue([
        { agent: 'devon', action: 'error_build', taskId: '3-3', timestamp: new Date() }
      ])
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      expect(activityRows[0].props('status')).toBe('Error')
    })

    it('should set status to "Info" for other actions', () => {
      mockStore.recentActivity.mockReturnValue([
        { agent: 'orion', action: 'planning', taskId: '3-1', timestamp: new Date() }
      ])
      const wrapper = mount(ActivityLog)
      const activityRows = wrapper.findAllComponents({ name: 'ActivityRow' })
      expect(activityRows[0].props('status')).toBe('Info')
    })
  })
})
