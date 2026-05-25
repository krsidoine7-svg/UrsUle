import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { tasksService } from '@/services/tasks.service'
import { webhookService } from '@/services/webhook.service'
import type { Task, TaskFilters, CreateTaskDTO, UpdateTaskDTO, TimeSession } from '@/types/task.types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeFilters = ref<TaskFilters>({})
  const timeSessions = ref<TimeSession[]>([])

  // Computed
  const todayTasks = computed(() => {
    const today = new Date().toDateString()
    return tasks.value.filter(t => 
      t.deadline && new Date(t.deadline).toDateString() === today
    )
  })

  const urgentTasks = computed(() => 
    tasks.value.filter(t => t.priority === 'urgent' && t.status !== 'done')
  )

  const overdueTasks = computed(() => 
    tasks.value.filter(t => 
      t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
    )
  )

  const pinnedTasks = computed(() => 
    tasks.value.filter(t => t.is_pinned)
  )

  // Actions
  async function fetchTasks(filters?: TaskFilters) {
    loading.value = true
    try {
      tasks.value = await tasksService.getAll(filters)
      activeFilters.value = filters || {}
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      loading.value = false
    }
  }

  function upsertTaskInState(task: Task, prepend = false) {
    const index = tasks.value.findIndex(t => t.id === task.id)
    if (index !== -1) {
      tasks.value[index] = {
        ...tasks.value[index],
        ...task,
        category: task.category !== undefined ? task.category : tasks.value[index].category,
        project: task.project !== undefined ? task.project : tasks.value[index].project,
        subtasks: task.subtasks !== undefined ? task.subtasks : tasks.value[index].subtasks,
        images: task.images !== undefined ? task.images : tasks.value[index].images,
        comments: task.comments !== undefined ? task.comments : tasks.value[index].comments,
      }
    } else {
      if (prepend) {
        tasks.value = [task, ...tasks.value]
      } else {
        tasks.value.push(task)
      }
    }
  }

  async function createTask(dto: CreateTaskDTO) {
    loading.value = true
    try {
      const task = await tasksService.create(dto)
      // Dédoublonnage et fusion de l'état réactif
      upsertTaskInState(task, true)
      
      const webhookUrl = webhookService.getGlobalWebhookUrl()
      if (webhookUrl) {
        // Lancé en arrière-plan pour ne pas bloquer l'UI
        webhookService.triggerWebhook(task, 'task_created', webhookUrl).catch(console.error)
      }
      
      return task
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTask(id: string, dto: UpdateTaskDTO) {
    loading.value = true
    try {
      const updated = await tasksService.update(id, dto)
      // Dédoublonnage et fusion de l'état réactif
      upsertTaskInState(updated, false)
      
      const webhookUrl = webhookService.getGlobalWebhookUrl()
      if (webhookUrl) {
        if (dto.status === 'done') {
          // Lancé en arrière-plan
          webhookService.triggerWebhook(updated, 'task_completed', webhookUrl).catch(console.error)
        } else if (dto.status === 'rescheduled') {
          // Lancé en arrière-plan
          webhookService.triggerWebhook(updated, 'task_rescheduled', webhookUrl).catch(console.error)
        }
      }
      
      return updated
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(id: string) {
    loading.value = true
    try {
      await tasksService.softDelete(id)
      const now = new Date().toISOString()
      
      // Marquer la tâche et ses enfants comme supprimés localement
      tasks.value.forEach(t => {
        if (t.id === id || t.parent_task_id === id) {
          t.deleted_at = now
        }
      })
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function restoreTask(id: string) {
    loading.value = true
    try {
      await tasksService.restore(id)
      const idx = tasks.value.findIndex(t => t.id === id)
      if (idx !== -1) tasks.value[idx].deleted_at = undefined
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePermanentTask(id: string) {
    loading.value = true
    try {
      await tasksService.deletePermanent(id)
      tasks.value = tasks.value.filter(t => t.id !== id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function emptyTrash() {
    loading.value = true
    try {
      const deletedTaskIds = tasks.value
        .filter(t => t.deleted_at)
        .map(t => t.id)
      
      if (deletedTaskIds.length > 0) {
        await tasksService.deletePermanentMany(deletedTaskIds)
        tasks.value = tasks.value.filter(t => !t.deleted_at)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addComment(taskId: string, content: string) {
    try {
      const comment = await tasksService.addComment(taskId, content)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        if (!task.comments) task.comments = []
        task.comments.push(comment)
      }
      return comment
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  async function addTimeSession(taskId: string, durationMinutes: number) {
    try {
      await tasksService.addTimeSession(taskId, durationMinutes)
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.actual_duration_minutes = (task.actual_duration_minutes || 0) + durationMinutes
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
      throw e
    }
  }

  async function fetchTimeSessions(limit = 10) {
    try {
      timeSessions.value = await tasksService.getTimeSessions(limit)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function updateSubtasksOrder(parentId: string, subtaskIds: string[]) {
    try {
      // Mise à jour locale immédiate pour le feedback UI
      subtaskIds.forEach((id, index) => {
        const task = tasks.value.find(t => t.id === id)
        if (task) task.sort_order = index
      })
      
      await tasksService.updateSubtasksOrder(subtaskIds)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  // Realtime handlers
  async function handleRealtimeChange(payload: any) {
    console.log('Realtime change received:', payload)
    const taskId = payload.new?.id || payload.old?.id
    if (!taskId) return

    if (payload.eventType === 'INSERT') {
      const existing = tasks.value.find(t => t.id === taskId)
      if (existing && existing.category) {
        // Déjà existant avec relations, simple mise à jour réactive
        upsertTaskInState(payload.new as Task, true)
        return
      }

      try {
        const fullTask = await tasksService.getById(taskId)
        upsertTaskInState(fullTask, true)
      } catch (e) {
        console.error('Error fetching full task on realtime INSERT:', e)
        upsertTaskInState(payload.new as Task, true)
      }
    } else if (payload.eventType === 'UPDATE') {
      try {
        const fullTask = await tasksService.getById(taskId)
        upsertTaskInState(fullTask, false)
      } catch (e) {
        console.error('Error fetching full task on realtime UPDATE:', e)
        upsertTaskInState(payload.new as Task, false)
      }
    } else if (payload.eventType === 'DELETE') {
      tasks.value = tasks.value.filter(t => t.id !== taskId)
    }
  }

  function subscribeToTasks() {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => handleRealtimeChange(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  // Getters
  const rootTasks = computed(() => 
    tasks.value.filter(t => !t.parent_task_id && !t.deleted_at)
  )

  const getSubtasks = (parentId: string) => {
    return tasks.value.filter(t => t.parent_task_id === parentId && !t.deleted_at)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }

  return { 
    tasks, 
    loading, 
    error, 
    activeFilters,
    timeSessions,
    todayTasks, 
    urgentTasks, 
    overdueTasks, 
    pinnedTasks,
    rootTasks,
    getSubtasks,
    fetchTasks, 
    createTask, 
    updateTask, 
    deleteTask,
    restoreTask,
    deletePermanentTask,
    emptyTrash,
    addComment,
    addTimeSession,
    fetchTimeSessions,
    updateSubtasksOrder,
    subscribeToTasks
  }
})
