<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useTasksStore } from '@/stores/tasks.store'
import type { Task } from '@/types/task.types'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, GripVertical, Plus, Loader2, Pencil, Play, Pause, Calendar, Clock, MoreHorizontal } from 'lucide-vue-next'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast/use-toast'
import { useTimer } from '@/composables/useTimer'
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

const props = defineProps<{
  parentId: string
}>()

const emit = defineEmits<{
  (e: 'update-progress', progress: number): void
  (e: 'open-detail', subtask: Task): void
  (e: 'edit', subtask: Task): void
  (e: 'open-form', parentId: string): void
}>()

const tasksStore = useTasksStore()

const subtasks = computed({
  get: () => tasksStore.getSubtasks(props.parentId),
  set: (newList: Task[]) => {
    const ids = newList.map(t => t.id)
    tasksStore.updateSubtasksOrder(props.parentId, ids)
  }
})

const loading = computed(() => tasksStore.loading)
const adding = ref(false)
const newTitle = ref('')
const editingId = ref<string | null>(null)
const subtaskToDelete = ref<string | null>(null)
const { toast } = useToast()
const { isRunning, currentTaskId, start, pause } = useTimer()

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}

const progress = computed(() => {
  if (subtasks.value.length === 0) return 0
  const completed = subtasks.value.filter(s => s.status === 'done').length
  return Math.round((completed / subtasks.value.length) * 100)
})

function openFullForm() {
  emit('open-form', props.parentId)
}

async function addSubtask() {
  if (!newTitle.value.trim()) return
  adding.value = true
  try {
    await tasksStore.createTask({
      title: newTitle.value,
      parent_task_id: props.parentId,
      status: 'todo'
    })
    newTitle.value = ''
    // Attendre le prochain tick pour que le store soit à jour
    setTimeout(() => emit('update-progress', progress.value), 50)
  } catch (e) {
    toast({ title: 'Erreur', description: 'Impossible de créer la sous-tâche', variant: 'destructive' })
  } finally {
    adding.value = false
  }
}

async function toggleSubtask(subtask: Task) {
  if (!subtask?.id) return
  const newStatus = subtask.status === 'done' ? 'todo' : 'done'
  try {
    await tasksStore.updateTask(subtask.id, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
    })
    setTimeout(() => emit('update-progress', progress.value), 50)
  } catch (e) {
    toast({ title: 'Erreur', description: 'Échec de la mise à jour', variant: 'destructive' })
  }
}

async function deleteSubtask(id: string) {
  if (!id) return
  try {
    await tasksStore.deleteTask(id)
    setTimeout(() => emit('update-progress', progress.value), 50)
    toast({ title: 'Sous-tâche supprimée' })
  } catch (e) {
    toast({ title: 'Erreur', description: 'Échec de la suppression', variant: 'destructive' })
  } finally {
    subtaskToDelete.value = null
  }
}

async function onDragEnd() {
  // Le v-model s'occupe déjà de la mise à jour via le setter de la computed
}

async function updateTitle(subtask: Task, title: string) {
  if (!subtask?.id || !title.trim() || title === subtask.title) {
    editingId.value = null
    return
  }
  try {
    await tasksStore.updateTask(subtask.id, { title })
  } finally {
    editingId.value = null
  }
}

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMM HH:mm', { locale: fr })
}

const isOverdue = (dateStr: string) => {
  return isBefore(new Date(dateStr), new Date())
}
</script>

