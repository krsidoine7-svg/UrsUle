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
      // Clé publique VAPID — requise pour l'abonnement Push
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

      // Si aucune clé VAPID valide n'est configurée, on ne tente pas l'abonnement
      if (!vapidPublicKey || vapidPublicKey.length < 60) {
        console.info('[Push] Aucune clé VAPID configurée (VITE_VAPID_PUBLIC_KEY). Notifications push désactivées.')
        return null
      }

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
      console.warn('[Push] Abonnement push non disponible:', (error as Error).message)
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
