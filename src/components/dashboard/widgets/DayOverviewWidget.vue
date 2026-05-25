<template>
  <div class="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full group/widget">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h3 class="text-2xl font-display font-black text-neutral-900 group-hover/widget:text-primary-600 transition-colors">Tâches du jour</h3>
        <p class="text-sm text-neutral-400 font-medium">Tes priorités pour briller aujourd'hui</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <span class="text-3xl font-display font-black text-primary-600 leading-none">{{ stats.completed }}</span>
          <span class="text-sm font-bold text-neutral-300 ml-1">/{{ stats.total }}</span>
        </div>
        <div class="relative w-12 h-12">
          <svg class="w-full h-full transform -rotate-90">
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" fill="transparent" class="text-neutral-50" />
            <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" fill="transparent" 
              class="text-primary-500 transition-all duration-1000 ease-out"
              :stroke-dasharray="2 * Math.PI * 20"
              :stroke-dashoffset="2 * Math.PI * 20 * (1 - stats.progress / 100)"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <div class="flex-1 space-y-4">
      <div 
        v-for="task in displayedTasks" 
        :key="task.id"
        class="flex items-center gap-4 p-4 rounded-[1.5rem] bg-neutral-50/50 hover:bg-white hover:shadow-xl hover:shadow-primary-100/20 border border-transparent hover:border-primary-100 transition-all duration-300 group cursor-pointer"
        @click="router.push('/tasks')"
      >
        <div class="relative">
          <component 
            :is="task.status === 'done' ? CheckCircle2 : Circle" 
            class="h-6 w-6 transition-all duration-300"
            :class="task.status === 'done' ? 'text-green-500 scale-110' : 'text-neutral-300 group-hover:text-primary-500 group-hover:scale-110'"
          />
          <div v-if="task.status !== 'done'" class="absolute inset-0 bg-primary-400 blur-md opacity-0 group-hover:opacity-40 transition-opacity rounded-full"></div>
        </div>
        
        <div class="flex-1 min-w-0">
          <p 
            class="text-sm font-bold truncate transition-all"
            :class="task.status === 'done' ? 'text-neutral-400 line-through opacity-60' : 'text-neutral-800'"
          >
            {{ task.title }}
          </p>
          <div v-if="task.priority === 'urgent'" class="flex items-center gap-1 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span class="text-[9px] font-black text-red-500 uppercase tracking-widest">Urgent</span>
          </div>
        </div>
        
        <ChevronRight class="h-4 w-4 text-neutral-200 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>

      <div v-if="tasks.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 animate-bounce-slow">
          <CheckCircle2 class="h-10 w-10" />
        </div>
        <h4 class="text-lg font-bold text-neutral-800">Tout est sous contrôle !</h4>
        <p class="text-sm text-neutral-400 max-w-[200px] mx-auto mt-2">Aucune tâche pour le moment. Profite de ton temps libre !</p>
      </div>
    </div>

    <Button 
      variant="ghost" 
      class="mt-8 w-full h-14 rounded-2xl font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 border border-transparent hover:border-primary-100 transition-all"
      @click="router.push('/tasks')"
    >
      Explorer toutes les tâches
      <ChevronRight class="h-4 w-4 ml-2" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-vue-next'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  tasks: Task[]
}>()

const router = useRouter()

const stats = computed(() => {
  const total = props.tasks.length
  const completed = props.tasks.filter(t => t.status === 'done').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, progress }
})

const displayedTasks = computed(() => {
  return [...props.tasks]
    .sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1
      return 0
    })
    .slice(0, 5)
})
</script>

<style scoped>
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s infinite ease-in-out;
}
</style>
