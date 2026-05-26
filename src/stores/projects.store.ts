import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
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

  async function handleRealtimeChange(payload: any) {
    console.log('Projects Realtime change received:', payload)
    const projectId = payload.new?.id || payload.old?.id
    if (!projectId) return

    if (payload.eventType === 'INSERT') {
      const idx = projects.value.findIndex(p => p.id === projectId)
      if (idx === -1) {
        projects.value.unshift(payload.new as Project)
      }
    } else if (payload.eventType === 'UPDATE') {
      const idx = projects.value.findIndex(p => p.id === projectId)
      if (idx !== -1) {
        projects.value[idx] = { ...projects.value[idx], ...payload.new }
      }
    } else if (payload.eventType === 'DELETE') {
      projects.value = projects.value.filter(p => p.id !== projectId)
    }
  }

  function subscribeToProjects() {
    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => handleRealtimeChange(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
    projectsService,
    subscribeToProjects
  }
})
