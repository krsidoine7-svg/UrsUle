<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const passwordStrength = computed(() => {
  if (!password.value) return 0
  let score = 0
  if (password.value.length >= 8) score++
  if (/[A-Z]/.test(password.value)) score++
  if (/[0-9]/.test(password.value)) score++
  return score
})

const strengthText = computed(() => {
  const score = passwordStrength.value
  if (score === 0) return ''
  if (score === 1) return 'Faible'
  if (score === 2) return 'Moyen'
  return 'Fort'
})

const strengthColor = computed(() => {
  const score = passwordStrength.value
  if (score === 1) return 'bg-red-500'
  if (score === 2) return 'bg-yellow-500'
  if (score === 3) return 'bg-green-500'
  return 'bg-neutral-200'
})

async function handleRegister() {
  console.log("🚀 Tentative d'inscription initiée...");
  error.value = null

  if (passwordStrength.value < 3) {
    console.warn("⚠️ Mot de passe trop faible (score: " + passwordStrength.value + ")");
    error.value = "Le mot de passe doit être 'Fort' (au moins 8 caractères, une majuscule et un chiffre)."
    return
  }

  if (!fullName.value || !email.value || !password.value) {
    console.warn("⚠️ Certains champs sont vides");
    error.value = "Veuillez remplir tous les champs."
    return
  }

  loading.value = true
  try {
    console.log("📡 Appel de authStore.signUp pour:", email.value);
    await authStore.signUp(email.value, password.value, fullName.value)
    console.log("✅ Inscription réussie côté Store");
    success.value = true
  } catch (e: any) {
    console.error("❌ Erreur d'inscription détaillée:", e);
    error.value = e.message || "Une erreur est survenue lors de l'inscription."
  } finally {
    loading.value = false
    console.log("🏁 Fin de l'opération handleRegister");
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
    <div class="mb-8 text-center">
      <h1 class="text-4xl font-bold text-primary-600 font-display">UrsUle</h1>
    </div>

    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl font-display">Créer un compte</CardTitle>
        <CardDescription>
          Commencez votre voyage vers une productivité sereine.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="success" class="space-y-4 text-center py-4">
          <CheckCircle2 class="mx-auto h-12 w-12 text-green-500" />
          <h3 class="text-lg font-medium">Inscription réussie !</h3>
          <p class="text-neutral-500">
            Vérifiez votre boîte mail ({{ email }}) pour confirmer votre compte.
          </p>
          <Button variant="outline" class="w-full" @click="router.push('/login')">
            Retour à la connexion
          </Button>
        </div>

        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div v-if="error" class="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </div>

          <div class="space-y-2">
            <Label for="fullName">Nom complet</Label>
            <Input id="fullName" placeholder="Jean Dupont" v-model="fullName" required />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" type="email" placeholder="nom@exemple.com" v-model="email" required />
          </div>

          <div class="space-y-2">
            <Label for="password">Mot de passe</Label>
            <Input id="password" type="password" v-model="password" required />
            <div class="mt-2 space-y-1">
              <div class="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-neutral-100">
                <div 
                  v-for="i in 3" 
                  :key="i"
                  class="h-full flex-1 transition-all duration-300"
                  :class="i <= passwordStrength ? strengthColor : 'bg-neutral-200'"
                ></div>
              </div>
              <p class="text-xs text-neutral-500 text-right">{{ strengthText }}</p>
            </div>
          </div>

          <Button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 mt-6" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            S'inscrire
          </Button>
        </form>
      </CardContent>
      <CardFooter v-if="!success">
        <div class="text-sm text-neutral-500">
          Vous avez déjà un compte ?
          <router-link to="/login" class="text-primary-600 hover:underline font-medium">
            Se connecter
          </router-link>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
