<script setup lang="ts">
import TaskCard from './TaskCard.vue'
import type { Task } from '@/types/task.types'

defineProps<{
  tasks: Task[]
  isTrash?: boolean
}>()

defineEmits<{
  (e: 'open-detail', task: Task): void
  (e: 'edit', task: Task): void
  (e: 'delete', id: string): void
  (e: 'duplicate', task: Task): void
  (e: 'restore', task: Task): void
  (e: 'delete-permanent', id: string): void
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div
      v-for="(task, index) in tasks"
      :key="task.id"
      class="animate-stagger"
      :style="{ animationDelay: `${index * 50}ms` }"
    >
      <TaskCard
        :task="task"
        :is-trash="isTrash"
        @click="$emit('open-detail', task)"
        @edit="$emit('edit', $event)"
        @duplicate="$emit('duplicate', $event)"
        @delete="$emit('delete', $event)"
        @restore="$emit('restore', $event)"
        @delete-permanent="$emit('delete-permanent', $event)"
      />
    </div>
  </div>

  <div v-if="!tasks.length" class="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
    <p class="text-neutral-400 italic">Aucune tâche à afficher.</p>
  </div>
</template>

<style scoped>
.animate-stagger {
  animation: fadeInUp 0.4s ease-out both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
