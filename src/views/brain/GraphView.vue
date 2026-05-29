<template>
  <div class="h-full flex flex-col relative">
    
    <!-- Bouton de repli pour l'en-tête du graphe -->
    <button 
      @click="isHeaderOpen = !isHeaderOpen"
      class="absolute top-0 left-[60%] transform -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700 border border-t-0 border-emerald-700 rounded-b-lg px-4 py-0.5 shadow-md z-[60] text-white transition-colors"
      title="Basculer l'en-tête du graphe"
    >
      <ChevronUp v-if="isHeaderOpen" class="w-4 h-4" />
      <ChevronDown v-else class="w-4 h-4" />
    </button>

    <!-- Header -->
    <div 
      class="px-4 sm:px-6 bg-white border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-sm transition-all duration-300 ease-in-out shrink-0"
      :class="isHeaderOpen ? 'py-3 sm:py-4 border-b opacity-100' : 'h-0 py-0 border-b-0 opacity-0 overflow-hidden'"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
          <Network class="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        </div>
        <div>
          <h2 class="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">Graphe de connaissances</h2>
          <p class="text-xs sm:text-sm text-neutral-500">Visualisez les liens entre vos notes</p>
        </div>
      </div>
      
      <!-- Contrôles du Graphe réactifs -->
      <div class="flex flex-wrap items-center gap-3 sm:gap-6" v-if="graphRef">
        <!-- Mode -->
        <div class="flex items-center gap-2">
          <span class="text-xs sm:text-sm text-neutral-500 font-semibold">Mode</span>
          <div class="bg-neutral-100 p-1 rounded-lg flex border border-neutral-200/60 shrink-0">
            <button 
              @click="graphRef?.setMode('tout')"
              :class="['px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200', graphRef?.mode === 'tout' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
            >
              Tout
            </button>
            <button 
              @click="graphRef?.setMode('libres')"
              :class="['px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200', graphRef?.mode === 'libres' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
            >
              Libres
            </button>
            <button 
              @click="graphRef?.setMode('reseau')"
              :class="['px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md transition-all duration-200', graphRef?.mode === 'reseau' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
            >
              Réseau
            </button>
          </div>
        </div>

        <!-- Opacité -->
        <div class="flex items-center gap-2 sm:gap-3 w-32 sm:w-40">
          <span class="text-xs sm:text-sm text-neutral-500 font-semibold whitespace-nowrap">Titres {{ Math.round(graphRef.labelOpacity * 100) }}%</span>
          <input 
            type="range" 
            min="0" max="1" step="0.1" 
            v-model.number="graphRef.labelOpacity" 
            class="w-full accent-green-500 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
            :style="{ background: `linear-gradient(to right, #22c55e ${graphRef.labelOpacity * 100}%, #e5e7eb ${graphRef.labelOpacity * 100}%)` }"
          >
        </div>

        <div class="hidden sm:block h-6 w-px bg-neutral-200"></div>

        <!-- Recentrer -->
        <button 
          @click="graphRef.recenter"
          class="py-1.5 px-3 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm shrink-0"
        >
          <Crosshair class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> Recentrer
        </button>
      </div>
    </div>
    
    <!-- Graph Component -->
    <div class="flex-1 relative">
      <KnowledgeGraph ref="graphRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Network, Crosshair, ChevronUp, ChevronDown } from 'lucide-vue-next'
import KnowledgeGraph from '@/components/brain/graph/KnowledgeGraph.vue'

const graphRef = ref<InstanceType<typeof KnowledgeGraph> | null>(null)
const isHeaderOpen = ref(true)
</script>
