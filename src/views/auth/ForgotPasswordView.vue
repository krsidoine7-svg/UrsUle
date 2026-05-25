<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handleReset() {
  loading.value = true
  error.value = null
  try {
    await authStore.resetPassword(email.value)
    success.value = true
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
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
        <CardTitle class="text-2xl font-display">Mot de passe oublié</CardTitle>
        <CardDescription>
          On va vous aider à retrouver l'accès à votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="success" class="space-y-4 text-center py-4">
          <Mail class="mx-auto h-12 w-12 text-primary-600" />
          <h3 class="text-lg font-medium">Email envoyé !</h3>
          <p class="text-neutral-500">
            Un lien de réinitialisation a été envoyé à {{ email }}.
          </p>
          <Button variant="outline" class="w-full" @click="router.push('/login')">
            Retour à la connexion
          </Button>
        </div>

        <form v-else @submit.prevent="handleReset" class="space-y-4">
          <div v-if="error" class="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </div>

          <div class="space-y-2">
            <Label for="email">Votre adresse email</Label>
            <Input id="email" type="email" placeholder="nom@exemple.com" v-model="email" required />
          </div>

          <Button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 mt-2" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            Envoyer le lien
          </Button>
        </form>
      </CardContent>
      <CardFooter v-if="!success">
        <Button variant="link" class="w-full text-neutral-500" @click="router.push('/login')">
          Retour à la connexion
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
