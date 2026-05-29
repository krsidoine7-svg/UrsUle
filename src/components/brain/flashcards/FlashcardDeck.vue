<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Play, CheckCircle, Clock, BookOpen } from 'lucide-vue-next'

const props = defineProps<{
  deck: {
    name: string
    totalCards: number
    dueCount: number
    masteryRate: number
  }
}>()

const emit = defineEmits(['review'])

const masteryColor = computed(() => {
  if (props.deck.masteryRate >= 80) return 'text-green-500 bg-green-50 border-green-200'
  if (props.deck.masteryRate >= 50) return 'text-blue-500 bg-blue-50 border-blue-200'
  return 'text-amber-500 bg-amber-50 border-amber-200'
})

const progressGradient = computed(() => {
  if (props.deck.masteryRate >= 80) return 'from-green-400 to-emerald-500'
  if (props.deck.masteryRate >= 50) return 'from-blue-400 to-indigo-500'
  return 'from-amber-400 to-orange-500'
})
</script>

<template>
  <div class="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all flex flex-col group relative overflow-hidden">
    <!-- Background subtle gradient glow on hover -->
    <div class="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-primary-500/5 blur-3xl group-hover:bg-primary-500/10 transition-all"></div>

    <div class="flex items-start justify-between mb-4">
      <div>
        <h4 class="font-bold text-lg text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight mb-1">
          {{ deck.name }}
        </h4>
        <div class="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
          <BookOpen class="w-3.5 h-3.5" />
          <span>{{ deck.totalCards }} carte{{ deck.totalCards > 1 ? 's' : '' }}</span>
        </div>
      </div>
      
      <!-- Mastery badge -->
      <span 
        class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shadow-sm"
        :class="masteryColor"
      >
        {{ deck.masteryRate }}% Maîtrise
      </span>
    </div>

    <!-- Mastery Progress Bar -->
    <div class="space-y-1.5 mb-6">
      <div class="flex justify-between text-xs font-bold text-neutral-500">
        <span>Maîtrise</span>
        <span>{{ deck.masteryRate }}%</span>
      </div>
      <div class="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
        <div 
          class="h-full rounded-full bg-gradient-to-r transition-all duration-500"
          :class="progressGradient"
          :style="{ width: `${deck.masteryRate}%` }"
        ></div>
      </div>
    </div>

    <!-- Cards summary counts -->
    <div class="grid grid-cols-2 gap-4 py-3 bg-neutral-50 rounded-2xl border border-neutral-100 mb-6 shrink-0">
      <div class="text-center border-r border-neutral-200/60">
        <div class="text-2xl font-extrabold text-neutral-800 leading-none mb-1">
          {{ deck.totalCards - deck.dueCount }}
        </div>
        <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
          <CheckCircle class="w-3 h-3 text-green-500" />
          Apprises
        </div>
      </div>
      
      <div class="text-center">
        <div class="text-2xl font-extrabold leading-none mb-1" :class="deck.dueCount > 0 ? 'text-rose-500' : 'text-neutral-800'">
          {{ deck.dueCount }}
        </div>
        <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
          <Clock class="w-3 h-3" :class="deck.dueCount > 0 ? 'text-rose-500' : 'text-neutral-400'" />
          À réviser
        </div>
      </div>
    </div>

    <!-- Bottom Action Button -->
    <div class="mt-auto">
      <Button 
        @click="emit('review', deck.name)"
        class="w-full font-bold py-2.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
        :class="deck.dueCount > 0 
          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-100 hover:shadow-lg' 
          : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-100 hover:shadow-lg'"
      >
        <Play class="w-4 h-4 text-white shrink-0 fill-white" />
        <span>{{ deck.dueCount > 0 ? 'Réviser maintenant' : 'Session libre' }}</span>
      </Button>
    </div>
  </div>
</template>
