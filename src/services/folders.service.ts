import { supabase } from './supabase'
import type { NoteFolder } from '@/types/brain.types'

export interface CreateFolderDTO {
  name: string
  parent_id?: string | null
  color?: string
  icon?: string
}

export interface UpdateFolderDTO {
  name?: string
  parent_id?: string | null
  color?: string
  icon?: string
  sort_order?: number
}

// Interface utilitaire pour l'arbre
export interface FolderTreeNode extends NoteFolder {
  children: FolderTreeNode[]
  isExpanded?: boolean
}

export const foldersService = {
  /** Récupère tous les dossiers ACTIFS (non supprimés) */
  async getAll(): Promise<NoteFolder[]> {
    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data as NoteFolder[]
  },

  /** Récupère tous les dossiers soft-supprimés (Corbeille) */
  async getDeleted(): Promise<NoteFolder[]> {
    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return data as NoteFolder[]
  },

  async create(dto: CreateFolderDTO): Promise<NoteFolder> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('note_folders')
      .insert({
        ...dto,
        user_id: user.user.id
      })
      .select('*')
      .single()

    if (error) throw error
    return data as NoteFolder
  },

  async update(id: string, dto: UpdateFolderDTO): Promise<NoteFolder> {
    const { data, error } = await supabase
      .from('note_folders')
      .update(dto)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as NoteFolder
  },

  /** Soft-delete : envoie un dossier (et ses sous-dossiers via trigger) à la corbeille */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('note_folders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  /** Restaure un dossier soft-supprimé (et ses sous-dossiers via trigger) */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('note_folders')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) throw error
  },

  /** Suppression physique définitive (action irréversible) */
  async deletePermanent(id: string): Promise<void> {
    const { error } = await supabase
      .from('note_folders')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  buildTree(folders: NoteFolder[]): FolderTreeNode[] {
    const map = new Map<string, FolderTreeNode>()
    const roots: FolderTreeNode[] = []

    // 1. Initialiser la map (ne garder que les dossiers actifs)
    folders
      .filter(f => !f.deleted_at)
      .forEach(folder => {
        map.set(folder.id, { ...folder, children: [], isExpanded: false })
      })

    // 2. Construire l'arbre
    folders
      .filter(f => !f.deleted_at)
      .forEach(folder => {
        const node = map.get(folder.id)!
        if (folder.parent_id && map.has(folder.parent_id)) {
          map.get(folder.parent_id)!.children.push(node)
        } else {
          roots.push(node)
        }
      })

    return roots
  }
}
