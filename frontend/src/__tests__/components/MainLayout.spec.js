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

    // We should have two asides and one main
    const asides = wrapper.findAll('aside')
    const mains = wrapper.findAll('main')
    expect(asides).toHaveLength(2)
    expect(mains).toHaveLength(1)

    // Check the column spans
    const leftAside = asides[0]
    const main = mains[0]
    const rightAside = asides[1]

    expect(leftAside.classes()).toContain('lg:col-span-6')
    expect(main.classes()).toContain('lg:col-span-3')
    expect(rightAside.classes()).toContain('lg:col-span-3')
  })

  it('should have sidebars hidden on mobile and visible on large screens by default', () => {
    const wrapper = mount(MainLayout)
    // The left and right sidebars should be hidden on mobile
    const leftAside = wrapper.find('aside:first-of-type')
    const rightAside = wrapper.find('aside:last-of-type')
    // If they exist, they should have 'hidden lg:block' classes (if showLeftOnMobile and showRightOnMobile are false)
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
    // Check that the default slot content inside left aside uses matrix theme classes
    const leftAside = wrapper.find('aside')
    expect(leftAside.exists()).toBe(true)
    // The default slot content is a div with the matrix classes
    const defaultContent = leftAside.find('div.bg-bg-elevated')
    expect(defaultContent.exists()).toBe(true)
    expect(defaultContent.classes()).toContain('shadow-matrix-glow')
    expect(defaultContent.classes()).toContain('border-line-base')
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
    // Expect three panel containers (two asides and one main)
    const panels = wrapper.findAll('aside, main')
    expect(panels.length).toBe(3)
    // Check that they have the appropriate slot names (by checking the presence of slot content or classes)
    // The left aside should have slot name left, center main should have slot name center, right aside should have slot name right.
    // We can check by injecting slots and verifying they appear in the correct containers.
    const wrapperWithSlots = mount(MainLayout, {
      slots: {
        left: '<div data-test="left-slot">left</div>',
        center: '<div data-test="center-slot">center</div>',
        right: '<div data-test="right-slot">right</div>'
      }
    })
    expect(wrapperWithSlots.find('[data-test="left-slot"]').exists()).toBe(true)
    expect(wrapperWithSlots.find('[data-test="center-slot"]').exists()).toBe(true)
    expect(wrapperWithSlots.find('[data-test="right-slot"]').exists()).toBe(true)
  })
})
