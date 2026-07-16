import { ref } from 'vue'

class AppUpdateService {
  public updateAvailable = ref(false)
  private registration: ServiceWorkerRegistration | null = null
  private checkInterval: number | null = null

  /**
   * Initialise l'écoute et l'enregistrement du Service Worker pour la détection de nouvelles versions.
   */
  public init(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Enregistrement du Service Worker
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          this.registration = reg
          console.log('✅ [AppUpdateService] Service Worker enregistré avec succès:', reg.scope)

          // Vérifier immédiatement si un worker est déjà en attente d'activation
          if (reg.waiting) {
            this.updateAvailable.value = true
          }

          // Écouter l'arrivée d'une nouvelle version en cours d'installation
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouvelle version installée en attente
                  console.log('✨ [AppUpdateService] Nouvelle version détectée et prête.')
                  this.updateAvailable.value = true
                }
              })
            }
          })
        })
        .catch((err) => {
          console.error('❌ [AppUpdateService] Erreur d\'enregistrement du Service Worker:', err)
        })

      // Déclencher le rechargement propre lorsque le nouveau Service Worker prend le contrôle
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          console.log('🔄 [AppUpdateService] Rechargement vers la nouvelle version...')
          window.location.reload()
        }
      })

      // Vérifier les mises à jour lorsque l'utilisateur revient sur l'onglet (Focus / Visibility)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates()
        }
      })

      // Vérification périodique discrète en arrière-plan toutes les 60 minutes
      this.checkInterval = window.setInterval(() => {
        this.checkForUpdates()
      }, 60 * 60 * 1000)
    })
  }

  /**
   * Demande manuelle ou automatique au navigateur de vérifier si `/sw.js` a été modifié sur le serveur.
   */
  public checkForUpdates(): void {
    if (this.registration) {
      console.log('🔍 [AppUpdateService] Vérification d\'une mise à jour disponible...')
      this.registration.update().catch((err) => {
        console.debug('Vérification SW update impossible ou hors ligne:', err)
      })
    }
  }

  /**
   * Applique la mise à jour en demandant au nouveau Service Worker de s'activer immédiatement (SKIP_WAITING).
   */
  public applyUpdateAndReload(): void {
    if (!this.registration || !this.registration.waiting) {
      // S'il n'y a pas de worker en attente, forcer un rechargement classique de la page
      window.location.reload()
      return
    }

    // Envoyer le message SKIP_WAITING au worker en attente
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
}

export const appUpdateService = new AppUpdateService()
