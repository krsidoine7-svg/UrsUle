export interface UrsUleNote {
  id: string
  user_id?: string
  title: string
  content_html?: string
  excerpt?: string
  folder_id?: string | null
  linked_task_id?: string | null
  linked_project_id?: string | null
  is_pinned?: boolean
  created_at?: string
  updated_at?: string
}

export interface UrsUleBacklink {
  source_note_id: string
  target_note_id: string
  user_id?: string
}

export interface UrsUleGraphNode {
  id: string
  label: string
  folder_id?: string | null
  is_pinned?: boolean
  linked_type?: 'task' | 'project' | null
}

export interface UrsUleGraphEdge {
  source_note_id: string
  target_note_id: string
}

export interface UrsUleFlashcard {
  id: string
  user_id?: string
  note_id?: string | null
  folder_id?: string | null
  front: string
  back: string
  box: number
  next_review_at?: string
  last_reviewed_at?: string
  review_count?: number
  created_at?: string
  updated_at?: string
}

export interface UrsUleClientConfig {
  apiUrl: string
  token: string
}

export class UrsUleClient {
  private apiUrl: string
  private token: string

  constructor(config: UrsUleClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '')
    this.token = config.token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.apiUrl}${path}`
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      let errText = await response.text()
      try {
        const jsonErr = JSON.parse(errText)
        errText = jsonErr.error || errText
      } catch {
        // use raw text
      }
      throw new Error(`UrsUle API Error (${response.status}): ${errText}`)
    }

    return response.json()
  }

  // ─── NOTES API ──────────────────────────────────────────────
  async getNotes(params: { query?: string; tag?: string; folder_id?: string } = {}): Promise<{ notes: UrsUleNote[]; count: number }> {
    const searchParams = new URLSearchParams({ resource: 'notes' })
    if (params.query) searchParams.set('query', params.query)
    if (params.tag) searchParams.set('tag', params.tag)
    if (params.folder_id) searchParams.set('folder_id', params.folder_id)

    return this.request<{ notes: UrsUleNote[]; count: number }>(`/?${searchParams.toString()}`)
  }

  async getNote(id: string): Promise<{ note: UrsUleNote; backlinks: { outgoing: any[]; incoming: any[] } }> {
    return this.request<{ note: UrsUleNote; backlinks: any }>(`/?resource=note&id=${id}`)
  }

  async createNote(data: { title: string; content_html?: string; folder_id?: string | null; linked_task_id?: string | null; linked_project_id?: string | null; excerpt?: string }): Promise<{ note: UrsUleNote }> {
    return this.request<{ note: UrsUleNote }>('/?resource=notes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateNote(id: string, data: Partial<UrsUleNote>): Promise<{ note: UrsUleNote }> {
    return this.request<{ note: UrsUleNote }>(`/?resource=notes&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteNote(id: string): Promise<{ success: boolean; id: string }> {
    return this.request<{ success: boolean; id: string }>(`/?resource=notes&id=${id}`, {
      method: 'DELETE',
    })
  }

  // ─── BACKLINKS API ──────────────────────────────────────────
  async getBacklinks(noteId?: string): Promise<{ backlinks: UrsUleBacklink[] }> {
    const searchParams = new URLSearchParams({ resource: 'backlinks' })
    if (noteId) searchParams.set('note_id', noteId)
    return this.request<{ backlinks: UrsUleBacklink[] }>(`/?${searchParams.toString()}`)
  }

  // ─── GRAPH API ──────────────────────────────────────────────
  async getGraph(): Promise<{ nodes: UrsUleGraphNode[]; edges: UrsUleGraphEdge[]; count: number }> {
    return this.request<{ nodes: UrsUleGraphNode[]; edges: UrsUleGraphEdge[]; count: number }>('/?resource=graph')
  }

  // ─── FLASHCARDS API ─────────────────────────────────────────
  async getFlashcards(params: { folder_id?: string; due?: boolean } = {}): Promise<{ flashcards: UrsUleFlashcard[]; count: number }> {
    const searchParams = new URLSearchParams({ resource: 'flashcards' })
    if (params.folder_id) searchParams.set('folder_id', params.folder_id)
    if (params.due !== undefined) searchParams.set('due', String(params.due))
    return this.request<{ flashcards: UrsUleFlashcard[]; count: number }>(`/?${searchParams.toString()}`)
  }

  async createFlashcard(data: { front: string; back: string; note_id?: string | null; folder_id?: string | null; tags?: string[] }): Promise<{ flashcard: UrsUleFlashcard }> {
    return this.request<{ flashcard: UrsUleFlashcard }>('/?resource=flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async reviewFlashcard(flashcardId: string, quality: number): Promise<{ flashcard: UrsUleFlashcard; next_review_at: string }> {
    return this.request<{ flashcard: UrsUleFlashcard; next_review_at: string }>('/review?resource=flashcards', {
      method: 'POST',
      body: JSON.stringify({ flashcard_id: flashcardId, quality }),
    })
  }
}
