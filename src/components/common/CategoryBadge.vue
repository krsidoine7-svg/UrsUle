<template>
  <span 
    v-if="category"
    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm"
    :style="{ backgroundColor: category.color }"
  >
    {{ category.name }}
  </span>
</template>

<script setup lang="ts">
import type { Category } from '@/types/user.types'

defineProps<{
  category?: Category
}>()
</script>
