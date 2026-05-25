<template>
  <span :class="[
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
    statusClasses[status] || 'bg-neutral-100 text-neutral-600'
  ]">
    {{ statusLabels[status] || status }}
  </span>
</template>

<script setup lang="ts">
import type { TaskStatus } from '@/types/task.types'

defineProps<{
  status: TaskStatus
}>()

const statusClasses: Record<TaskStatus, string> = {
  todo:        'bg-neutral-100 text-neutral-600 border border-neutral-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-100',
  done:        'bg-forest-50 text-forest-700 border border-forest-100',
  archived:    'bg-neutral-100 text-neutral-400 border border-neutral-200',
  rescheduled: 'bg-amber-50 text-amber-700 border border-amber-100',
  to_redo:     'bg-red-50 text-red-700 border border-red-100',
}

const statusLabels: Record<TaskStatus, string> = {
  todo:        'À faire',
  in_progress: 'En cours',
  done:        'Terminé',
  archived:    'Archivé',
  rescheduled: 'Reporté',
  to_redo:     'À reprendre',
}
</script>
