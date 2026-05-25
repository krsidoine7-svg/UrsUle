<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/auth.service'
import { Rocket, Mail, Lock, User, ArrowRight } from 'lucide-vue-next'

const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  
  try {
    const { data, error: authError } = await authService.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          full_name: fullName.value
        }
      }
    })

    if (authError) throw authError

    if (data.user) {
      alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.')
      router.push('/login')
    }
  } catch (e: any) {
    error.value = e.message || "Une erreur est survenue lors de l'inscription"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-forest/10 rounded-2xl mb-4">
          <Rocket class="w-8 h-8 text-forest" />
        </div>
        <h2 class="text-3xl font-bold text-slate-900">Rejoindre UrsUle</h2>
        <p class="mt-2 text-slate-600">Commencez votre voyage vers une productivité d'élite</p>
      </div>

      <div class="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div v-if="error" class="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {{ error }}
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-slate-700 mb-1">Nom Complet</label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                id="name" 
                v-model="fullName" 
                type="text" 
                required 
                placeholder="Jean Dupont"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                placeholder="votre@email.com"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                id="password" 
                v-model="password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="loading"
            class="group w-full flex items-center justify-center gap-2 bg-forest text-white py-3 px-4 rounded-xl font-semibold hover:bg-forest/90 focus:outline-none focus:ring-4 focus:ring-forest/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{{ loading ? 'Création...' : 'Créer mon compte' }}</span>
            <ArrowRight v-if="!loading" class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-100 text-center">
          <p class="text-sm text-slate-600">
            Déjà un compte ? 
            <router-link to="/login" class="font-semibold text-forest hover:underline">Se connecter</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-forest { color: var(--color-forest); }
.bg-forest { background-color: var(--color-forest); }
.focus\:ring-forest:focus { --tw-ring-color: var(--color-forest); }
.focus\:border-forest:focus { border-color: var(--color-forest); }
</style>
