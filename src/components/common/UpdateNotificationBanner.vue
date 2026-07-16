<script setup lang="ts">
import { ref } from 'vue'
import { appUpdateService } from '@/services/appUpdate.service'
import { Sparkles, RefreshCw, X } from 'lucide-vue-next'

const dismissed = ref(false)

function handleUpdate() {
  appUpdateService.applyUpdateAndReload()
}

function handleDismiss() {
  dismissed.value = true
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-8 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-8 opacity-0 scale-95"
  >
    <div
      v-if="appUpdateService.updateAvailable.value && !dismissed"
      class="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96 sm:max-w-sm z-[9999] p-4 rounded-2xl border border-white/20 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-indigo-500/15 flex flex-col gap-3 group"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
          <span class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <Sparkles class="w-4 h-4 animate-pulse" />
          </span>
          <span>Nouvelle version d'UrsUle</span>
        </div>
        <button
          @click="handleDismiss"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-md"
          title="Fermer temporairement"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        Une mise à jour a été déployée avec des optimisations de vitesse et de nouvelles capacités.
      </p>

      <div class="flex items-center justify-end gap-2 pt-1">
        <button
          @click="handleDismiss"
          class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
        >
          Plus tard
        </button>
        <button
          @click="handleUpdate"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-md shadow-indigo-500/25 transition transform active:scale-95"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>Mettre à jour maintenant</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
