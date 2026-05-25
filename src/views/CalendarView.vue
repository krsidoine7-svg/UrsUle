<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CalendarView from '@/components/calendar/CalendarView.vue'
import TaskDetail from '@/components/tasks/TaskDetail.vue'
import { useTasksStore } from '@/stores/tasks.store'
import type { Task } from '@/types/task.types'
import { Calendar, Filter } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

import { useUIStore } from '@/stores/ui.store'

const tasksStore = useTasksStore()
const uiStore = useUIStore()
const selectedTaskForDetail = ref<Task | null>(null)

function openDetail(task: Task) {
  selectedTaskForDetail.value = task
}

function openEditForm(task: Task) {
  selectedTaskForDetail.value = null
  uiStore.openTaskForm(task)
}

onMounted(() => {
  tasksStore.fetchTasks()
})
</script>

<template>
  <div class="space-y-6 md:space-y-8 pb-10 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
      <div class="space-y-1">
        <h1 class="text-3xl md:text-4xl font-display font-black text-neutral-900 tracking-tight">Mon Calendrier</h1>
        <p class="text-sm md:text-base text-neutral-500 font-medium">Visualise ton emploi du temps et tes échéances.</p>
      </div>
      
      <div class="flex gap-3">
        <Button variant="outline" class="h-10 md:h-12 w-full md:w-auto rounded-xl md:rounded-2xl font-bold border-neutral-100 bg-white">
          <Filter class="h-4 w-4 mr-2" /> Filtres
        </Button>
      </div>
    </div>

    <!-- Calendar -->
    <CalendarView @open-detail="openDetail" />

    <!-- Task Detail Slide-over -->
    <TaskDetail 
      :task="selectedTaskForDetail" 
      @close="selectedTaskForDetail = null" 
      @edit="openEditForm"
      @update-task="selectedTaskForDetail = $event"
    />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
