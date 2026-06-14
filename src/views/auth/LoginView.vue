<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAppConfigStore } from '@/stores/appConfig.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Github, Mail, MessageCircle, ExternalLink } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const appConfigStore = useAppConfigStore()

// Charger la configuration de marque dès le montage (ou récupérer depuis le cache)
appConfigStore.fetchConfig()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  loading.value = true
  error.value = null
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex bg-neutral-50">

    <!-- Côté Gauche — Branding + Contact -->
    <div class="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-forest-600 text-white p-10 relative overflow-hidden">
      
      <!-- Motif décoratif -->
      <div class="absolute inset-0 opacity-[0.07]">
        <div class="absolute top-20 -left-10 w-64 h-64 rounded-full border-2 border-white"></div>
        <div class="absolute bottom-32 -right-16 w-80 h-80 rounded-full border-2 border-white"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white"></div>
      </div>

      <!-- Header -->
      <div class="relative z-10">
        <h1 class="text-5xl font-display font-black tracking-tight">{{ appConfigStore.config.app_name }}</h1>
        <p class="text-white/70 mt-3 text-lg font-medium leading-relaxed max-w-sm">
          {{ appConfigStore.config.app_subtitle }}
        </p>
      </div>

      <!-- Citation -->
      <div class="relative z-10">
        <blockquote class="border-l-4 border-white/30 pl-5 text-white/80 italic text-sm leading-relaxed">
          {{ appConfigStore.config.quote }}
        </blockquote>
      </div>

      <!-- Contact -->
      <div class="relative z-10 space-y-5">
        <p class="text-xs font-bold uppercase tracking-widest text-white/50">Créé par {{ appConfigStore.config.author_name }}</p>
        
        <div class="space-y-2.5">
          <a 
            :href="appConfigStore.config.github_url" 
            target="_blank"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all group"
          >
            <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors shrink-0">
              <Github class="h-4 w-4" />
            </div>
            <div>
              <span class="text-sm font-bold block">GitHub</span>
              <span class="text-[11px] text-white/60">{{ appConfigStore.config.github_text }}</span>
            </div>
          </a>

          <a 
            :href="appConfigStore.config.email_url"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all group"
          >
            <div class="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors shrink-0">
              <Mail class="h-4 w-4" />
            </div>
            <div>
              <span class="text-sm font-bold block">Email</span>
              <span class="text-[11px] text-white/60">{{ appConfigStore.config.email_text }}</span>
            </div>
          </a>

          <a 
            :href="appConfigStore.config.whatsapp_url"
            target="_blank"
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all group"
          >
            <div class="w-8 h-8 rounded-lg bg-green-500/30 flex items-center justify-center group-hover:bg-green-500/40 transition-colors shrink-0">
              <MessageCircle class="h-4 w-4" />
            </div>
            <div>
              <span class="text-sm font-bold block">WhatsApp</span>
              <span class="text-[11px] text-white/60">{{ appConfigStore.config.whatsapp_text }}</span>
            </div>
          </a>
        </div>

        <!-- Mes réalisations -->
        <div class="pt-3 border-t border-white/10">
          <p class="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2.5 flex items-center gap-1.5">
            <ExternalLink class="h-3 w-3" /> Mes réalisations
          </p>
          <div class="flex flex-wrap gap-2">
            <a 
              v-for="(link, i) in appConfigStore.config.portfolio_links" 
              :key="i"
              :href="link.url" 
              target="_blank" 
              class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-[11px] font-bold text-white/80 hover:text-white transition-all"
            >
              {{ link.label }}
            </a>
          </div>
        </div>

        <p class="text-[10px] text-white/30 font-medium pt-1">
          {{ appConfigStore.config.copyright }}
        </p>
      </div>
    </div>

    <!-- Côté Droit — Formulaire -->
    <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div class="mb-8 text-center lg:hidden">
        <h1 class="text-4xl font-bold text-primary-600 font-display">{{ appConfigStore.config.app_name }}</h1>
        <p class="text-neutral-500 mt-2">Gère tes tâches avec sérénité</p>
      </div>

      <Card class="w-full max-w-md shadow-xl border-neutral-100 rounded-2xl">
        <CardHeader>
          <CardTitle class="text-2xl font-display">Connexion</CardTitle>
          <CardDescription>
            Ravi de vous revoir ! Connectez-vous à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div v-if="error" class="mb-4">
              <Alert variant="destructive">
                <AlertDescription>{{ error }}</AlertDescription>
              </Alert>
            </div>

            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input id="email" type="email" placeholder="nom@exemple.com" v-model="email" required />
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label for="password">Mot de passe</Label>
                <router-link to="/forgot-password" class="text-sm text-primary-600 hover:underline">
                  Oublié ?
                </router-link>
              </div>
              <Input id="password" type="password" v-model="password" required />
            </div>

            <Button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 h-12 rounded-xl font-bold text-base shadow-lg shadow-primary-100 transition-all hover:scale-[1.01] active:scale-95" :disabled="loading">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              Se connecter
            </Button>
          </form>
        </CardContent>
        <CardFooter class="flex flex-col space-y-2">
          <div class="text-sm text-neutral-500">
            Pas encore de compte ?
            <router-link to="/register" class="text-primary-600 hover:underline font-medium">
              Créer un compte
            </router-link>
          </div>
        </CardFooter>
      </Card>

      <!-- Contact mobile -->
      <div class="lg:hidden mt-8 flex items-center justify-center gap-4">
        <a :href="appConfigStore.config.github_url" target="_blank" class="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors" title="GitHub">
          <Github class="h-5 w-5" />
        </a>
        <a :href="appConfigStore.config.email_url" class="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors" title="Email">
          <Mail class="h-5 w-5" />
        </a>
        <a :href="appConfigStore.config.whatsapp_url" target="_blank" class="p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors" title="WhatsApp">
          <MessageCircle class="h-5 w-5" />
        </a>
      </div>
    </div>

  </div>
</template>
