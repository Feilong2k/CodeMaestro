import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBar from '../../components/StatusBar.vue'
import { createTestingPinia } from '@pinia/testing'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '../../stores/tasks'
import { useAgentsStore } from '../../stores/agents'

// Mock the useSocket composable
vi.mock('../../composables/useSocket', () => ({
  useSocket: () => ({
    isConnected: true,
    logEntries: [],
    stateChanges: [],
    agentActions: [],
    clearEvents: vi.fn()
  })
}))

describe('StatusBar.vue', () => {
  // Setup Pinia if needed
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render status bar container', () => {
    const wrapper = mount(StatusBar)
    expect(wrapper.exists()).toBe(true)
    // Should have status bar container
    expect(wrapper.classes()).toContain('status-bar')
  })

  it('should display a traffic light visual indicator', () => {
    const wrapper = mount(StatusBar)
    const trafficLight = wrapper.find('.traffic-light')
    expect(trafficLight.exists()).toBe(true)
  })

  it('should show a color in the traffic light (green, yellow, or red)', () => {
    const wrapper = mount(StatusBar)
    const trafficLight = wrapper.find('.traffic-light')
    // Should have a color class
    const hasColor = trafficLight.classes().some(className => 
      className.includes('green') || className.includes('yellow') || className.includes('red')
    )
    expect(hasColor).toBe(true)
  })

  it('should display current state text', () => {
    const wrapper = mount(StatusBar)
    const stateText = wrapper.find('.state-text')
    expect(stateText.exists()).toBe(true)
    // Should contain connection status and agent status
    expect(stateText.text()).toContain('Connected')
    expect(stateText.text()).toContain('All agents idle')
  })

  it('should be positioned at the bottom or in a designated location', () => {
    const wrapper = mount(StatusBar)
    // Check for positioning classes (could be fixed, absolute, etc.)
    const positioningClass = wrapper.classes().find(className => 
      className.includes('fixed') || className.includes('absolute') || className.includes('sticky')
    )
    // At least one of these or a specific class for bottom
    const bottomClass = wrapper.classes().find(className => 
      className.includes('bottom')
    )
    expect(positioningClass || bottomClass).toBeTruthy()
  })

  it('should apply matrix theme styling', () => {
    const wrapper = mount(StatusBar)
    // Check for matrix theme classes
    const container = wrapper.find('.status-bar')
    expect(container.classes()).toContain('bg-bg-layer')
    expect(container.classes()).toContain('border-line-base')
  })

  describe('Integration with stores', () => {
    it('should display WebSocket connection status from useSocket', () => {
      const wrapper = mount(StatusBar)
      // The useSocket mock returns isConnected: true
      const connectionStatus = wrapper.find('.state-text')
      expect(connectionStatus.text()).toContain('Connected')
      // The connection dot should have green background
      const connectionDot = wrapper.find('.w-2.h-2.rounded-full')
      expect(connectionDot.classes()).toContain('bg-green-500')
    })

    it('should display active agent from agents store', () => {
      // Setup agents store with an active agent
      const agentsStore = useAgentsStore()
      agentsStore.agents.orion.status = 'active'
      
      const wrapper = mount(StatusBar)
      const stateText = wrapper.find('.state-text')
      expect(stateText.text()).toContain('Orion active')
    })

    it('should display current task progress from tasks store', () => {
      // Setup tasks store with a task in progress
      const tasksStore = useTasksStore()
      tasksStore.subtasks = [
        { id: '3-7', title: 'Status Bar Integration', status: 'in_progress' }
      ]
      
      const wrapper = mount(StatusBar)
      const stateText = wrapper.find('.state-text')
      expect(stateText.text()).toContain('3-7: Status Bar Integration')
    })

    it('should update status in real-time when stores change', () => {
      // This test is more complex and would require mocking socket events.
      // For now, we can test that the component reacts to store changes.
      // We'll set up initial state and then change it.
      const agentsStore = useAgentsStore()
      agentsStore.agents.orion.status = 'idle'
      
      const wrapper = mount(StatusBar)
      let stateText = wrapper.find('.state-text')
      expect(stateText.text()).toContain('All agents idle')
      
      // Change the agent status
      agentsStore.agents.orion.status = 'active'
      // Trigger update - we need to wait for next tick
      wrapper.vm.$nextTick(() => {
        stateText = wrapper.find('.state-text')
        expect(stateText.text()).toContain('Orion active')
      })
    })
  })
})
