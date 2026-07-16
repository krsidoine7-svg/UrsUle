export interface NoteFolder {
  id: string
  user_id: string
  parent_id?: string
  name: string
  icon?: string
  color?: string
  sort_order: number
  deleted_at?: string
  created_at: string
}

export type SharePermission = 'none' | 'read' | 'comment' | 'write'

export interface Note {
  id: string
  user_id: string
  folder_id?: string
  title: string
  content?: string
  content_json?: any
  slug?: string
  is_journal: boolean
  journal_date?: string
  is_pinned: boolean
  is_archived: boolean
  is_template: boolean
  tags: string[]
  color?: string
  icon?: string
  word_count: number
  read_time_minutes: number
  linked_task_id?: string
  linked_project_id?: string
  share_token?: string
  share_permission: SharePermission
  shared_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface NoteLink {
  id: string
  source_note_id: string
  target_note_id: string
  context?: string
  deleted_at?: string
  created_at: string
}

export type CardType = 'qa' | 'truefalse' | 'cloze' | 'image'

export interface Flashcard {
  id: string
  user_id: string
  note_id?: string
  deck_name: string
  question: string
  answer: string
  card_type: CardType
  repetitions: number
  ease_factor: number
  interval_days: number
  due_date: string
  last_reviewed_at?: string
  total_reviews: number
  correct_reviews: number
  deleted_at?: string
  created_at: string
}

export interface FlashcardReview {
  id: string
  flashcard_id: string
  user_id: string
  rating: number // 0 to 5
  time_taken_seconds?: number
  deleted_at?: string
  reviewed_at: string
}

export interface MindMap {
  id: string
  user_id: string
  note_id?: string
  title: string
  nodes: any[] // array of nodes
  edges: any[] // array of edges
  deleted_at?: string
  created_at: string
  updated_at: string
}

export type QuizTrigger = 'task_complete' | 'project_complete' | 'manual' | 'scheduled'
export type QuizQuestionType = 'truefalse' | 'calc' | 'open' | 'choice' | 'timer'

export interface NoteQuiz {
  id: string
  user_id: string
  note_id?: string
  task_id?: string
  project_id?: string
  trigger: QuizTrigger
  question: string
  question_type: QuizQuestionType
  correct_answer?: string
  choices?: any
  time_limit_seconds?: number
  is_answered: boolean
  user_answer?: string
  is_correct?: boolean
  time_taken_seconds?: number
  deleted_at?: string
  created_at: string
  answered_at?: string
}

export interface NoteShare {
  id: string
  note_id: string
  owner_id: string
  email?: string | null
  shared_with_email?: string | null
  permission: SharePermission
  share_token?: string | null
  custom_slug?: string | null
  target_block_id?: string | null
  allowed_views: {
    note: boolean
    graph: boolean
    mindmap: boolean
    flashcards: boolean
  }
  expires_at?: string | null
  deleted_at?: string
  created_at: string
}

export interface NoteComment {
  id: string
  note_id: string
  user_id?: string | null
  author_name: string
  content: string
  created_at: string
  deleted_at?: string
  is_owner?: boolean
}

export interface CreateNoteDTO {
  title: string
  content?: string
  folder_id?: string | null
  slug?: string
  is_journal?: boolean
  journal_date?: string
  is_pinned?: boolean
  tags?: string[]
  linked_task_id?: string | null
  linked_project_id?: string | null
}

export interface UpdateNoteDTO extends Partial<CreateNoteDTO> {
  content_json?: any
  is_archived?: boolean
  word_count?: number
  read_time_minutes?: number
  linked_task_id?: string | null
  linked_project_id?: string | null
}
