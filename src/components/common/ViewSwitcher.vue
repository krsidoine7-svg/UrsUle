<script setup lang="ts">
import { useUIStore } from '@/stores/ui.store'
import { List, LayoutGrid, Columns3, Calendar, Network, Database } from 'lucide-vue-next'

const uiStore = useUIStore()

const views = [
  { id: 'list',     icon: List,        label: 'Liste' },
  { id: 'grid',     icon: LayoutGrid,  label: 'Grille' },
  { id: 'kanban',   icon: Columns3,    label: 'Kanban' },
  { id: 'calendar', icon: Calendar,    label: 'Calendrier' },
  { id: 'database', icon: Database,    label: 'Base' },
  { id: 'graph',    icon: Network,     label: 'Graphe' },
] as const
</script>

<template>
  <div class="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 gap-0.5">
    <button
      v-for="view in views"
      :key="view.id"
      :title="view.label"
      @click="uiStore.activeView = view.id"
      :class="[
        'flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-bold transition-all duration-200',
        uiStore.activeView === view.id
          ? 'bg-primary-600 text-white shadow-sm shadow-primary-200'
          : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/70'
      ]"
    >
      <component :is="view.icon" class="h-4 w-4" />
      <span class="hidden sm:inline">{{ view.label }}</span>
    </button>
  </div>
</template>
