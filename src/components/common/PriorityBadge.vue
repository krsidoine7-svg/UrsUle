<template>
  <span :class="['inline-flex items-center gap-1 text-xs font-semibold', priorityConfig[priority].class]">
    <component :is="priorityConfig[priority].icon" class="h-3.5 w-3.5" />
    {{ priorityConfig[priority].label }}
  </span>
</template>

<script setup lang="ts">
import { ArrowDown, Minus, ArrowUp, Flame } from 'lucide-vue-next'
import type { TaskPriority } from '@/types/task.types'

defineProps<{
  priority: TaskPriority
}>()

const priorityConfig = {
  low:    { class: 'text-neutral-400', icon: ArrowDown, label: 'Faible' },
  normal: { class: 'text-blue-600',    icon: Minus,     label: 'Normale' },
  high:   { class: 'text-amber-600',   icon: ArrowUp,   label: 'Haute' },
  urgent: { class: 'text-red-600',     icon: Flame,     label: 'Urgente' },
}
</script>