<template>
  <div class="space-y-6">
    <!-- Progress Section -->
    <div v-if="subtasks.length > 0" class="p-6 bg-neutral-50/50 rounded-[2rem] border border-neutral-100/80 space-y-6">
      <div class="flex items-center justify-between gap-8">
        <div class="flex items-center gap-5">
          <!-- Circular Progress -->
          <div class="relative w-14 h-14 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                stroke-width="5"
                fill="transparent"
                class="text-neutral-200/50"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                stroke-width="5"
                fill="transparent"
                stroke-dasharray="150.8"
                :stroke-dashoffset="150.8 - (150.8 * progress) / 100"
                stroke-linecap="round"
                class="text-primary-600 transition-all duration-1000 ease-out"
              />
            </svg>
            <span class="absolute text-[10px] font-black text-neutral-800">{{ progress }}%</span>
          </div>
          
          <div class="space-y-0.5">
            <h3 class="font-display font-bold text-neutral-900 leading-tight text-base">Progression</h3>
            <p class="text-[11px] font-medium text-neutral-500">
              {{ subtasks.filter(s => s.status === 'done').length }} sur {{ subtasks.length }} terminées
            </p>
          </div>
        </div>

        <div class="flex-1 max-w-[180px] space-y-2">
          <div class="flex justify-between text-[11px] font-medium text-neutral-500">
            <span>Avancement</span>
            <span class="font-bold text-primary-600">{{ progress }}%</span>
          </div>
          <div class="h-1.5 w-full bg-neutral-200/50 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary-600 transition-all duration-700 ease-in-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State / Header if no subtasks -->
    <div v-else class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="font-display font-black text-lg text-neutral-900">Sous-tâches</h3>
        <span class="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-xs font-bold rounded-full">0/0</span>
      </div>
    </div>

    <!-- Subtasks List -->
    <div v-if="loading && subtasks.length === 0" class="flex justify-center py-4">
      <Loader2 class="h-6 w-6 animate-spin text-neutral-300" />
    </div>

    <VueDraggable
      v-else
      v-model="subtasks"
      handle=".drag-handle"
      @end="onDragEnd"
      class="space-y-2"
    >
      <div 
        v-for="subtask in subtasks" 
        :key="subtask.id"
        class="group flex items-center gap-3 p-3 bg-neutral-50 hover:bg-white rounded-2xl border border-transparent hover:border-neutral-100 hover:shadow-sm transition-all"
      >
        <GripVertical class="drag-handle h-4 w-4 text-neutral-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <Checkbox 
          :checked="subtask.status === 'done'" 
          @update:checked="toggleSubtask(subtask)"
          class="rounded-lg border-neutral-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />

        <!-- Timer Toggle -->
        <button 
          v-if="subtask.status !== 'done'"
          class="p-1.5 rounded-lg transition-all"
          :class="[
            isRunning && currentTaskId === subtask.id
              ? 'bg-red-50 text-red-600' 
              : 'hover:bg-primary-50 text-neutral-400 hover:text-primary-600'
          ]"
          @click.stop="isRunning && currentTaskId === subtask.id ? pause() : start(subtask.id)"
        >
          <Pause v-if="isRunning && currentTaskId === subtask.id" class="h-3.5 w-3.5 fill-current" />
          <Play v-else class="h-3.5 w-3.5 fill-current" />
        </button>

        <div class="flex-1 min-w-0">
          <input 
            v-if="editingId === subtask.id"
            v-model="subtask.title"
            @blur="updateTitle(subtask, subtask.title)"
            @keydown.enter="updateTitle(subtask, subtask.title)"
            @click.stop
            class="w-full bg-white border-primary-200 border rounded px-1 focus:ring-1 focus:ring-primary-500 font-bold text-neutral-900"
            v-focus
          />
          <div 
            v-else
            class="flex flex-col gap-0.5 group/title cursor-pointer"
            @click="$emit('open-detail', subtask)"
            @dblclick.stop="editingId = subtask.id"
          >
            <p 
              class="font-bold text-neutral-900 truncate transition-all group-hover/title:text-primary-600"
              :class="{ 'line-through text-neutral-400 opacity-50': subtask.status === 'done' }"
            >
              {{ subtask.title }}
            </p>
            
            <!-- Subtask Metadata -->
            <div class="flex items-center gap-3 text-[10px] font-medium transition-all">
              <span 
                v-if="subtask.deadline" 
                class="flex items-center gap-1"
                :class="isOverdue(subtask.deadline) && subtask.status !== 'done' ? 'text-red-500 animate-pulse' : 'text-neutral-400'"
              >
                <Calendar class="h-3 w-3" />
                {{ formatDate(subtask.deadline) }}
              </span>
              <span v-if="subtask.actual_duration_minutes > 0" class="flex items-center gap-1 text-primary-500">
                <Clock class="h-3 w-3" />
                {{ subtask.actual_duration_minutes }}m
              </span>
              <span v-if="!subtask.deadline && subtask.actual_duration_minutes === 0" class="text-neutral-300 italic">
                Aucune info temporelle
              </span>
            </div>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          class="h-8 w-8 text-neutral-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="$emit('edit', subtask)"
        >
          <Pencil class="h-4 w-4" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          class="h-8 w-8 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="subtaskToDelete = subtask.id"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </VueDraggable>

    <!-- Add Subtask Button -->
    <div class="pt-4">
      <Button 
        variant="outline" 
        class="w-full h-14 rounded-2xl border-dashed border-2 border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-primary-200 hover:text-primary-600 transition-all group gap-2"
        @click.stop="emit('open-form', props.parentId)"
      >
        <div class="w-8 h-8 rounded-xl bg-white border border-neutral-100 flex items-center justify-center group-hover:border-primary-100 group-hover:bg-primary-50 transition-colors">
          <Plus class="h-5 w-5 text-neutral-400 group-hover:text-primary-600" />
        </div>
        <span class="font-bold text-neutral-500 group-hover:text-primary-700">Ajouter une sous-tâche</span>
      </Button>
    </div>

    <!-- Dialog de confirmation de suppression -->
    <AlertDialog :open="!!subtaskToDelete" @update:open="val => { if (!val) subtaskToDelete = null }">
      <AlertDialogContent class="rounded-2xl border-neutral-100 p-6">
        <AlertDialogHeader>
          <AlertDialogTitle class="text-xl font-display font-bold text-neutral-900">
            Supprimer cette sous-tâche ?
          </AlertDialogTitle>
          <AlertDialogDescription class="text-neutral-500 font-body text-sm">
            Cette action est irréversible. La sous-tâche sera définitivement retirée de cette tâche.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="mt-6 gap-2">
          <AlertDialogCancel class="rounded-xl font-semibold border-neutral-200">
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction 
            @click="deleteSubtask(subtaskToDelete!)" 
            class="rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white border-none shadow-sm shadow-red-100"
          >
            Oui, supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
