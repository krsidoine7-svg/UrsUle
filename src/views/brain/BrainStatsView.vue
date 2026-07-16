<script setup lang="ts">
import BrainStats from '@/components/brain/stats/BrainStats.vue'
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto h-full">
    <div class="space-y-1">
      <h1 class="text-2xl md:text-3xl font-display font-black text-neutral-900 tracking-tight">Statistiques du Second Cerveau</h1>
      <p class="text-xs md:text-sm text-neutral-400 font-medium">Analyse tes écrits, tes connexions, tes révisions et l'assiduité de ton journal.</p>
    </div>
    
    <BrainStats />
  </div>
</template>
