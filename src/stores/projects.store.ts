import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectsService } from '@/services/projects.service'
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectStatus } from '@/types/project.types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeProjects = computed(() => 
    projects.value.filter(p => p.status === 'active')
  )

  const projectsStats = computed(() => {
    return {
      total: projects.value.length,
      active: projects.value.filter(p => p.status === 'active').length,
      completed: projects.value.filter(p => p.status === 'completed').length,
      paused: projects.value.filter(p => p.status === 'paused').length
    }
  })

  async function fetchProjects(silent = false) {
    if (!silent) loading.value = true
    try {
      projects.value = await projectsService.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createProject(dto: CreateProjectDTO) {
    loading.value = true
    try {
      const project = await projectsService.create(dto)
      projects.value.unshift(project)
      return project
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateProject(id: string, dto: UpdateProjectDTO) {
    loading.value = true
    try {
      const updated = await projectsService.update(id, dto)
      const idx = projects.value.findIndex(p => p.id === id)
      if (idx !== -1) projects.value[idx] = { ...projects.value[idx], ...updated }
      return updated
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(id: string) {
    loading.value = true
    try {
      await projectsService.delete(id)
      projects.value = projects.value.filter(p => p.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    projects,
    loading,
    error,
    activeProjects,
    projectsStats,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    projectsService
  }
})
