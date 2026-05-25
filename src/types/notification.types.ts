export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  related_entity_id?: string
  related_entity_type?: string
  created_at: string
  updated_at: string
}

export interface CreateNotificationDTO {
  user_id: string
  title: string
  message: string
  type?: NotificationType
  related_entity_id?: string
  related_entity_type?: string
}
