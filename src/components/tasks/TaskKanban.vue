<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Plus } from 'lucide-vue-next'
import TaskCard from './TaskCard.vue'
import type { Task, TaskStatus } from '@/types/task.types'
import { useTasksStore } from '@/stores/tasks.store'
import { useUIStore } from '@/stores/ui.store'

const props = defineProps<{ tasks: Task[] }>()
const emit = defineEmits<{
  (e: 'open-detail', task: Task): void
  (e: 'edit', task: Task): void
  (e: 'duplicate', task: Task): void
  (e: 'delete', id: string): void
}>()

const tasksStore = useTasksStore()
const uiStore = useUIStore()

const columns = [
  {
    id: 'todo' as TaskStatus,
    title: 'À faire',
    bg: 'bg-neutral-50',
    border: 'border-t-neutral-300',
    dot: 'bg-neutral-400',
    count_color: 'bg-neutral-200 text-neutral-600',
  },
  {
    id: 'in_progress' as TaskStatus,
    title: 'En cours',
    bg: 'bg-blue-50',
    border: 'border-t-blue-400',
    dot: 'bg-blue-500',
    count_color: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'done' as TaskStatus,
    title: 'Terminé',
    bg: 'bg-green-50',
    border: 'border-t-green-400',
    dot: 'bg-green-500',
    count_color: 'bg-green-100 text-green-700',
  },
  {
    id: 'rescheduled' as TaskStatus,
    title: 'Reporté',
    bg: 'bg-yellow-50',
    border: 'border-t-yellow-400',
    dot: 'bg-yellow-500',
    count_color: 'bg-yellow-100 text-yellow-700',
  },
]

// Listes réactives par colonne
const lists = ref<Record<string, Task[]>>({
  todo: [],
  in_progress: [],
  done: [],
  rescheduled: [],
})

watch(() => props.tasks, (newTasks) => {
  if (!newTasks) return
  lists.value.todo = newTasks.filter(t => t.status === 'todo')
  lists.value.in_progress = newTasks.filter(t => t.status === 'in_progress')
  lists.value.done = newTasks.filter(t => t.status === 'done')
  lists.value.rescheduled = newTasks.filter(t => t.status === 'rescheduled')
}, { immediate: true, deep: true })

async function onAdd(evt: any, newStatus: TaskStatus) {
  const task: Task = evt.data
  if (!task || task.status === newStatus) return
  try {
    await tasksStore.updateTask(task.id, { status: newStatus })
  } catch (e) {
    console.error('Erreur mise à jour statut kanban:', e)
  }
}
</script>

<template>
  <div class="w-full h-full min-h-[400px]">
    <!-- Debug (optionnel, à retirer plus tard) -->
    <div v-if="false" class="mb-4 p-2 bg-blue-100 text-blue-800 text-xs rounded">
      Kanban chargé avec {{ tasks.length }} tâches.
    </div>

    <div class="flex gap-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 px-1">
    <div
      v-for="col in columns"
      :key="col.id"
      :class="[
        'flex-shrink-0 w-72 flex flex-col rounded-2xl border border-neutral-200 border-t-4 shadow-sm',
        col.border, col.bg
      ]"
    >
      <!-- Header de colonne -->
      <div class="p-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2">
          <div :class="['w-2.5 h-2.5 rounded-full', col.dot]"></div>
          <h3 class="font-display font-bold text-neutral-800 text-sm">{{ col.title }}</h3>
          <span :class="['text-xs font-bold px-2 py-0.5 rounded-full', col.count_color]">
            {{ lists[col.id].length }}
          </span>
        </div>
        <button
          @click="uiStore.openTaskForm()"
          class="p-1.5 hover:bg-white/80 rounded-lg text-neutral-400 hover:text-primary-600 transition-all hover:shadow-sm"
          :title="`Nouvelle tâche — ${col.title}`"
        >
          <Plus class="h-4 w-4" />
        </button>
      </div>

      <!-- Zone Draggable scrollable -->
      <VueDraggable
        v-model="lists[col.id]"
        group="tasks"
        :animation="180"
        ghost-class="opacity-40 scale-95"
        drag-class="rotate-1 shadow-2xl"
        class="flex-1 overflow-y-auto px-3 pb-3 space-y-3 min-h-[100px]"
        @add="(evt: any) => onAdd(evt, col.id)"
      >
        <div
          v-for="task in lists[col.id]"
          :key="task.id"
          class="transition-transform duration-150"
        >
          <TaskCard
            :task="task"
            @click="$emit('open-detail', task)"
            @edit="$emit('edit', $event)"
            @duplicate="$emit('duplicate', $event)"
            @delete="$emit('delete', $event)"
          />
        </div>

        <!-- Empty state per column -->
        <div
          v-if="!lists[col.id].length"
          class="flex flex-col items-center justify-center py-8 text-center"
        >
          <div class="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center mb-2">
            <Plus class="h-4 w-4 text-neutral-300" />
          </div>
          <p class="text-xs text-neutral-400">Glisse une tâche ici</p>
        </div>
      </VueDraggable>
    </div>
  </div>
</div>
</template>

<style scoped>
/* Scrollbar colonnes */
.overflow-y-auto::-webkit-scrollbar { width: 4px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

/* Scrollbar horizontal */
.overflow-x-auto::-webkit-scrollbar { height: 6px; }
.overflow-x-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-x-auto::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
</style>
