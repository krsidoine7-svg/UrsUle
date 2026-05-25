import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)

  function setUser(u: User | null) {
    user.value = u
  }

  function setSession(s: Session | null) {
    session.value = s
  }

  return {
    user,
    session,
    loading,
    setUser,
    setSession
  }
})
