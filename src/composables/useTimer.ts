import { ref, computed, onMounted } from 'vue'

// État global pour persistance hors composant
const isRunning = ref(false)
const mode = ref<'chrono' | 'timer'>('chrono')
const elapsedSeconds = ref(0)
const targetSeconds = ref(0)
const currentTaskId = ref<string | null>(null)
const startTime = ref<number | null>(null)
let interval: ReturnType<typeof setInterval> | null = null

const STORAGE_KEY = 'ursule_timer_state'

// Sons
const START_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
const END_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'

const playSound = (url: string) => {
  try {
    const audio = new Audio(url)
    audio.play()
  } catch (e) {
    console.error('Audio play failed', e)
  }
}

export function useTimer() {
  // Charger l'état depuis le localStorage au premier appel
  const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const state = JSON.parse(saved)
      mode.value = state.mode
      elapsedSeconds.value = state.elapsedSeconds
      targetSeconds.value = state.targetSeconds
      currentTaskId.value = state.currentTaskId
      startTime.value = state.startTime
      isRunning.value = state.isRunning

      if (isRunning.value && startTime.value) {
        // Recalculer le temps écoulé pendant l'absence
        const now = Date.now()
        const diff = Math.floor((now - startTime.value) / 1000)
        elapsedSeconds.value = state.elapsedSeconds + diff
        
        // Relancer l'intervalle
        startInterval()
      }
    }
  }

  const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      mode: mode.value,
      elapsedSeconds: elapsedSeconds.value,
      targetSeconds: targetSeconds.value,
      currentTaskId: currentTaskId.value,
      startTime: startTime.value,
      isRunning: isRunning.value
    }))
  }

  const display = computed(() => {
    const totalS = mode.value === 'chrono' 
      ? elapsedSeconds.value 
      : Math.max(0, targetSeconds.value - elapsedSeconds.value)
    
    const h = Math.floor(totalS / 3600)
    const m = Math.floor((totalS % 3600) / 60)
    const s = totalS % 60
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  const isFinished = computed(() => 
    mode.value === 'timer' && elapsedSeconds.value >= targetSeconds.value
  )

  function startInterval() {
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      elapsedSeconds.value++
      saveState()
      if (isFinished.value) {
        pause()
        notifyFinished()
      }
    }, 1000)
  }

  function start(taskId?: string) {
    if (isRunning.value) return
    if (taskId) currentTaskId.value = taskId
    
    isRunning.value = true
    startTime.value = Date.now()
    startInterval()
    saveState()
    playSound(START_SOUND_URL)
  }

  function pause() {
    isRunning.value = false
    startTime.value = null
    if (interval) {
      clearInterval(interval)
      interval = null
    }
    saveState()
  }

  function stop() {
    const duration = elapsedSeconds.value
    const taskId = currentTaskId.value
    pause()
    elapsedSeconds.value = 0
    saveState()
    return { 
      minutes: Math.ceil(duration / 60),
      seconds: duration,
      taskId 
    }
  }

  function reset() {
    stop()
    currentTaskId.value = null
    saveState()
  }

  function setTimer(hours: number = 0, minutes: number = 0, seconds: number = 0) {
    mode.value = 'timer'
    targetSeconds.value = (hours * 3600) + (minutes * 60) + (seconds || 0)
    elapsedSeconds.value = 0
    saveState()
  }

  function setChrono() {
    mode.value = 'chrono'
    elapsedSeconds.value = 0
    saveState()
  }

  function notifyFinished() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ UrsUle — Timer terminé !', {
        body: 'Ton temps de travail est écoulé.',
        icon: '/favicon.ico'
      })
    }
    playSound(END_SOUND_URL)
  }

  // Initialisation unique
  if (typeof window !== 'undefined' && !interval && isRunning.value === false && localStorage.getItem(STORAGE_KEY)) {
    loadState()
  }

  return { 
    isRunning, 
    mode, 
    display, 
    isFinished, 
    start, 
    pause, 
    stop, 
    reset,
    setTimer, 
    setChrono, 
    elapsedSeconds, 
    currentTaskId,
    saveState
  }
}
