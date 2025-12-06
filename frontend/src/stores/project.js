import { defineStore } from 'pinia'
import { client as apiClient } from '../api'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  }),

  getters: {
    hasProjects: (state) => state.projects.length > 0,
    currentProjectId: (state) => state.currentProject?.id
  },

  actions: {
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/projects')
        this.projects = response.data
        
        // Set current project if not set
        if (!this.currentProject && this.projects.length > 0) {
          this.currentProject = this.projects[0]
        }
      } catch (error) {
        this.error = error.message
        console.error('Failed to fetch projects:', error)
      } finally {
        this.loading = false
      }
    },

    async createProject(projectData) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/projects', projectData)
        const newProject = response.data
        
        this.projects.push(newProject)
        return newProject
      } catch (error) {
        this.error = error.message
        console.error('Failed to create project:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async importFromGit(gitUrl, name) {
      this.loading = true
      this.error = null
      try {
        // Assuming backend supports import, or we create with git_url
        const response = await apiClient.post('/projects', { git_url: gitUrl, name, path: `./projects/${name}` }) 
        const newProject = response.data
        
        this.projects.push(newProject)
        return newProject
      } catch (error) {
        this.error = error.message
        console.error('Failed to import project:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    setCurrentProject(project) {
      this.currentProject = project
    },

    async switchProject(projectId) {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) {
        throw new Error(`Project with id ${projectId} not found`)
      }
      
      this.setCurrentProject(project)
    },

    async deleteProject(projectId) {
      if (projectId === 1) {
        throw new Error('Cannot delete the default project')
      }

      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/projects/${projectId}`)
        
        const index = this.projects.findIndex(p => p.id === projectId)
        if (index !== -1) {
          this.projects.splice(index, 1)
          
          // If current project is deleted, switch to default
          if (this.currentProject?.id === projectId) {
            const defaultProject = this.projects.find(p => p.id === 1)
            if (defaultProject) {
              this.setCurrentProject(defaultProject)
            }
          }
        }
      } catch (error) {
        this.error = error.message
        console.error('Failed to delete project:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  },

  persist: {
    key: 'codemaestro-project-store',
    paths: ['currentProject']
  }
})
