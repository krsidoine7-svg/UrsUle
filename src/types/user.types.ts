export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  timezone: string
  preferences: Record<string, unknown>
  deleted_at?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  is_system: boolean
  sort_order: number
  created_at: string
}
