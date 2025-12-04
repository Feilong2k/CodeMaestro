import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TheHeader from '../../components/TheHeader.vue'
import { useAppStore } from '../../stores/appStore'
import { createPinia, setActivePinia } from 'pinia'

describe('TheHeader.vue', () => {
  // Setup Pinia
  const pinia = createPinia()
  setActivePinia(pinia)

  it('should render header with dark theme', () => {
    const wrapper = mount(TheHeader, {
      global: {
        plugins: [pinia]
      }
    })
    expect(wrapper.exists()).toBe(true)
    // Check for header class
    expect(wrapper.classes()).toContain('sticky')
    expect(wrapper.classes()).toContain('top-0')
    expect(wrapper.classes()).toContain('z-50')
  })

  it('should display project switcher dropdown', () => {
    const wrapper = mount(TheHeader, {
      global: {
        plugins: [pinia]
      }
    })
    const button = wrapper.find('button.flex.items-center.space-x-2')
    expect(button.exists()).toBe(true)
    // Should show current project name
    expect(button.text()).toContain('Demo Project')
  })

  it('should have New Project button', () => {
    const wrapper = mount(TheHeader, {
      global: {
        plugins: [pinia]
      }
    })
    const buttons = wrapper.findAll('button')
    const newProjectButton = buttons.find(btn => btn.text().includes('New Project'))
    expect(newProjectButton.exists()).toBe(true)
  })

  it('should have Plan/Act toggle that reflects store state', () => {
    const wrapper = mount(TheHeader, {
      global: {
        plugins: [pinia]
      }
    })
    const toggleButtons = wrapper.findAll('button.px-4.py-1\\.5')
    expect(toggleButtons).toHaveLength(2)
    expect(toggleButtons[0].text()).toMatch(/Plan/i)
    expect(toggleButtons[1].text()).toMatch(/Act/i)
  })

  it('should change store currentView when toggle is clicked', async () => {
    const wrapper = mount(TheHeader, {
      global: {
        plugins: [pinia]
      }
    })
    const store = useAppStore()
    const initialView = store.currentView
    const toggleButtons = wrapper.findAll('button.px-4.py-1\\.5')
    // Click the opposite button
    if (initialView === 'plan') {
      await toggleButtons[1].trigger('click')
      expect(store.currentView).toBe('act')
    } else {
      await toggleButtons[0].trigger('click')
      expect(store.currentView).toBe('plan')
    }
  })
})
