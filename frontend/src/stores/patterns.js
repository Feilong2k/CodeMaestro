import { defineStore } from 'pinia'
import * as patternsApi from '../api/patterns'

export const usePatternsStore = defineStore('patterns', {
  state: () => ({
    patterns: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchPatterns(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await patternsApi.search(params)
        this.patterns = response.data
      } catch (error) {
        this.error = error.message || 'Failed to fetch patterns'
        console.error('Error fetching patterns:', error)
      } finally {
        this.loading = false
      }
    },

    async searchPatterns(query) {
      return this.fetchPatterns({ q: query })
    },

    async createPattern(data) {
      this.loading = true
      this.error = null
      try {
        const response = await patternsApi.create(data)
        this.patterns.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message || 'Failed to create pattern'
        console.error('Error creating pattern:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deletePattern(id) {
      this.loading = true
      this.error = null
      try {
        await patternsApi.remove(id)
        this.patterns = this.patterns.filter(p => p.id !== id)
      } catch (error) {
        this.error = error.message || 'Failed to delete pattern'
        console.error('Error deleting pattern:', error)
      } finally {
        this.loading = false
      }
    }
  }
})
