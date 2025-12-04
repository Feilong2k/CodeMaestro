import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../../stores/appStore'

describe('appStore', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia())
  })

  it('should exist and be a Pinia store', () => {
    expect(useAppStore).toBeDefined()
    const store = useAppStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  it('should have initial currentView state as "plan"', () => {
    const store = useAppStore()
    expect(store.currentView).toBe('plan')
  })

  it('should have initial currentProject state', () => {
    const store = useAppStore()
    expect(store.currentProject).toBeDefined()
    expect(store.currentProject.name).toBe('Demo Project')
  })

  it('should allow changing currentView via setCurrentView', () => {
    const store = useAppStore()
    expect(store.currentView).toBe('plan')
    store.setCurrentView('act')
    expect(store.currentView).toBe('act')
    // Should ignore invalid values
    store.setCurrentView('invalid')
    expect(store.currentView).toBe('act') // unchanged
  })

  it('should allow changing currentProject via setCurrentProject', () => {
    const store = useAppStore()
    const newProject = { id: 'p2', name: 'New Project', description: 'Test' }
    store.setCurrentProject(newProject)
    expect(store.currentProject).toEqual(newProject)
  })
})
