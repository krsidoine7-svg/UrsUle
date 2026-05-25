import { supabase } from './supabase'
import type { Category } from '@/types/user.types'

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data as Category[]
  },

  async create(name: string, color: string, icon = 'folder'): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, icon })
      .select()
      .single()
    
    if (error) throw error
    return data as Category
  },

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Category
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
