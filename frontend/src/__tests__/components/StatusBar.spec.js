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
    expect(stateText.text()).toContain('System Idle')
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
      // This test will fail because the component doesn't use useSocket yet.
      // We are in Red phase, so that's okay.
      expect(false).toBe(true)
    })

    it('should display active agent from agents store', () => {
      // This test will fail because the component doesn't use agents store yet.
      expect(false).toBe(true)
    })

    it('should display current task progress from tasks store', () => {
      // This test will fail because the component doesn't use tasks store yet.
      expect(false).toBe(true)
    })

    it('should update status in real-time when stores change', () => {
      // This test will fail.
      expect(false).toBe(true)
    })
  })
})
