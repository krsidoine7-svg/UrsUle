import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/services/supabase'

export interface PortfolioLink {
  label: string
  url: string
}

export interface AppConfig {
  id: number
  app_name: string
  app_subtitle: string
  quote: string
  author_name: string
  github_url: string
  github_text: string
  email_url: string
  email_text: string
  whatsapp_url: string
  whatsapp_text: string
  portfolio_links: PortfolioLink[]
  copyright: string
}

const DEFAULT_CONFIG: AppConfig = {
  id: 1,
  app_name: 'UrsUle',
  app_subtitle: 'Le gestionnaire de tâches premium pour les jeunes entrepreneurs ambitieux.',
  quote: '« Chaque grande réussite commence par la décision d\'essayer. »',
  author_name: 'Krsidoine',
  github_url: 'https://github.com/krsidoine7-svg/UrsUle',
  github_text: 'krsidoine7-svg/UrsUle',
  email_url: 'mailto:krsidoine7@gmail.com',
  email_text: 'krsidoine7@gmail.com',
  whatsapp_url: 'https://wa.me/2250503681588',
  whatsapp_text: '+225 05 03 68 15 88',
  portfolio_links: [
    { label: 'Ofika.ci', url: 'https://ofika.ci/' },
    { label: 'Orla-nou', url: 'https://orla-nou.vercel.app/' },
    { label: 'Menlyla.ci', url: 'https://manly-chi.vercel.app/' },
    { label: 'Ofika Gourmet - Menu Digital', url: 'https://manly-chi.vercel.app/ofika-gournet' },
    { label: 'Portfolio', url: 'https://ofika.ci/krsidoine7' },
    { label: 'Sign Ofika', url: 'https://sign-ofika.vercel.app/' }
  ],
  copyright: '© 2026 UrsUle — Tous droits réservés'
}

export const useAppConfigStore = defineStore('appConfig', () => {
  const config = ref<AppConfig>({ ...DEFAULT_CONFIG })
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Flag pour savoir si on a déjà chargé la config (pour éviter de multiplier les requêtes)
  const isLoaded = ref(false)

  async function fetchConfig(forceRefresh = false) {
    if (isLoaded.value && !forceRefresh) return config.value

    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (fetchError) {
        // Code PGRST116: pas de ligne trouvée. On garde les defaults.
        if (fetchError.code !== 'PGRST116') throw fetchError
      } else if (data) {
        config.value = { ...config.value, ...data }
      }
      
      isLoaded.value = true
    } catch (e: any) {
      console.error('Erreur lors du chargement de la configuration app:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }

    return config.value
  }

  async function updateConfig(newConfig: Partial<AppConfig>) {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: updateError } = await supabase
        .from('app_settings')
        .update(newConfig)
        .eq('id', 1)
        .select()
        .single()

      if (updateError) throw updateError

      if (data) {
        config.value = { ...config.value, ...data }
      }
      return true
    } catch (e: any) {
      console.error('Erreur de mise à jour config:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    config,
    loading,
    error,
    isLoaded,
    fetchConfig,
    updateConfig
  }
})
