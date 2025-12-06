import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentView: 'plan' // 'plan' or 'act'
  }),

  actions: {
    setCurrentView(view) {
      if (view === 'plan' || view === 'act') {
        this.currentView = view
      }
    }
  }
})
