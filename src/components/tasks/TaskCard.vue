<template>
  <div 
    :class="[
      'bg-white rounded-xl border border-neutral-200 p-4 hover:border-primary-300 hover:shadow-md',
      'transition-all duration-200 cursor-pointer group relative',
      task.is_pinned && 'border-l-4 border-l-amber-400 bg-amber-50/30',
      !task.is_pinned && task.color && `border-l-4`,
      isCurrentTaskRunning && 'ring-2 ring-primary-500 border-primary-500'
    ]"
    :style="!task.is_pinned && task.color ? { borderLeftColor: task.color } : {}"
    @click="$emit('click', task)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <!-- Mode Corbeille Simplifié -->
      <div v-if="isTrash" class="flex flex-col w-full gap-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-bold text-neutral-800 line-clamp-1 flex-1">
            {{ task.title }}
          </span>
          <div class="flex items-center gap-1.5" @click.stop>
            <Button 
              variant="outline" 
              size="sm" 
              class="h-8 px-2 text-[10px] font-black uppercase tracking-wider border-green-200 text-green-600 hover:bg-green-50 rounded-lg"
              @click.stop="$emit('restore', task)"
            >
              <RotateCcw class="h-3 w-3 mr-1" /> Restaurer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              class="h-8 px-2 text-[10px] font-black uppercase tracking-wider border-red-100 text-red-500 hover:bg-red-50 rounded-lg"
              @click.stop="$emit('delete-permanent', task.id)"
            >
              <Trash2 class="h-3 w-3 mr-1" /> Supprimer
            </Button>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="flex-1">
          <span class="text-sm font-semibold text-neutral-800 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {{ task.title }}
          </span>
          <div v-if="subtasks.length" class="mt-1.5 w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-green-500 transition-all duration-500" 
              :style="{ width: `${Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100)}%` }"
            ></div>
          </div>
        </div>
        
        <div class="flex items-center gap-1" @click.stop>
          <!-- Timer Quick Start -->
          <button 
            v-if="task.status !== 'done'"
            class="p-1.5 rounded-lg transition-all"
            :class="[
              isCurrentTaskRunning 
                ? 'bg-red-50 text-red-600' 
                : 'hover:bg-primary-50 text-neutral-400 hover:text-primary-600'
            ]"
            @click.stop="handleTimerToggle"
            :title="isCurrentTaskRunning ? 'Mettre en pause le timer' : 'Lancer le timer'"
          >
            <Pause v-if="isCurrentTaskRunning" class="h-4 w-4 fill-current" />
            <Play v-else class="h-4 w-4 fill-current" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button class="p-1 hover:bg-neutral-100 rounded-md text-neutral-400">
                <MoreVertical class="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44 rounded-xl shadow-xl">
              <DropdownMenuItem @click="$emit('edit', task)" class="cursor-pointer">
                <Pencil class="mr-2 h-4 w-4" /> Éditer
              </DropdownMenuItem>
              <DropdownMenuItem @click="requestDuplicate" class="cursor-pointer">
                <Copy class="mr-2 h-4 w-4" /> Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem @click="togglePin" class="cursor-pointer">
                <Pin class="mr-2 h-4 w-4" /> {{ task.is_pinned ? 'Désépingler' : 'Épingler' }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="requestArchive" class="cursor-pointer">
                <Archive class="mr-2 h-4 w-4" /> Archiver
              </DropdownMenuItem>
              <DropdownMenuItem @click="requestDelete" class="text-red-600 focus:text-red-600 font-bold cursor-pointer">
                <Trash2 class="mr-2 h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            v-if="task.status !== 'done'"
            class="p-1 hover:bg-green-50 rounded-md text-green-600"
            @click.stop="uiStore.startValidation(task)"
            title="Terminer la tâche"
          >
            <CheckCircle2 class="h-4 w-4" />
          </button>
        </div>
      </template>
    </div>

    <!-- Badges -->
    <div class="flex flex-wrap items-center gap-1.5 mb-3">
      <StatusBadge :status="task.status" />
      <PriorityBadge :priority="task.priority" />
      <CategoryBadge v-if="task.category" :category="task.category" />
      <Badge 
        v-if="task.recurrence_type && task.recurrence_type !== 'none'" 
        variant="outline" 
        class="border-purple-250 bg-purple-50 text-purple-700 font-extrabold text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-md flex items-center gap-1"
      >
        <Repeat class="w-3 h-3 text-purple-600 animate-spin-slow" />
        {{ recurrenceLabels[task.recurrence_type] || task.recurrence_type }}
      </Badge>
    </div>

    <!-- Métadonnées -->
    <div class="flex items-center justify-between mt-auto pt-2 border-t border-neutral-50">
      <div class="flex items-center gap-3 text-[11px] text-neutral-500 font-medium">
        <span v-if="task.deadline" :class="isOverdue(task.deadline) ? 'text-red-500 animate-pulse' : ''" class="flex items-center gap-1">
          <Calendar class="h-3 w-3" />
          {{ formatDate(task.deadline) }}
        </span>
        <span v-if="subtasks.length" class="flex items-center gap-1">
          <CheckSquare class="h-3 w-3" />
          {{ subtasks.filter(s => s.status === 'done').length }}/{{ subtasks.length }}
        </span>
        <span v-if="task.actual_duration_minutes > 0" class="flex items-center gap-1 text-primary-600">
          <Clock class="h-3 w-3" />
          {{ task.actual_duration_minutes }}m
        </span>
      </div>
      
      <div class="flex -space-x-1 overflow-hidden">
        <div v-if="task.appreciation" class="text-sm grayscale hover:grayscale-0 transition-all cursor-default" :title="task.appreciation">
          {{ appreciationEmoji[task.appreciation] }}
        </div>
      </div>
    </div>

    <!-- Confirmation des actions -->
    <AlertDialog :open="!!actionToConfirm" @update:open="val => { if (!val) actionToConfirm = null }">
      <AlertDialogContent class="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle class="font-display text-xl font-bold">{{ actionToConfirm?.title }}</AlertDialogTitle>
          <AlertDialogDescription class="text-neutral-500">
            {{ actionToConfirm?.description }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel class="rounded-xl" @click="actionToConfirm = null">Annuler</AlertDialogCancel>
          <AlertDialogAction 
            class="bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-100"
            @click="executeConfirmedAction"
          >
            {{ actionToConfirm?.confirmText }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Pin, Calendar, CheckSquare, Trash2, CheckCircle2, MoreVertical, Pencil, Copy, Archive, Play, Pause, Clock, RotateCcw,
  Repeat
} from 'lucide-vue-next'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import CategoryBadge from '@/components/common/CategoryBadge.vue'
import { useUIStore } from '@/stores/ui.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useTimer } from '@/composables/useTimer'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Task } from '@/types/task.types'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{
  task: Task
  isTrash?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', task: Task): void
  (e: 'edit', task: Task): void
  (e: 'duplicate', task: Task): void
  (e: 'delete', id: string): void
  (e: 'restore', task: Task): void
  (e: 'delete-permanent', id: string): void
}>()

const uiStore = useUIStore()
const tasksStore = useTasksStore()
const timer = useTimer()
const { toast } = useToast()

const subtasks = computed(() => tasksStore.getSubtasks(props.task.id))

const actionToConfirm = ref<{
  type: 'archive' | 'delete' | 'duplicate'
  title: string
  description: string
  confirmText: string
  isDestructive?: boolean
} | null>(null)

const isCurrentTaskRunning = computed(() => {
  return timer.isRunning.value && timer.currentTaskId.value === props.task.id
})

function handleTimerToggle() {
  if (isCurrentTaskRunning.value) {
    timer.pause()
  } else {
    // Si un autre timer tourne, on prévient ou on switch
    if (timer.isRunning.value) {
      timer.pause()
    }
    timer.start(props.task.id)
    toast({
      title: 'Timer lancé ⏱️',
      description: `Session de focus sur : ${props.task.title}`
    })
  }
}

function requestArchive() {
  actionToConfirm.value = {
    type: 'archive',
    title: 'Archiver cette tâche ?',
    description: 'La tâche sera rangée dans les archives.',
    confirmText: 'Oui, archiver'
  }
}

function requestDelete() {
  emit('delete', props.task.id)
}

function requestDuplicate() {
  actionToConfirm.value = {
    type: 'duplicate',
    title: 'Dupliquer la tâche ?',
    description: 'Une copie sera créée.',
    confirmText: 'Dupliquer'
  }
}

async function executeConfirmedAction() {
  if (!actionToConfirm.value) return
  const { type } = actionToConfirm.value
  
  try {
    if (type === 'archive') {
      await tasksStore.updateTask(props.task.id, { status: 'archived' })
      toast({ title: 'Tâche archivée 📦' })
    } else if (type === 'duplicate') {
      emit('duplicate', props.task)
    }
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    actionToConfirm.value = null
  }
}

async function togglePin() {
  try {
    await tasksStore.updateTask(props.task.id, { is_pinned: !props.task.is_pinned })
    toast({ title: props.task.is_pinned ? 'Désépinglé' : 'Épinglé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

const appreciationEmoji: Record<string, string> = {
  happy: '😊',
  too_hard: '😤',
  boring: '😴',
  nothing_learned: '🤔',
  super_productive: '🚀',
  stressful: '😰',
  enriching: '💡',
  neutral: '😐',
}

const recurrenceLabels: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdo',
  monthly: 'Mensuel',
  custom: 'Perso'
}

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM HH:mm', { locale: fr })
}

const isOverdue = (dateStr: string) => {
  return isBefore(new Date(dateStr), new Date()) && props.task.status !== 'done'
}
</script>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
</style>
