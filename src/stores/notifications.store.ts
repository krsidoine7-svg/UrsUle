import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from './auth.store'
import type { Notification, CreateNotificationDTO } from '@/types/notification.types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const isLoading = ref(false)
  const authStore = useAuthStore()

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.is_read).length
  })

  async function fetchNotifications() {
    if (!authStore.user) return

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      if (data) {
        notifications.value = data as Notification[]
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      // Optimistic update
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        notifications.value[index].is_read = true
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert optimistic update on error
      await fetchNotifications()
    }
  }

  async function markAllAsRead() {
    if (!authStore.user) return

    try {
      // Optimistic update
      notifications.value.forEach(n => n.is_read = true)

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', authStore.user.id)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      await fetchNotifications()
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      // Optimistic update
      notifications.value = notifications.value.filter(n => n.id !== notificationId)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting notification:', error)
      await fetchNotifications()
    }
  }
  
  async function createNotification(dto: CreateNotificationDTO) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...dto,
          type: dto.type || 'info',
          is_read: false
        }])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        notifications.value.unshift(data as Notification)
      }
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Set up realtime subscription
  function subscribeToNotifications() {
    if (!authStore.user) return null

    return supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${authStore.user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification
            notifications.value.unshift(newNotif)
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as Notification
            const index = notifications.value.findIndex(n => n.id === updatedNotif.id)
            if (index !== -1) {
              notifications.value[index] = updatedNotif
            }
          } else if (payload.eventType === 'DELETE') {
            notifications.value = notifications.value.filter(n => n.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  return {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    subscribeToNotifications
  }
})
