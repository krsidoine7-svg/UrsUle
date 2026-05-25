<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Progress } from '@/components/ui/progress'
import { FolderOpen, ChevronRight } from 'lucide-vue-next'
import type { Project } from '@/types/project.types'

const props = defineProps<{
  projects: Project[]
}>()

const router = useRouter()

const activeProjects = computed(() => {
  return props.projects
    .filter(p => p.status === 'active')
    .map(p => {
      const tasks = p.tasks || []
      const completed = tasks.filter((t: any) => t.status === 'done').length
      const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
      return { ...p, progress }
    })
    .slice(0, 3)
})
</script>

<template>
  <div class="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm h-full flex flex-col">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-display font-bold text-neutral-900">Projets actifs</h3>
      <FolderOpen class="h-5 w-5 text-neutral-300" />
    </div>

    <div class="flex-1 space-y-6">
      <div 
        v-for="project in activeProjects" 
        :key="project.id"
        @click="router.push(`/projects/${project.id}`)"
        class="group cursor-pointer"
      >
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-bold text-neutral-700 group-hover:text-primary-600 transition-colors">
            {{ project.name }}
          </span>
          <span class="text-xs font-black text-neutral-400">{{ project.progress }}%</span>
        </div>
        <Progress :model-value="project.progress" class="h-2 bg-neutral-50">
          <div 
            class="h-full transition-all duration-500" 
            :style="{ width: `${project.progress}%`, backgroundColor: project.color }"
          ></div>
        </Progress>
      </div>

      <div v-if="activeProjects.length === 0" class="flex flex-col items-center justify-center py-10 opacity-40">
        <FolderOpen class="h-10 w-10 mb-2" />
        <p class="text-xs font-bold uppercase tracking-widest">Aucun projet en cours</p>
      </div>
    </div>
  </div>
</template>
