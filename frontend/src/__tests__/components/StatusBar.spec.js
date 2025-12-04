import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBar from '../../components/StatusBar.vue'
import { createPinia, setActivePinia } from 'pinia'

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
})
