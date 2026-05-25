import { supabase } from './supabase'
import type { Task } from '@/types/task.types'
import { useAuthStore } from '@/stores/auth.store'

export type WebhookEvent = 'task_created' | 'task_completed' | 'task_overdue' | 'task_rescheduled' | 'test'

export interface WebhookLog {
  id: string
  timestamp: string
  url: string
  event: WebhookEvent
  success: boolean
  error?: string
}

export const webhookService = {
  async triggerWebhook(task: Partial<Task>, event: WebhookEvent, webhookUrl: string) {
    if (!webhookUrl) return

    if (!this.isValidWebhookUrl(webhookUrl)) {
      this.logWebhook(webhookUrl, event, false, 'URL de webhook invalide (HTTPS requis)')
      throw new Error('L\'URL du webhook doit être une URL HTTPS valide.')
    }

    const payload = {
      event,
      task: {
        id: task.id || 'test-uuid',
        title: task.title || 'Tâche de test',
        status: task.status || 'todo',
        priority: task.priority || 'normal',
        deadline: task.deadline || new Date().toISOString(),
        category: (task as any).category?.name || 'Aucune',
        appreciation: task.appreciation || 'none',
        duration_minutes: task.actual_duration_minutes || 0
      },
      webhookUrl
    }

    try {
      const { data, error } = await supabase.functions.invoke('webhook-dispatcher', {
        body: payload
      })

      if (error) throw error

      await this.logWebhook(webhookUrl, event, true)
      return data
    } catch (e: any) {
      console.error('Webhook Error:', e)
      await this.logWebhook(webhookUrl, event, false, e.message)
      throw e
    }
  },

  isValidWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.protocol === 'https:'
    } catch (e) {
      return false
    }
  },

  async logWebhook(url: string, event: WebhookEvent, success: boolean, errorMsg?: string) {
    try {
      const authStore = useAuthStore()
      if (authStore.user) {
        const logData: any = {
          user_id: authStore.user.id,
          url,
          event,
          success
        }
        
        if (errorMsg) {
          logData.error = errorMsg
        }

        const { error } = await supabase.from('webhook_logs').insert([logData])
        if (error) throw error

        window.dispatchEvent(new Event('webhook-logs-updated'))
      }
    } catch (e) {
      console.error('Failed to log webhook:', e)
    }
  },
  
  async getLogs(): Promise<WebhookLog[]> {
    try {
      const authStore = useAuthStore()
      if (!authStore.user) return []
      
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
        .limit(10)
        
      if (error) throw error
      
      return data.map(d => ({
        id: d.id,
        timestamp: d.created_at,
        url: d.url,
        event: d.event,
        success: d.success,
        error: d.error
      }))
    } catch (e) {
      console.error('Failed to fetch webhook logs', e)
      return []
    }
  },
  
  getGlobalWebhookUrl(): string {
    try {
      const authStore = useAuthStore()
      if (authStore.user?.preferences?.global_webhook_url) {
        return authStore.user.preferences.global_webhook_url as string
      }
    } catch (e) {
      // Ignore pinia context errors outside of components
    }
    return localStorage.getItem('ursule_global_webhook') || ''
  },
  
  async setGlobalWebhookUrl(url: string) {
    localStorage.setItem('ursule_global_webhook', url)
    try {
      const authStore = useAuthStore()
      if (authStore.user) {
        await authStore.updateProfile({ 
          preferences: { 
            ...(authStore.user.preferences || {}), 
            global_webhook_url: url 
          } 
        })
      }
    } catch (e) {
      console.error('Failed to save webhook URL to DB:', e)
    }
  }
}
