<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const { toast } = useToast()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleUpdate() {
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  loading.value = true
  error.value = null
  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: password.value
    })

    if (updateError) throw updateError

    toast({
      title: 'Succès !',
      description: 'Votre mot de passe a été mis à jour avec succès.',
    })
    
    router.push('/login')
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
      <h1 class="text-4xl font-bold text-primary-600 font-display tracking-tight">UrsUle</h1>
    </div>

    <Card class="w-full max-w-md border-none shadow-xl shadow-primary-900/5 rounded-[2rem] overflow-hidden">
      <div class="h-2 bg-primary-600"></div>
      <CardHeader class="pt-8 px-8">
        <div class="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-4">
          <Lock class="h-6 w-6" />
        </div>
        <CardTitle class="text-2xl font-display font-black">Nouveau mot de passe</CardTitle>
        <CardDescription class="text-neutral-500 font-medium">
          Choisis un mot de passe fort pour protéger ton compte.
        </CardDescription>
      </CardHeader>
      
      <CardContent class="px-8 pb-8">
        <form @submit.prevent="handleUpdate" class="space-y-5">
          <div v-if="error">
            <Alert variant="destructive" class="bg-red-50 border-red-100 text-red-600 rounded-2xl">
              <AlertDescription class="font-bold">{{ error }}</AlertDescription>
            </Alert>
          </div>

          <div class="space-y-2">
            <Label for="password" class="text-xs font-black uppercase tracking-widest text-neutral-400">Nouveau mot de passe</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              v-model="password" 
              required 
              class="h-12 rounded-xl border-neutral-100 bg-neutral-50/50 focus:bg-white transition-all font-medium"
            />
          </div>

          <div class="space-y-2">
            <Label for="confirm" class="text-xs font-black uppercase tracking-widest text-neutral-400">Confirmer le mot de passe</Label>
            <Input 
              id="confirm" 
              type="password" 
              placeholder="••••••••" 
              v-model="confirmPassword" 
              required 
              class="h-12 rounded-xl border-neutral-100 bg-neutral-50/50 focus:bg-white transition-all font-medium"
            />
          </div>

          <Button 
            type="submit" 
            class="w-full bg-primary-600 hover:bg-primary-700 h-12 rounded-xl font-bold shadow-lg shadow-primary-200 transition-all active:scale-95" 
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            Réinitialiser le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
