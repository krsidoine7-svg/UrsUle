import { supabase } from './supabase'
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js'

export const authService = {
  async signUp(credentials: SignUpWithPasswordCredentials) {
    return await supabase.auth.signUp(credentials)
  },

  async signIn(credentials: SignInWithPasswordCredentials) {
    return await supabase.auth.signInWithPassword(credentials)
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email)
  },

  async getUser() {
    return await supabase.auth.getUser()
  },

  async onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
