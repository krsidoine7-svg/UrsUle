export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon: string
  status: ProjectStatus
  deadline?: string
  budget?: number
  budget_currency: string
  notes?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Relations
  tasks?: any[]
}

export interface CreateProjectDTO {
  name: string
  description?: string
  color?: string
  icon?: string
  status?: ProjectStatus
  deadline?: string
  budget?: number
  budget_currency?: string
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
  notes?: string
  metadata?: Record<string, any>
}
