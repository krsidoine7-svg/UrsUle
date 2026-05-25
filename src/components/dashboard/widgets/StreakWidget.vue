<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Sparkles } from 'lucide-vue-next'

const props = defineProps<{
  streak: number
}>()

const isHot = computed(() => props.streak >= 3)
</script>

<template>
  <div 
    class="rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between overflow-hidden relative transition-all duration-500"
    :class="[
      isHot 
        ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl shadow-orange-200 scale-[1.02]' 
        : 'bg-white border border-neutral-100'
    ]"
  >
    <div class="relative z-10">
      <h3 
        class="text-xs font-bold uppercase tracking-widest mb-2"
        :class="isHot ? 'text-white/80' : 'text-neutral-400'"
      >
        Productivité
      </h3>
      <div class="flex items-baseline gap-2">
        <span class="text-5xl font-display font-black tracking-tighter">{{ streak }}</span>
        <span class="text-lg font-bold opacity-80">jours</span>
      </div>
      <p 
        class="text-xs font-medium mt-2"
        :class="isHot ? 'text-white/90' : 'text-neutral-500'"
      >
        {{ isHot ? 'Tu es en feu ! Continue comme ça.' : 'Complète une tâche demain pour augmenter ta streak.' }}
      </p>
    </div>

    <div class="relative z-10">
      <div 
        class="w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500"
        :class="isHot ? 'bg-white/20 backdrop-blur-md animate-bounce-short' : 'bg-neutral-50'"
      >
        <Flame 
          v-if="isHot" 
          class="h-10 w-10 text-white fill-white"
        />
        <Sparkles 
          v-else 
          class="h-10 w-10 text-neutral-200"
        />
      </div>
    </div>

    <!-- Background Decoration -->
    <div 
      v-if="isHot"
      class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"
    ></div>
  </div>
</template>

<style scoped>
.animate-bounce-short {
  animation: bounceShort 2s ease-in-out infinite;
}

@keyframes bounceShort {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
