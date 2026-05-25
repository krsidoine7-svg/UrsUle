<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '@/types/project.types'
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  FolderOpen,
  Layout
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps<{
  project: Project
}>()

const router = useRouter()

const IconComponent = computed(() => {
  return (LucideIcons as any)[props.project.icon] || FolderOpen
})

const stats = computed(() => {
  const tasks = props.project.tasks || []
  const total = tasks.length
  const completed = tasks.filter((t: any) => t.status === 'done').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, progress }
})

const deadlineInfo = computed(() => {
  if (!props.project.deadline) return null
  const date = new Date(props.project.deadline)
  const isUrgent = isBefore(date, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  const isOverdue = isBefore(date, new Date())
  return {
    date: format(date, 'dd MMM yyyy', { locale: fr }),
    isUrgent,
    isOverdue
  }
})

const navigateToDetail = () => {
  router.push(`/projects/${props.project.id}`)
}
</script>

<template>
  <div 
    @click="navigateToDetail"
    class="group relative bg-white rounded-3xl border border-neutral-100 p-6 hover:shadow-2xl hover:shadow-primary-100/50 hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
  >
    <!-- Background Decor -->
    <div 
      class="absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-10 -translate-y-10 rounded-full transition-transform group-hover:scale-110 duration-500"
      :style="{ backgroundColor: project.color }"
    ></div>

    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div 
        class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
        :style="{ backgroundColor: `${project.color}15`, color: project.color }"
      >
        <component :is="IconComponent" class="h-6 w-6" />
      </div>
      <Badge 
        variant="secondary" 
        class="bg-neutral-50 text-neutral-500 font-bold text-[10px] uppercase tracking-wider"
      >
        {{ project.status }}
      </Badge>
    </div>

    <!-- Content -->
    <div class="flex-1">
      <h3 class="text-lg font-display font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
        {{ project.name }}
      </h3>
      <p class="text-sm text-neutral-500 line-clamp-2 mb-6 min-h-[40px]">
        {{ project.description || 'Aucune description' }}
      </p>
    </div>

    <!-- Progress -->
    <div class="space-y-3 mb-6">
      <div class="flex justify-between items-end">
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Progression</span>
        <span class="text-sm font-bold text-neutral-800">{{ stats.progress }}%</span>
      </div>
      <Progress :model-value="stats.progress" class="h-2 bg-neutral-50">
        <div 
          class="h-full transition-all duration-500" 
          :style="{ width: `${stats.progress}%`, backgroundColor: project.color }"
        ></div>
      </Progress>
      <div class="flex items-center gap-3 text-[11px] font-bold text-neutral-400">
        <span class="flex items-center gap-1">
          <Layout class="h-3 w-3" /> {{ stats.total }} tâches
        </span>
        <span class="flex items-center gap-1 text-green-600">
          <CheckCircle2 class="h-3 w-3" /> {{ stats.completed }} terminées
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="deadlineInfo" class="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div 
          class="p-1.5 rounded-lg"
          :class="[
            deadlineInfo.isOverdue ? 'bg-red-50 text-red-600' : 
            deadlineInfo.isUrgent ? 'bg-amber-50 text-amber-600' : 'bg-neutral-50 text-neutral-400'
          ]"
        >
          <Calendar class="h-3.5 w-3.5" />
        </div>
        <span 
          class="text-xs font-bold"
          :class="[
            deadlineInfo.isOverdue ? 'text-red-600' : 
            deadlineInfo.isUrgent ? 'text-amber-600' : 'text-neutral-500'
          ]"
        >
          {{ deadlineInfo.date }}
        </span>
      </div>
      <ChevronRight class="h-4 w-4 text-neutral-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
</template>

<style scoped>
.shadow-card-hover {
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05);
}
</style>
