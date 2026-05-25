<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['select'])

const timer = ref(5)
const maxTimer = 5
let interval: ReturnType<typeof setInterval> | null = null

const moods = [
  { id: 'happy', emoji: '😊', label: 'Content', color: 'hover:shadow-green-200 hover:bg-green-50 border-green-100' },
  { id: 'super_productive', emoji: '🚀', label: 'Productif', color: 'hover:shadow-blue-200 hover:bg-blue-50 border-blue-100' },
  { id: 'enriching', emoji: '💡', label: 'Enrichissant', color: 'hover:shadow-amber-200 hover:bg-amber-50 border-amber-100' },
  { id: 'neutral', emoji: '😐', label: 'Neutre', color: 'hover:shadow-neutral-200 hover:bg-neutral-50 border-neutral-100' },
  { id: 'too_hard', emoji: '😤', label: 'Difficile', color: 'hover:shadow-orange-200 hover:bg-orange-50 border-orange-100' },
  { id: 'stressful', emoji: '😰', label: 'Stressant', color: 'hover:shadow-red-200 hover:bg-red-50 border-red-100' },
  { id: 'boring', emoji: '😴', label: 'Ennuyeux', color: 'hover:shadow-indigo-200 hover:bg-indigo-50 border-indigo-100' },
  { id: 'nothing_learned', emoji: '🤔', label: 'Rien appris', color: 'hover:shadow-purple-200 hover:bg-purple-50 border-purple-100' },
]

onMounted(() => {
  timer.value = maxTimer
  interval = setInterval(() => {
    timer.value--
    if (timer.value <= 0) {
      handleSelect('neutral')
    }
  }, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const handleSelect = (id: string) => {
  if (interval) clearInterval(interval)
  emit('select', id)
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => !val && handleSelect('neutral')">
    <DialogContent class="sm:max-w-md rounded-2xl p-6 border border-neutral-100 shadow-xl animate-slide-up-modal">
      <DialogHeader class="text-center space-y-2">
        <DialogTitle class="text-xl font-display font-bold text-neutral-800">
          Comment tu te sens après cette tâche ?
        </DialogTitle>
        <DialogDescription class="text-sm text-neutral-500 font-medium">
          Tap sur ton humeur du moment
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-4 gap-4 py-4">
        <button 
          v-for="mood in moods" 
          :key="mood.id"
          @click="handleSelect(mood.id)"
          class="flex flex-col items-center gap-2 p-3 rounded-2xl border border-transparent transition-all hover:scale-110 active:scale-95 shadow-sm group"
          :class="mood.color"
        >
          <span class="text-4xl group-hover:animate-bounce-short">{{ mood.emoji }}</span>
          <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-tight">{{ mood.label }}</span>
        </button>
      </div>

      <!-- Timer Progress Bar -->
      <div class="space-y-2 mt-4">
        <div class="flex justify-between items-center text-[10px] font-bold text-neutral-400 uppercase">
          <span>Fermeture automatique</span>
          <span>{{ timer }}s</span>
        </div>
        <div class="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div 
            class="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            :style="{ width: `${(timer / maxTimer) * 100}%` }"
          ></div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.animate-slide-up-modal {
  animation: slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpModal {
  from { transform: translateY(100%) scale(0.9); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.animate-bounce-short {
  animation: bounceShort 0.6s ease-out;
}

@keyframes bounceShort {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
