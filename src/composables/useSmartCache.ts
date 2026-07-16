import { ref } from 'vue'

export interface SmartCacheOptions {
  /** Durée de vie par défaut du cache en secondes (5 minutes = 300 par défaut) */
  defaultTTLSeconds?: number
}

/**
 * Composable `useSmartCache` pour la gestion intelligente du cache dans les stores Pinia et composants.
 * Évite les appels réseau SQL répétitifs vers Supabase lors des navigations entre onglets.
 */
export function useSmartCache(options: SmartCacheOptions = {}) {
  const defaultTTL = options.defaultTTLSeconds ?? 300

  // Horodatage du dernier fetch réussi par clé de cache (ex: 'tasks:all', 'notes:folder:123')
  const timestamps = ref<Record<string, number>>({})

  /**
   * Vérifie si les données en cache pour une clé donnée sont toujours valides (récentes).
   * @param key Identifiant de la ressource (ex: 'tasks_all', 'notes_root')
   * @param ttlSeconds Durée de vie personnalisée en secondes (optionnel)
   */
  function isCacheValid(key: string, ttlSeconds: number = defaultTTL): boolean {
    const lastFetch = timestamps.value[key]
    if (!lastFetch) return false
    
    const elapsedMs = Date.now() - lastFetch
    return elapsedMs < ttlSeconds * 1000
  }

  /**
   * Met à jour l'horodatage d'une clé de cache après une récupération réussie.
   * @param key Identifiant de la ressource
   */
  function updateTimestamp(key: string): void {
    timestamps.value[key] = Date.now()
  }

  /**
   * Invalide immédiatement le cache pour une clé précise ou pour l'ensemble des clés.
   * À appeler lors d'une modification Realtime (INSERT/UPDATE/DELETE) ou d'un forçage utilisateur.
   * @param key Identifiant optionnel. Si non fourni, vide tout le cache du store.
   */
  function invalidateCache(key?: string): void {
    if (key) {
      delete timestamps.value[key]
    } else {
      timestamps.value = {}
    }
  }

  /**
   * Récupère le temps écoulé en secondes depuis la dernière mise à jour de cette clé.
   * Retourne `null` si la clé n'a jamais été chargée.
   */
  function getAgeSeconds(key: string): number | null {
    const lastFetch = timestamps.value[key]
    if (!lastFetch) return null
    return Math.floor((Date.now() - lastFetch) / 1000)
  }

  return {
    timestamps,
    isCacheValid,
    updateTimestamp,
    invalidateCache,
    getAgeSeconds,
    defaultTTL
  }
}
