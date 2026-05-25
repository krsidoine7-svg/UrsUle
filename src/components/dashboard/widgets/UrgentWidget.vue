<template>
  <div class="bg-white rounded-[1.8rem] border border-neutral-100 p-10 shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col group/urgent">
    <div class="flex items-center justify-between mb-10">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 shadow-inner group-hover/urgent:rotate-12 transition-transform">
          <AlertCircle class="h-8 w-8" />
        </div>
        <div>
          <h3 class="text-2xl font-display font-black text-neutral-900 leading-tight">Urgences</h3>
          <p class="text-sm text-neutral-400 font-medium">Priorités critiques</p>
        </div>
      </div>
      <div v-if="urgentTasks.length" class="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
        Action
      </div>
    </div>

    <div class="flex-1 space-y-4">
      <div 
        v-for="task in urgentTasks" 
        :key="task.id"
        class="relative p-6 rounded-[1.5rem] bg-red-50/30 border border-red-100 hover:border-red-300 hover:bg-white hover:shadow-2xl hover:shadow-red-200/30 transition-all duration-500 group cursor-pointer"
        @click="router.push('/tasks')"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            <span class="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Immediate</span>
          </div>
          <span 
            v-if="task.deadline"
            class="text-[10px] font-bold"
            :class="getRelativeTime(task.deadline).isPast ? 'text-red-700' : 'text-neutral-400'"
          >
            {{ getRelativeTime(task.deadline).text }}
          </span>
        </div>
        <p class="text-base font-bold text-neutral-900 group-hover:text-red-700 transition-colors leading-snug">
          {{ task.title }}
        </p>
      </div>

      <div v-if="urgentTasks.length === 0" class="flex flex-col items-center justify-center py-16 text-center opacity-40">
        <div class="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck class="h-10 w-10 text-neutral-300" />
        </div>
        <p class="text-xs font-black uppercase tracking-widest text-neutral-400">Zone Sécurisée</p>
        <p class="text-[10px] font-medium mt-2">Aucun risque critique détecté</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, ShieldCheck } from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '@/types/task.types'

const props = defineProps<{
  tasks: Task[]
}>()

const router = useRouter()

const urgentTasks = computed(() => {
  return props.tasks
    .filter(t => t.priority === 'urgent' && t.status !== 'done')
    .sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
    .slice(0, 4)
})

const getRelativeTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    const isPast = date < new Date()
    const distance = formatDistanceToNow(date, { locale: fr, addSuffix: true })
    return { text: distance, isPast }
  } catch {
    return { text: 'Sans date', isPast: false }
  }
}
</script>
