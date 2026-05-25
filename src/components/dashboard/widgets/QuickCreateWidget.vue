<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Loader2, Send } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks.store'
import { useToast } from '@/components/ui/toast/use-toast'

const tasksStore = useTasksStore()
const { toast } = useToast()

const title = ref('')
const isSubmitting = ref(false)

async function handleQuickCreate() {
  const t = title.value.trim()
  if (!t || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await tasksStore.createTask({
      title: t,
      status: 'todo',
      priority: 'normal',
      deadline: new Date().toISOString(), // Aujourd'hui par défaut
      category_id: (await import('@/stores/categories.store')).useCategoriesStore().categories[0]?.id
    })
    title.value = ''
    toast({ title: 'Tâche créée !', description: 'Ajoutée à tes objectifs du jour.' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-primary-900 rounded-[2.5rem] p-8 shadow-xl shadow-primary-900/20 text-white flex flex-col h-full overflow-hidden relative">
    <div class="relative z-10 mb-6">
      <h3 class="text-xl font-display font-bold">Création rapide</h3>
      <p class="text-sm text-primary-300 font-medium">Une idée ? Note-la vite.</p>
    </div>

    <div class="relative z-10 mt-auto">
      <div class="relative group">
        <input 
          v-model="title"
          type="text" 
          placeholder="Titre de la tâche..."
          @keydown.enter="handleQuickCreate"
          class="w-full bg-white/10 border-2 border-white/10 rounded-2xl h-16 pl-6 pr-14 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/30 outline-none transition-all"
        />
        <button 
          @click="handleQuickCreate"
          :disabled="!title.trim() || isSubmitting"
          class="absolute right-2 top-2 h-12 w-12 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:hover:bg-primary-500 flex items-center justify-center transition-all shadow-lg"
        >
          <Loader2 v-if="isSubmitting" class="h-5 w-5 animate-spin" />
          <Send v-else class="h-5 w-5" />
        </button>
      </div>
      <p class="text-[10px] font-bold text-primary-400 uppercase tracking-widest mt-4 text-center">
        Appuie sur Entrée pour valider
      </p>
    </div>

    <!-- Background Decor -->
    <div class="absolute -top-10 -left-10 w-40 h-40 bg-primary-800 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl"></div>
  </div>
</template>
