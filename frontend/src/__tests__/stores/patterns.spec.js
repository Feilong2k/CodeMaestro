import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
// This import will fail initially (Red phase)
import { usePatternsStore } from '../../stores/patterns'
import * as patternsApi from '../../api/patterns'

// Mock the API
vi.mock('../../api/patterns', () => ({
  list: vi.fn(),
  create: vi.fn(),
  search: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  remove: vi.fn()
}))

describe('patternsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should exist and be a Pinia store', () => {
    const store = usePatternsStore()
    expect(store).toBeDefined()
    expect(store.$state).toBeDefined()
  })

  describe('initial state', () => {
    it('should have patterns as an empty array', () => {
      const store = usePatternsStore()
      expect(store.patterns).toEqual([])
    })

    it('should have loading state', () => {
      const store = usePatternsStore()
      expect(store.loading).toBe(false)
    })

    it('should have error state', () => {
      const store = usePatternsStore()
      expect(store.error).toBe(null)
    })
  })

  describe('actions', () => {
    it('fetchPatterns should load patterns', async () => {
      const mockPatterns = [
        { id: 1, title: 'Pattern 1', tags: ['js'] },
        { id: 2, title: 'Pattern 2', tags: ['css'] }
      ]
      patternsApi.list.mockResolvedValue({ data: mockPatterns })

      const store = usePatternsStore()
      await store.fetchPatterns()

      expect(store.patterns).toEqual(mockPatterns)
      expect(store.loading).toBe(false)
    })

    it('createPattern should add a pattern', async () => {
      const newPattern = { title: 'New Pattern', solution: '...' }
      const createdPattern = { ...newPattern, id: 3 }
      patternsApi.create.mockResolvedValue({ data: createdPattern })

      const store = usePatternsStore()
      store.patterns = [] // Start empty
      
      await store.createPattern(newPattern)

      expect(patternsApi.create).toHaveBeenCalledWith(newPattern)
      expect(store.patterns).toContainEqual(createdPattern)
    })

    it('searchPatterns should filter patterns', async () => {
      const searchResults = [{ id: 1, title: 'Search Result' }]
      patternsApi.search.mockResolvedValue({ data: searchResults })

      const store = usePatternsStore()
      await store.searchPatterns('query')

      expect(patternsApi.search).toHaveBeenCalledWith('query')
      expect(store.patterns).toEqual(searchResults)
    })
  })
})
