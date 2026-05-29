import { supabase } from './supabase'
import type { Note, CreateNoteDTO, UpdateNoteDTO, NoteFolder } from '@/types/brain.types'

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export const notesService = {
  async getAll(folderId?: string | null, tags?: string[], search?: string): Promise<Note[]> {
    let query = supabase
      .from('notes')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (folderId !== undefined) {
      if (folderId === null) {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', folderId)
      }
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Note[]
  },

  /** Récupère toutes les notes soft-supprimées (Corbeille) */
  async getDeleted(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) throw error
    return data as Note[]
  },

  async getById(id: string): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Note
  },

  async getBySlug(slug: string): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data as Note
  },

  async create(dto: CreateNoteDTO): Promise<Note> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    // Ajouter un identifiant aléatoire pour éviter les collisions de slug
    const slug = dto.slug || `${generateSlug(dto.title)}-${Math.random().toString(36).substring(2, 6)}`
    
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...dto, slug, user_id: user.id })
      .select('*')
      .single()
      
    if (error) throw error
    return data as Note
  },

  async update(id: string, dto: UpdateNoteDTO): Promise<Note> {
    let slug = dto.slug
    if (dto.title && !slug) {
      // On ajoute un bout de l'ID pour garantir l'unicité et éviter le conflit 409
      slug = `${generateSlug(dto.title)}-${id.split('-')[0]}`
    }

    const updateData = { ...dto, updated_at: new Date().toISOString() }
    if (slug) {
      updateData.slug = slug
    }

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()
      
    if (error) throw error
    return data as Note
  },

  /** Soft-delete : envoie une note à la corbeille */
  async softDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      
    if (error) throw error
  },

  /** Restaure une note soft-supprimée */
  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) throw error
  },

  /** Suppression physique définitive (irréversible) */
  async deletePermanent(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Calcule l'impact de suppression d'une note :
   * backlinks entrants, flashcards associées et liens sortants.
   */
  async getDeletionImpact(id: string): Promise<{
    backlinks: { id: string; title: string }[]
    flashcardsCount: number
    outboundLinksCount: number
  }> {
    // Backlinks entrants (autres notes qui pointent vers celle-ci)
    const { data: inLinks } = await supabase
      .from('note_links')
      .select('source_note_id, notes!note_links_source_note_id_fkey(id, title)')
      .eq('target_note_id', id)
    
    const backlinks = (inLinks || []).map((l: any) => ({
      id: l.notes?.id || l.source_note_id,
      title: l.notes?.title || 'Note inconnue'
    }))

    // Liens sortants (notes vers lesquelles cette note pointe)
    const { data: outLinks } = await supabase
      .from('note_links')
      .select('id')
      .eq('source_note_id', id)
    
    const outboundLinksCount = (outLinks || []).length

    // Flashcards liées à cette note
    const { count: flashcardsCount } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('note_id', id)
      .is('deleted_at', null)

    return {
      backlinks,
      flashcardsCount: flashcardsCount || 0,
      outboundLinksCount
    }
  },

  // ─── Folders (conservé pour compatibilité) ──────────────────────
  async getFolders(): Promise<NoteFolder[]> {
    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      
    if (error) throw error
    return data as NoteFolder[]
  },

  async createFolder(name: string, parentId?: string): Promise<NoteFolder> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('note_folders')
      .insert({ name, parent_id: parentId || null, user_id: user.id })
      .select('*')
      .single()
      
    if (error) throw error
    return data as NoteFolder
  }
}
