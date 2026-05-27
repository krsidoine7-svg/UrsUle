import { supabase } from './supabase'
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project.types'

export const projectsService = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(id, status)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as any[]
  },

  async getById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(*, project:projects(*), category:categories(*))
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as any
  },

  async create(dto: CreateProjectDTO): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('projects')
      .insert({ ...dto, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async update(id: string, dto: UpdateProjectDTO): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as any
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }
}
