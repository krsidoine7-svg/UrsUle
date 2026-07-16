import { ref, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function usePushNotifications() {
  const authStore = useAuthStore()
  const permission = ref<NotificationPermission>('default')
  const isSupported = ref(false)

  onMounted(() => {
    isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window
    if ('Notification' in window) {
      permission.value = Notification.permission
    }
  })

  async function registerServiceWorker() {
    if (!isSupported.value) return null
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('Service Worker registered successfully with scope:', registration.scope)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  async function subscribeToPush(registration: ServiceWorkerRegistration) {
    try {
      // Clé publique VAPID de Supabase / Push
      // Si la clé n'est pas présente, on utilise une clé de test standard
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BFs_M_XwR4eE5gN8iZ_D7bMhJ7x8C6gK5d4s3a2P1o0n9m8l7k6j5h4g3f2d1s0a_e'
      
      // Convertir la clé VAPID en Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })

      console.log('Push Subscription successful:', subscription)

      // Sauvegarder la souscription dans les préférences de l'utilisateur sur Supabase
      if (authStore.user) {
        const currentPrefs = authStore.user.preferences || {}
        const updatedPrefs = {
          ...currentPrefs,
          push_subscription: subscription
        }

        const { error } = await supabase
          .from('profiles')
          .update({
            preferences: updatedPrefs,
            updated_at: new Date().toISOString()
          })
          .eq('id', authStore.user.id)

        if (error) throw error
        console.log('Push subscription saved to user profile preferences.')
      }

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return false

    const result = await Notification.requestPermission()
    permission.value = result

    if (result === 'granted') {
      const registration = await registerServiceWorker()
      if (registration) {
        await subscribeToPush(registration)
      }
      return true
    }
    return false
  }

  // Fonction utilitaire pour convertir la clé publique VAPID
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  return {
    permission,
    isSupported,
    requestPermission,
    registerServiceWorker
  }
}
