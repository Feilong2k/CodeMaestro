import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '../../components/MainLayout.vue'

describe('MainLayout.vue', () => {
  it('should render layout container with correct classes', () => {
    const wrapper = mount(MainLayout)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('main-layout')
  })

  it('should have 3-column grid structure for desktop', () => {
    const wrapper = mount(MainLayout)
    const gridContainer = wrapper.find('.grid')
    expect(gridContainer.exists()).toBe(true)
    expect(gridContainer.classes()).toContain('lg:grid-cols-12')
  })

  it('should have responsive behavior: single column on mobile, 3 columns on desktop', () => {
    const wrapper = mount(MainLayout)
    const gridContainer = wrapper.find('.grid')
    expect(gridContainer.classes()).toContain('grid-cols-1')
    expect(gridContainer.classes()).toContain('lg:grid-cols-12')
  })

  it('should render left, center, and right slots with 2:1:1 column ratio on desktop', () => {
    const wrapper = mount(MainLayout, {
      slots: {
        left: '<div class="left-slot">Chat Panel</div>',
        center: '<div class="center-slot">System Log</div>',
        right: '<div class="right-slot">Activity Panel</div>'
      }
    })
    
    const leftSlot = wrapper.find('.left-slot')
    expect(leftSlot.exists()).toBe(true)
    expect(leftSlot.text()).toBe('Chat Panel')
    
    const centerSlot = wrapper.find('.center-slot')
    expect(centerSlot.exists()).toBe(true)
    expect(centerSlot.text()).toBe('System Log')
    
    const rightSlot = wrapper.find('.right-slot')
    expect(rightSlot.exists()).toBe(true)
    expect(rightSlot.text()).toBe('Activity Panel')

    // Check column spans for desktop (2:1:1 ratio)
    const leftContainer = leftSlot.parentElement?.parentElement
    const centerContainer = centerSlot.parentElement?.parentElement
    const rightContainer = rightSlot.parentElement?.parentElement
    // Since we can't directly access parent elements in test, we'll rely on class checks on the slots' containers
    // Instead, we can test that the grid has three columns and the slots are placed correctly by checking their order
    // For simplicity, we'll assume the slots are rendered in order: left, center, right
    const slots = wrapper.findAll('.grid > *')
    expect(slots.length).toBe(3)
    expect(slots[0].classes()).toContain('lg:col-span-6') // left
    expect(slots[1].classes()).toContain('lg:col-span-3') // center
    expect(slots[2].classes()).toContain('lg:col-span-3') // right
  })

  it('should have sidebars hidden on mobile and visible on large screens by default', () => {
    const wrapper = mount(MainLayout)
    // The left and right sidebars should be hidden on mobile
    const leftAside = wrapper.find('aside:first-of-type')
    const rightAside = wrapper.find('aside:last-of-type')
    // If they exist, they should have 'hidden lg:block' classes
    if (leftAside.exists()) {
      expect(leftAside.classes()).toContain('hidden')
      expect(leftAside.classes()).toContain('lg:block')
    }
    if (rightAside.exists()) {
      expect(rightAside.classes()).toContain('hidden')
      expect(rightAside.classes()).toContain('lg:block')
    }
  })

  it('should have main content area centered with max width', () => {
    const wrapper = mount(MainLayout)
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    const maxWidthContainer = main.find('.max-w-4xl')
    expect(maxWidthContainer.exists()).toBe(true)
  })

  it('should use matrix theme classes', () => {
    const wrapper = mount(MainLayout)
    const defaultSlot = wrapper.find('.bg-bg-elevated')
    expect(defaultSlot.exists()).toBe(true)
    expect(defaultSlot.classes()).toContain('shadow-matrix-glow')
    expect(defaultSlot.classes()).toContain('border-line-base')
  })

  it('should show sidebars on mobile when showLeftOnMobile and showRightOnMobile props are true', () => {
    const wrapper = mount(MainLayout, {
      props: {
        showLeftOnMobile: true,
        showRightOnMobile: true
      }
    })
    const leftAside = wrapper.find('aside:first-of-type')
    const rightAside = wrapper.find('aside:last-of-type')
    if (leftAside.exists()) {
      expect(leftAside.classes()).not.toContain('hidden')
      expect(leftAside.classes()).toContain('lg:block')
    }
    if (rightAside.exists()) {
      expect(rightAside.classes()).not.toContain('hidden')
      expect(rightAside.classes()).toContain('lg:block')
    }
  })

  // Additional test for three-panel layout requirement
  it('should have three distinct panels for Chat, System Log, and Activity', () => {
    const wrapper = mount(MainLayout)
    // Expect three panel containers (could be main and asides)
    const panels = wrapper.findAll('main, aside')
    expect(panels.length).toBe(3)
    // Expect them to have appropriate slot names
    // This test will fail until the component is updated
  })
})
