import { supabase } from './supabase'
import type { Note, CreateNoteDTO, UpdateNoteDTO, NoteFolder, NoteShare, NoteComment } from '@/types/brain.types'

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
  async getAll(
    folderId?: string | null, 
    tags?: string[], 
    search?: string, 
    pagination?: { limit?: number; offset?: number }
  ): Promise<Note[]> {
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

    if (pagination?.limit) {
      const offset = pagination.offset ?? 0
      query = query.range(offset, offset + pagination.limit - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Note[]
  },

  /** Récupère les notes de façon paginée avec le nombre total pour scroll infini et grilles */
  async getPaginated(options: {
    folderId?: string | null
    tags?: string[]
    search?: string
    limit: number
    offset: number
  }): Promise<{ notes: Note[]; total: number }> {
    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (options.folderId !== undefined) {
      if (options.folderId === null) {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', options.folderId)
      }
    }

    if (options.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags)
    }

    if (options.search) {
      query = query.ilike('title', `%${options.search}%`)
    }

    query = query.range(options.offset, options.offset + options.limit - 1)

    const { data, error, count } = await query
    if (error) throw error
    return { notes: data as Note[], total: count ?? 0 }
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

  async linkToTask(id: string, taskId: string | null): Promise<Note> {
    return this.update(id, { linked_task_id: taskId })
  },

  async linkToProject(id: string, projectId: string | null): Promise<Note> {
    return this.update(id, { linked_project_id: projectId })
  },

  async getBacklinks(noteId: string): Promise<Note[]> {
    const { data: inLinks, error } = await supabase
      .from('note_links')
      .select('source_note_id, notes!note_links_source_note_id_fkey(*)')
      .eq('target_note_id', noteId)

    if (error) throw error
    return (inLinks || []).map((l: any) => l.notes as Note).filter((n: any) => n && !n.deleted_at)
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
  },

  async searchNotes(query: string, userId?: string): Promise<Note[]> {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')
      targetUserId = user.id
    }

    // Essayer d'abord la recherche textSearch (Full-Text Search) ou fallback sur ilike si échec
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, tags, folder_id, is_journal, journal_date, updated_at')
        .eq('user_id', targetUserId)
        .is('deleted_at', null)
        .textSearch('title,content' as any, query, {
          type: 'websearch',
          config: 'french'
        })
        .limit(30)

      if (!error && data && data.length > 0) return data as Note[]
    } catch (e) {
      console.warn('textSearch non disponible ou vide, fallback sur ilike:', e)
    }

    // Fallback robuste via .or(title.ilike,content.ilike)
    const cleanQ = query.replace(/[%_]/g, '')
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, tags, folder_id, is_journal, journal_date, updated_at')
      .eq('user_id', targetUserId)
      .is('deleted_at', null)
      .or(`title.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%`)
      .order('updated_at', { ascending: false })
      .limit(30)

    if (error) throw error
    return data as Note[]
  },

  // ==========================================
  // SHARED NOTES & PERMISSIONS (BRAIN-F10)
  // ==========================================

  async getSharesByNote(noteId: string): Promise<NoteShare[]> {
    const { data, error } = await supabase
      .from('note_shares')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as NoteShare[]
  },

  async createShareLink(
    noteId: string,
    options: {
      permission: 'read' | 'comment' | 'write' | 'none'
      allowed_views?: { note: boolean; graph: boolean; mindmap: boolean; flashcards: boolean }
      expires_in_days?: number | null
      custom_slug?: string | null
      target_block_id?: string | null
    }
  ): Promise<NoteShare> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    let expires_at: string | null = null
    if (options.expires_in_days && options.expires_in_days > 0) {
      const d = new Date()
      d.setDate(d.getDate() + options.expires_in_days)
      expires_at = d.toISOString()
    }

    const { data, error } = await supabase
      .from('note_shares')
      .insert({
        note_id: noteId,
        owner_id: user.id,
        permission: options.permission || 'read',
        allowed_views: options.allowed_views || { note: true, graph: true, mindmap: true, flashcards: true },
        expires_at,
        custom_slug: options.custom_slug || null,
        target_block_id: options.target_block_id || null
      })
      .select('*')
      .single()

    if (error) throw error
    return data as NoteShare
  },

  async inviteCollaborator(
    noteId: string,
    email: string,
    permission: 'read' | 'comment' | 'write' | 'none',
    allowedViews?: { note: boolean; graph: boolean; mindmap: boolean; flashcards: boolean }
  ): Promise<NoteShare> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('note_shares')
      .insert({
        note_id: noteId,
        owner_id: user.id,
        email: email.trim().toLowerCase(),
        permission: permission || 'read',
        allowed_views: allowedViews || { note: true, graph: true, mindmap: true, flashcards: true }
      })
      .select('*')
      .single()

    if (error) throw error
    return data as NoteShare
  },

  async updateShare(shareId: string, updates: Partial<NoteShare>): Promise<NoteShare> {
    // Ne pas envoyer updated_at manuellement : le trigger DB s'en charge
    // Retirer les champs non-modifiables pour éviter les erreurs de schema cache
    const { id, created_at, updated_at, share_token, owner_id, note_id, ...safeUpdates } = updates as any
    
    const { data, error } = await supabase
      .from('note_shares')
      .update(safeUpdates)
      .eq('id', shareId)
      .select('*')
      .single()

    if (error) throw error
    return data as NoteShare
  },

  async deleteShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('note_shares')
      .delete()
      .eq('id', shareId)

    if (error) throw error
  },

  // --- RPC Wrappers (Pour accès public /share/:token ou :slug) ---

  async getSharedNoteByToken(tokenOrSlug: string): Promise<{ note: Note; share: NoteShare; owner_name: string }> {
    const { data, error } = await supabase.rpc('get_shared_note_by_token', {
      token_or_slug: tokenOrSlug
    })

    if (error) throw error

    // --- Purge et filtrage côté service pour le partage par bloc ou sections restreintes ---
    if (data && data.note && data.note.content) {
      const share = data.share as NoteShare
      let contentHtml = data.note.content as string

      // 1. Si un target_block_id est spécifié, on isole uniquement ce bloc
      if (share.target_block_id) {
        if (typeof window !== 'undefined') {
          const doc = new DOMParser().parseFromString(contentHtml, 'text/html')
          const targetElement = doc.getElementById(share.target_block_id) || doc.querySelector(`[data-block-id="${share.target_block_id}"]`)
          if (targetElement) {
            contentHtml = `<div class="isolated-shared-block p-4 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">${targetElement.outerHTML}</div>`
          } else {
            contentHtml = `<p class="italic text-neutral-400 p-4 border border-dashed rounded-xl">Le bloc partagé (${share.target_block_id}) est introuvable dans ce document.</p>`
          }
        }
      }

      // 2. Remplacement automatique des sections data-restricted="true" par le badge d'alerte
      if (contentHtml.includes('data-restricted="true"') && typeof window !== 'undefined') {
        const doc = new DOMParser().parseFromString(contentHtml, 'text/html')
        const restrictedElements = doc.querySelectorAll('[data-restricted="true"]')
        restrictedElements.forEach(el => {
          const badge = doc.createElement('div')
          badge.className = 'p-3.5 my-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 select-none'
          badge.innerHTML = `<span class="text-base">🔒</span> <span>Section restreinte — accès limité par le propriétaire du document</span>`
          el.replaceWith(badge)
        })
        contentHtml = doc.body.innerHTML
      }

      data.note.content = contentHtml
    }

    return data
  },

  async updateSharedNoteByToken(tokenOrSlug: string, title: string, content: string): Promise<{ success: boolean; updated_at: string }> {
    const { data, error } = await supabase.rpc('update_shared_note_by_token', {
      token_or_slug: tokenOrSlug,
      new_title: title,
      new_content: content
    })

    if (error) throw error
    return data
  },

  async getSharedNoteComments(tokenOrSlug: string): Promise<NoteComment[]> {
    const { data, error } = await supabase.rpc('get_shared_note_comments_by_token', {
      token_or_slug: tokenOrSlug
    })

    if (error) throw error
    return data || []
  },

  async createSharedNoteComment(tokenOrSlug: string, authorName: string, content: string): Promise<NoteComment> {
    const { data, error } = await supabase.rpc('create_shared_note_comment_by_token', {
      token_or_slug: tokenOrSlug,
      author_name_param: authorName,
      content_param: content
    })

    if (error) throw error
    return data
  },

  async getSharedNoteGraph(tokenOrSlug: string): Promise<{ nodes: any[]; edges: any[] }> {
    const { data, error } = await supabase.rpc('get_shared_note_graph_by_token', {
      token_or_slug: tokenOrSlug
    })

    if (error) throw error
    return data || { nodes: [], edges: [] }
  },

  async getSharedNoteFlashcards(tokenOrSlug: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_shared_note_flashcards_by_token', {
      token_or_slug: tokenOrSlug
    })

    if (error) throw error
    return data || []
  }
}
