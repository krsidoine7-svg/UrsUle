import { supabase } from './supabase'
import type { Task, CreateTaskDTO, UpdateTaskDTO, TaskFilters } from '@/types/task.types'

export const tasksService = {
  // Récupérer toutes les tâches de l'utilisateur (non supprimées)
  async getAll(filters?: TaskFilters): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        category:categories(id, name, color, icon),
        project:projects(id, name, color),
        subtasks:tasks!parent_task_id(id, title, status, sort_order),
        images:task_images(id, storage_path, filename),
        comments:task_comments(*, user:profiles(id, full_name, avatar_url))
      `)
      .order('created_at', { ascending: false })

    // Gestion de la corbeille
    if (filters?.showTrash) {
      query = query.not('deleted_at', 'is', null)
    } else {
      query = query.is('deleted_at', null)
    }

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.priority) query = query.eq('priority', filters.priority)
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId)
    if (filters?.projectId) query = query.eq('project_id', filters.projectId)
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query
    if (error) throw error
    return data as unknown as Task[]
  },

  async getById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, category:categories(*), project:projects(*), subtasks:tasks!parent_task_id(*), comments:task_comments(*), images:task_images(*)')
      .eq('id', id)
      .order('sort_order', { foreignTable: 'tasks', ascending: true })
      .single()
    if (error) throw error
    return data as unknown as Task
  },

  async create(dto: CreateTaskDTO): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...dto, user_id: user.id })
      .select(`
        *,
        category:categories(id, name, color, icon),
        project:projects(id, name, color),
        subtasks:tasks!parent_task_id(id, title, status, sort_order),
        images:task_images(id, storage_path, filename),
        comments:task_comments(*, user:profiles(id, full_name, avatar_url))
      `)
      .single()
    if (error) throw error
    return data as unknown as Task
  },

  async update(id: string, dto: UpdateTaskDTO): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name, color, icon),
        project:projects(id, name, color),
        subtasks:tasks!parent_task_id(id, title, status, sort_order),
        images:task_images(id, storage_path, filename),
        comments:task_comments(*, user:profiles(id, full_name, avatar_url))
      `)
      .single()
    if (error) throw error
    return data as unknown as Task
  },

  async softDelete(id: string): Promise<void> {
    // Supprimer la tâche et ses sous-tâches (un niveau)
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .or(`id.eq.${id},parent_task_id.eq.${id}`)
    
    if (error) throw error
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: null })
      .eq('id', id)
    if (error) throw error
  },

  async deletePermanent(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async deletePermanentMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)
    if (error) throw error
  },

  async complete(id: string, appreciation?: string): Promise<Task> {
    return this.update(id, {
      status: 'done',
      completed_at: new Date().toISOString(),
      appreciation: appreciation as any ?? 'neutral'
    })
  },

  async addComment(taskId: string, content: string): Promise<any> {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, content })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async addTimeSession(taskId: string, durationMinutes: number): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('time_sessions')
      .insert({ 
        task_id: taskId, 
        user_id: user.id,
        duration_minutes: durationMinutes,
        started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
        ended_at: new Date().toISOString()
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Sous-tâches
  async getSubtasks(parentId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data as Task[]
  },

  async createSubtask(parentId: string, title: string): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non connecté')

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        parent_task_id: parentId,
        user_id: user.id,
        status: 'todo'
      })
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  async updateSubtasksOrder(subtaskIds: string[]): Promise<void> {
    if (subtaskIds.length === 0) return
    
    // On utilise Promise.all pour paralléliser les mises à jour
    // Dans un environnement de production, une fonction RPC serait préférable
    await Promise.all(
      subtaskIds.map((id, index) => 
        supabase
          .from('tasks')
          .update({ sort_order: index })
          .eq('id', id)
      )
    )
  },

  async getTimeSessions(limit = 10): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non connecté')

    const { data, error } = await supabase
      .from('time_sessions')
      .select(`
        *,
        task:tasks(id, title, category:categories(id, name, color))
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}
