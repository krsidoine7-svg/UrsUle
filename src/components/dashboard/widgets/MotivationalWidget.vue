<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getRandomQuote } from '@/services/motivational.service'
import { Quote, Sparkles, RefreshCcw } from 'lucide-vue-next'

const currentQuote = ref(getRandomQuote())

function refreshQuote() {
  currentQuote.value = getRandomQuote()
}

onMounted(() => {
  // Optionnel: rafraîchir toutes les 30 minutes
  setInterval(refreshQuote, 30 * 60 * 1000)
})
</script>

<template>
  <div class="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
    <div class="relative z-10 flex flex-col h-full">
      <div class="flex items-center justify-between mb-6">
        <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
          <Quote class="h-5 w-5 text-white" />
        </div>
        <button 
          @click="refreshQuote" 
          class="p-2 rounded-full hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
        >
          <RefreshCcw class="h-4 w-4" />
        </button>
      </div>

      <p class="text-xl font-display font-bold leading-relaxed mb-4">
        "{{ currentQuote.text }}"
      </p>
      
      <div class="mt-auto flex items-center gap-2">
        <Sparkles class="h-4 w-4 text-indigo-200" />
        <span class="text-xs font-bold uppercase tracking-widest text-indigo-100">
          Inspiration par {{ currentQuote.author }}
        </span>
      </div>
    </div>

    <!-- Background Decor -->
    <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-20 -left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
  </div>
</template>
