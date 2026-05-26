<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTimer } from '@/composables/useTimer'
import { useTasksStore } from '@/stores/tasks.store'
import { useAuthStore } from '@/stores/auth.store'
import { statsService } from '@/services/stats.service'
import { 
  Play, 
  Pause, 
  Square, 
  ChevronUp, 
  ChevronDown, 
  Timer as TimerIcon, 
  Clock,
  Save,
  Trash2,
  ListTodo,
  AlertTriangle
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const { 
  isRunning, 
  mode, 
  display, 
  start, 
  pause, 
  stop, 
  reset,
  setTimer, 
  setChrono, 
  elapsedSeconds,
  currentTaskId 
} = useTimer()

const tasksStore = useTasksStore()
const authStore = useAuthStore()
const { toast } = useToast()

const isExpanded = ref(false)
const timerHours = ref(0)
const timerMinutes = ref(25)
const timerSeconds = ref(0)
const showSaveConfirm = ref(false)
const showDiscardConfirm = ref(false)
const stoppedDuration = ref(0)
const todayTotalMinutesReal = ref(0)

const availableTasks = computed(() => {
  return tasksStore.tasks.filter(t => t.status !== 'done')
})

const currentTask = computed(() => {
  if (!currentTaskId.value) return null
  return tasksStore.tasks.find(t => t.id === currentTaskId.value)
})

const formattedTodayTotal = computed(() => {
  const h = Math.floor(todayTotalMinutesReal.value)
  const m = Math.round((todayTotalMinutesReal.value % 1) * 60)
  return `${h}h ${m.toString().padStart(2, '0')}min`
})

const fetchTodayTime = async () => {
  if (!authStore.user?.id) return
  try {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const hours = await statsService.getTotalTime(authStore.user.id, start, end)
    todayTotalMinutesReal.value = hours
  } catch (e) {
    console.error('Failed to fetch today time', e)
  }
}

const handleStop = () => {
  const result = stop()
  stoppedDuration.value = result.minutes
  if (result.minutes > 0) {
    showSaveConfirm.value = true
  } else {
    reset()
  }
}

const saveSession = async () => {
  if (!currentTaskId.value) return
  
  try {
    await tasksStore.addTimeSession(currentTaskId.value, stoppedDuration.value)
    toast({
      title: 'Session enregistrée',
      description: `${stoppedDuration.value} minutes ajoutées à la tâche.`
    })
    showSaveConfirm.value = false
    reset()
    fetchTodayTime()
  } catch (e: any) {
    toast({
      title: 'Erreur',
      description: e.message,
      variant: 'destructive'
    })
  }
}

const discardSession = () => {
  showDiscardConfirm.value = false
  showSaveConfirm.value = false
  reset()
}

const selectTask = (id: any) => {
  currentTaskId.value = id || null
}

onMounted(() => {
  if ('Notification' in window) {
    Notification.requestPermission()
  }
  fetchTodayTime()
  if (tasksStore.tasks.length === 0) {
    tasksStore.fetchTasks()
  }
})

// Mettre à jour le temps total quand une session est sauvegardée
watch(isRunning, (newVal, oldVal) => {
  if (oldVal && !newVal && !showSaveConfirm.value) {
    fetchTodayTime()
  }
})
</script>

<template>
  <div 
    class="fixed bottom-6 right-6 z-50 transition-all duration-300"
    :class="[isExpanded ? 'w-80' : 'w-auto']"
  >
    <!-- Collapsed View / Toggle -->
    <div 
      v-if="!isExpanded"
      @click="isExpanded = true"
      class="flex items-center gap-3 bg-white border border-neutral-200 p-2 pl-4 rounded-2xl shadow-2xl cursor-pointer hover:shadow-primary-100/50 transition-all group"
    >
      <div class="relative">
        <div 
          v-if="isRunning" 
          class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"
        ></div>
        <TimerIcon class="h-5 w-5 text-primary-600" />
      </div>
      <span class="font-mono font-bold text-lg text-neutral-800">{{ display }}</span>
      <div class="p-1.5 rounded-lg bg-neutral-50 group-hover:bg-primary-50 transition-colors">
        <ChevronUp class="h-4 w-4 text-neutral-400 group-hover:text-primary-600" />
      </div>
    </div>

    <!-- Expanded View -->
    <div 
      v-else
      class="bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="p-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <TimerIcon class="h-4 w-4 text-primary-600" />
          <span class="text-xs font-bold uppercase tracking-wider text-neutral-500">Focus Session</span>
        </div>
        <button @click="isExpanded = false" class="p-1 hover:bg-neutral-100 rounded-lg transition-colors">
          <ChevronDown class="h-4 w-4 text-neutral-400" />
        </button>
      </div>

      <div class="p-6 space-y-6">
        <!-- Task Selection -->
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1.5">
            <ListTodo class="h-3 w-3" /> Travailler sur
          </label>
          <Select :model-value="currentTaskId || ''" @update:model-value="selectTask" :disabled="isRunning || showSaveConfirm">
            <SelectTrigger class="w-full bg-neutral-50 border-neutral-100 rounded-xl focus:ring-primary-500">
              <SelectValue placeholder="Choisir une tâche..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="task in availableTasks" :key="task.id" :value="task.id">
                {{ task.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Task Context (active) -->
        <div v-if="currentTask && isRunning" class="p-3 bg-primary-50 rounded-xl border border-primary-100 animate-in fade-in slide-in-from-top-2">
          <p class="text-[10px] font-bold text-primary-600 uppercase mb-1">Tâche en cours</p>
          <p class="text-sm font-bold text-neutral-800 truncate">{{ currentTask.title }}</p>
        </div>

        <!-- Mode Switcher -->
        <div v-if="!isRunning && !showSaveConfirm" class="flex p-1 bg-neutral-100 rounded-xl">
          <button 
            @click="setChrono"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="[mode === 'chrono' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
          >
            Chrono ↑
          </button>
          <button 
            @click="setTimer(timerHours, timerMinutes, timerSeconds)"
            class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
            :class="[mode === 'timer' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-700']"
          >
            Timer ↓
          </button>
        </div>

        <!-- Timer Display -->
        <div class="text-center space-y-2">
          <div class="font-mono text-5xl font-bold text-neutral-900 tracking-tight">
            {{ display }}
          </div>
          <Badge v-if="isRunning" variant="secondary" class="bg-red-50 text-red-600 animate-pulse border-red-100">
            Session active
          </Badge>
        </div>

        <!-- Timer Controls -->
        <div v-if="!showSaveConfirm" class="flex justify-center items-center gap-4">
          <Button 
            v-if="!isRunning" 
            @click="start()"
            :disabled="!currentTaskId"
            class="h-14 w-14 rounded-full bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200 disabled:opacity-50 disabled:grayscale"
          >
            <Play class="h-6 w-6 fill-white" />
          </Button>
          <Button 
            v-else 
            @click="pause"
            variant="outline"
            class="h-14 w-14 rounded-full border-neutral-200"
          >
            <Pause class="h-6 w-6 text-neutral-800 fill-neutral-800" />
          </Button>

          <Button 
            @click="handleStop"
            variant="ghost"
            class="h-12 w-12 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50"
            :disabled="!isRunning && elapsedSeconds === 0"
          >
            <Square class="h-5 w-5 fill-current" />
          </Button>
        </div>

        <!-- Save Session Confirmation -->
        <div v-else class="space-y-4 animate-fade-in">
          <div class="text-center py-2">
            <h4 class="font-bold text-neutral-800">Session terminée</h4>
            <p class="text-sm text-neutral-500">{{ stoppedDuration }} minutes travaillées</p>
          </div>
          <div class="flex gap-2">
            <Button @click="showDiscardConfirm = true" variant="outline" class="flex-1 rounded-xl">
              <Trash2 class="h-4 w-4 mr-2" /> Jeter
            </Button>
            <Button @click="saveSession" class="flex-1 bg-green-600 hover:bg-green-700 rounded-xl">
              <Save class="h-4 w-4 mr-2" /> Enregistrer
            </Button>
          </div>
        </div>

        <!-- Timer Configuration (if in timer mode and stopped) -->
        <div v-if="mode === 'timer' && !isRunning && !showSaveConfirm" class="space-y-3 pt-2">
          <label class="text-[10px] font-bold text-neutral-400 uppercase">Durée (minutes)</label>
          <div class="flex gap-2">
            <Button 
              v-for="m in [15, 25, 45]" 
              :key="m"
              variant="outline"
              size="sm"
              class="flex-1 text-xs rounded-lg transition-all hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
              @click="timerHours = 0; timerMinutes = m; timerSeconds = 0; setTimer(0, m, 0)"
            >
              {{ m }}
            </Button>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 space-y-1">
              <label class="text-[8px] text-neutral-400 uppercase text-center block">H</label>
              <Input 
                type="number" 
                v-model="timerHours" 
                min="0"
                max="23"
                class="w-full h-8 text-xs text-center rounded-lg border-neutral-200 focus:ring-primary-500" 
                @input="setTimer(timerHours, timerMinutes, timerSeconds)"
              />
            </div>
            <div class="flex-1 space-y-1">
              <label class="text-[8px] text-neutral-400 uppercase text-center block">M</label>
              <Input 
                type="number" 
                v-model="timerMinutes" 
                min="0"
                max="59"
                class="w-full h-8 text-xs text-center rounded-lg border-neutral-200 focus:ring-primary-500" 
                @input="setTimer(timerHours, timerMinutes, timerSeconds)"
              />
            </div>
            <div class="flex-1 space-y-1">
              <label class="text-[8px] text-neutral-400 uppercase text-center block">S</label>
              <Input 
                type="number" 
                v-model="timerSeconds" 
                min="0"
                max="59"
                class="w-full h-8 text-xs text-center rounded-lg border-neutral-200 focus:ring-primary-500" 
                @input="setTimer(timerHours, timerMinutes, timerSeconds)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Stats -->
      <div class="mt-auto p-4 bg-neutral-50 border-t border-neutral-100">
        <div class="flex items-center justify-between text-xs font-medium text-neutral-500">
          <span class="flex items-center gap-1.5">
            <Clock class="h-3 w-3" /> Aujourd'hui
          </span>
          <span class="font-bold text-neutral-800">{{ formattedTodayTotal }}</span>
        </div>
      </div>
    </div>

    <!-- Confirmation Discard -->
    <AlertDialog :open="showDiscardConfirm" @update:open="val => { if (!val) showDiscardConfirm = false }">
      <AlertDialogContent class="rounded-2xl border-neutral-100 p-6">
        <AlertDialogHeader>
          <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-2">
            <AlertTriangle class="h-5 w-5 text-red-600" />
          </div>
          <AlertDialogTitle class="text-xl font-display font-bold text-neutral-900">
            Jeter cette session ?
          </AlertDialogTitle>
          <AlertDialogDescription class="text-neutral-500 font-body text-sm">
            Tu es sur le point d'effacer <span class="font-bold text-neutral-900">{{ stoppedDuration }} minutes</span> de travail. Cette session ne sera pas enregistrée dans tes statistiques.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="mt-6 gap-2">
          <AlertDialogCancel class="rounded-xl font-semibold border-neutral-200">
            Continuer
          </AlertDialogCancel>
          <AlertDialogAction 
            @click="discardSession" 
            class="rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white border-none shadow-sm shadow-red-100"
          >
            Oui, jeter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: 'Inter', sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
