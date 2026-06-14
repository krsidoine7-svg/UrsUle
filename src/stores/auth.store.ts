import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import type { Profile } from '@/types/user.types'
import { useCategoriesStore } from './categories.store'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Profile | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchProfile(session.user.id)
      const { driveService } = await import('@/services/drive.service')
      driveService.saveTokenFromSession(session)
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (user.value?.id !== session.user.id) {
          await fetchProfile(session.user.id)
        }
        const { driveService } = await import('@/services/drive.service')
        driveService.saveTokenFromSession(session)
      }
      if (event === 'SIGNED_OUT') {
        user.value = null
        const { driveService } = await import('@/services/drive.service')
        driveService.disconnectGoogle()
      }
    })
  }

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Erreur lors de la récupération du profil:', error.message)
      return
    }

    if (data) {
      user.value = data as Profile
      const categoriesStore = useCategoriesStore()
      categoriesStore.fetchCategories()
    } else {
      console.warn('Aucun profil trouvé pour cet utilisateur. Vérifiez les triggers ou les politiques RLS.')
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Email ou mot de passe incorrect')
    
    // Attendre le chargement du profil AVANT de résoudre la connexion
    // pour garantir que la redirection vers le dashboard a les bonnes données
    if (data?.session?.user) {
      await fetchProfile(data.session.user.id)
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user.value) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.value.id)
    
    if (error) {
      console.error('Erreur de mise à jour du profil:', error)
      throw error
    }
    
    user.value = { ...user.value, ...updates }
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    if (error) throw error
  }

  return { user, loading, isAuthenticated, initialize, signIn, signUp, signOut, updateProfile, resetPassword }
})
