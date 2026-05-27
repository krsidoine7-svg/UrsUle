import type { Project } from '@/types/project.types'
import type { Category, Profile } from '@/types/user.types'

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived' | 'rescheduled' | 'to_redo'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type AppreciationType = 'happy' | 'too_hard' | 'boring' | 'nothing_learned' | 'super_productive' | 'stressful' | 'enriching' | 'neutral'
export type ValidationType = 'calc' | 'question' | 'none'

export interface Task {
  id: string
  user_id: string
  project_id?: string
  category_id?: string
  parent_task_id?: string
  title: string
  description?: string
  description_json?: object
  status: TaskStatus
  priority: TaskPriority
  estimated_duration_minutes?: number
  actual_duration_minutes: number
  start_date?: string
  deadline?: string
  expiry_date?: string
  completed_at?: string
  recurrence_type?: RecurrenceType
  recurrence_config?: object
  is_pinned: boolean
  color?: string
  tags: string[]
  validation_type: ValidationType
  validation_question?: string
  validation_answer?: string
  validation_attempts: number
  appreciation?: AppreciationType
  webhook_url?: string
  deleted_at?: string
  created_at: string
  updated_at: string
  sort_order?: number
  // Relations jointes
  category?: Category
  project?: Project
  subtasks?: Task[]
  images?: TaskImage[]
  comments?: TaskComment[]
}

export interface TaskImage {
  id: string
  task_id: string
  user_id: string
  storage_path: string
  filename: string
  size_bytes?: number
  mime_type?: string
  created_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: Profile
}

export interface CreateTaskDTO {
  title: string
  description?: string | null
  description_json?: object | null
  status?: TaskStatus
  priority?: TaskPriority
  category_id?: string
  project_id?: string | null
  parent_task_id?: string | null
  deadline?: string | null
  estimated_duration_minutes?: number | null
  recurrence_type?: RecurrenceType
  validation_type?: ValidationType
  validation_question?: string | null
  validation_answer?: string | null
  is_pinned?: boolean
  tags?: string[]
  sort_order?: number
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  actual_duration_minutes?: number
  completed_at?: string
  appreciation?: AppreciationType
  validation_attempts?: number
  deleted_at?: string
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  categoryId?: string
  projectId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  isPinned?: boolean
  showTrash?: boolean
}
export interface TimeSession {
  id: string
  task_id: string
  user_id: string
  duration_minutes: number
  started_at: string
  ended_at: string
  created_at: string
  task?: Partial<Task>
}
