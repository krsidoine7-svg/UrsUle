<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Clock
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useTasksStore } from '@/stores/tasks.store'

const props = defineProps<{
  initialTaskId?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const tasksStore = useTasksStore()
const isRunning = ref(false)
const timeLeft = ref(25 * 60) // 25 minutes
const mode = ref<'work' | 'break'>('work')
const selectedTaskId = ref(props.initialTaskId || '')
const isMuted = ref(false)
const isFullscreen = ref(false)

const activeTask = computed(() => 
  tasksStore.tasks.find(t => t.id === selectedTaskId.value)
)

let timerInterval: any = null

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timerInterval)
  } else {
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        handleTimerComplete()
      }
    }, 1000)
  }
  isRunning.value = !isRunning.value
}

const resetTimer = () => {
  clearInterval(timerInterval)
  isRunning.value = false
  timeLeft.value = mode.value === 'work' ? 25 * 60 : 5 * 60
}

const handleTimerComplete = () => {
  clearInterval(timerInterval)
  isRunning.value = false
  // Play sound if not muted
  if (!isMuted.value) {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')
    audio.play()
  }
  
  if (mode.value === 'work') {
    mode.value = 'break'
    timeLeft.value = 5 * 60
  } else {
    mode.value = 'work'
    timeLeft.value = 25 * 60
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

onUnmounted(() => {
  clearInterval(timerInterval)
})
</script>

<template>
  <div class="fixed inset-0 z-[100] bg-neutral-950 text-white flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
    <!-- Ambient Background Decor -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary-900/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <!-- Top Controls -->
    <div class="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
          <div class="w-2 h-2 rounded-full" :class="mode === 'work' ? 'bg-primary-500' : 'bg-green-500'"></div>
          <span class="text-xs font-black uppercase tracking-widest">{{ mode === 'work' ? 'Focus Session' : 'Pause Zen' }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" @click="isMuted = !isMuted" class="rounded-full hover:bg-white/10 text-white">
          <Volume2 v-if="!isMuted" class="h-5 w-5" />
          <VolumeX v-else class="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" @click="toggleFullscreen" class="rounded-full hover:bg-white/10 text-white">
          <Maximize2 v-if="!isFullscreen" class="h-5 w-5" />
          <Minimize2 v-else class="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" @click="$emit('close')" class="rounded-full hover:bg-white/10 text-white ml-2">
          <X class="h-6 w-6" />
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">
      <!-- Task Badge -->
      <div v-if="activeTask" class="mb-12 animate-in slide-in-from-top-4 duration-1000">
        <p class="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-3">En cours d'exécution</p>
        <h2 class="text-3xl md:text-5xl font-display font-black tracking-tight leading-tight">
          {{ activeTask.title }}
        </h2>
      </div>
      <div v-else class="mb-12 opacity-40">
        <p class="text-sm font-medium italic">Choisis une tâche pour commencer ton immersion</p>
      </div>

      <!-- Timer Display -->
      <div class="relative group cursor-pointer mb-16" @click="toggleTimer">
        <div class="absolute inset-0 bg-primary-500/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
        <div class="text-[12rem] md:text-[18rem] font-display font-black leading-none tracking-tighter tabular-nums select-none transition-all duration-700"
          :class="isRunning ? 'scale-100' : 'scale-95 opacity-50'">
          {{ formatTime(timeLeft) }}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-8 animate-in slide-in-from-bottom-8 duration-1000">
        <Button 
          size="icon" 
          variant="outline" 
          @click="resetTimer"
          class="h-16 w-16 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <RotateCcw class="h-6 w-6" />
        </Button>

        <Button 
          @click="toggleTimer"
          class="h-24 w-24 rounded-full bg-white text-black hover:bg-neutral-200 shadow-2xl shadow-white/10 transition-transform active:scale-95"
        >
          <Pause v-if="isRunning" class="h-10 w-10 fill-current" />
          <Play v-else class="h-10 w-10 fill-current ml-1" />
        </Button>

        <Button 
          size="icon" 
          variant="outline" 
          class="h-16 w-16 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <CheckCircle2 class="h-6 w-6" />
        </Button>
      </div>
    </div>

    <!-- Bottom Quote / Motivation -->
    <div class="absolute bottom-12 text-center opacity-30 px-8">
      <p class="text-sm font-medium tracking-wide uppercase">
        "Le succès est la somme de petits efforts répétés jour après jour."
      </p>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Sora', sans-serif;
}
</style>
