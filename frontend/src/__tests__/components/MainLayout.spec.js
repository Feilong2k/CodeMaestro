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

  it('should render left, default, and right slots', () => {
    const wrapper = mount(MainLayout, {
      slots: {
        left: '<div class="left-slot">Left Content</div>',
        default: '<div class="default-slot">Main Content</div>',
        right: '<div class="right-slot">Right Content</div>'
      }
    })
    
    const leftSlot = wrapper.find('.left-slot')
    expect(leftSlot.exists()).toBe(true)
    expect(leftSlot.text()).toBe('Left Content')
    
    const defaultSlot = wrapper.find('.default-slot')
    expect(defaultSlot.exists()).toBe(true)
    expect(defaultSlot.text()).toBe('Main Content')
    
    const rightSlot = wrapper.find('.right-slot')
    expect(rightSlot.exists()).toBe(true)
    expect(rightSlot.text()).toBe('Right Content')
  })

  it('should have sidebars hidden on mobile and visible on large screens by default', () => {
    const wrapper = mount(MainLayout)
    const leftAside = wrapper.find('aside.lg\\:col-span-3')
    expect(leftAside.exists()).toBe(true)
    expect(leftAside.classes()).toContain('hidden')
    expect(leftAside.classes()).toContain('lg:block')
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

  it('should show left sidebar on mobile when showLeftOnMobile prop is true', () => {
    const wrapper = mount(MainLayout, {
      props: {
        showLeftOnMobile: true
      }
    })
    const leftAside = wrapper.find('aside.lg\\:col-span-3')
    expect(leftAside.exists()).toBe(true)
    // Should NOT have 'hidden' class
    expect(leftAside.classes()).not.toContain('hidden')
    // 'lg:block' should be present (always added)
    expect(leftAside.classes()).toContain('lg:block')
  })

  it('should show right sidebar on mobile when showRightOnMobile prop is true', () => {
    const wrapper = mount(MainLayout, {
      props: {
        showRightOnMobile: true
      }
    })
    const rightAside = wrapper.find('aside.lg\\:col-span-3.order-3')
    expect(rightAside.exists()).toBe(true)
    expect(rightAside.classes()).not.toContain('hidden')
    expect(rightAside.classes()).toContain('lg:block')
  })
})
