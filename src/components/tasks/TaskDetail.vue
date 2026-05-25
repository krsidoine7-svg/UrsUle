<template>
  <Sheet :open="!!task" @update:open="$emit('close')">
    <SheetContent side="right" class="w-full sm:max-w-xl overflow-y-auto">
      <div v-if="currentTask" class="space-y-8 pb-20">
        <!-- Header -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button 
                v-if="currentTask.parent_task_id" 
                @click="goToParent"
                class="flex items-center gap-1 text-[10px] font-bold text-primary-600 uppercase hover:underline"
              >
                <ArrowLeft class="h-3 w-3" /> Retour au parent
              </button>
              <CategoryBadge v-if="currentTask.category" :category="currentTask.category" />
            </div>
            <div class="flex gap-2 pr-10">
              <template v-if="!currentTask.deleted_at">
                <Button 
                  v-if="!isRunning || currentTaskId !== currentTask.id"
                  variant="outline" 
                  size="sm" 
                  class="border-primary-200 text-primary-700 hover:bg-primary-50"
                  @click="start(currentTask.id)"
                >
                  <Play class="h-4 w-4 mr-2" /> Chrono
                </Button>
                <Button 
                  v-else
                  variant="outline" 
                  size="sm" 
                  class="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                  @click="pause"
                >
                  <Pause class="h-4 w-4 mr-2" /> Pause
                </Button>
                <Button variant="outline" size="sm" @click="$emit('edit', currentTask as any)">
                  <Pencil class="h-4 w-4 mr-2" /> Éditer
                </Button>
                <Button 
                  v-if="currentTask.status !== 'done'"
                  class="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-100" 
                  size="sm" 
                  @click="uiStore.startValidation(currentTask as any)"
                >
                  <CheckCircle2 class="h-4 w-4 mr-2" /> Terminer
                </Button>
              </template>
              <Badge v-else variant="outline" class="border-red-200 text-red-600 font-bold bg-red-50">
                <Trash2 class="h-3 w-3 mr-1" /> Dans la corbeille
              </Badge>
            </div>
          </div>
          <h2 class="font-display text-2xl font-bold text-neutral-900 leading-tight">
            {{ currentTask.title }}
          </h2>
          <div class="flex flex-wrap gap-2">
            <StatusBadge :status="currentTask.status" />
            <PriorityBadge :priority="currentTask.priority" />
            <Badge v-if="currentTask.is_pinned" variant="secondary" class="bg-amber-50 text-amber-700">
              <Pin class="h-3 w-3 mr-1 fill-amber-500" /> Épinglé
            </Badge>
          </div>
        </div>

        <Separator />

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-1">
            <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Échéance</span>
            <div class="flex items-center gap-2 text-sm font-semibold" :class="isOverdue ? 'text-red-500' : 'text-neutral-800'">
              <Calendar class="h-4 w-4" />
              {{ currentTask.deadline ? formatDate(currentTask.deadline) : 'Aucune' }}
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Durée estimée</span>
            <div class="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <Clock class="h-4 w-4" />
              {{ currentTask.estimated_duration_minutes ? formatDuration(currentTask.estimated_duration_minutes) : '-' }}
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Projet</span>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2 text-sm font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded-lg w-fit">
                <FolderOpen class="h-4 w-4" />
                {{ currentTask.project?.name || 'Aucun' }}
              </div>
              <span v-if="currentTask.project_id" class="text-[9px] font-mono text-neutral-400 ml-1">
                ID: {{ currentTask.project_id }}
              </span>
            </div>
          </div>
          <div class="space-y-1">
            <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Créée le</span>
            <div class="flex items-center gap-2 text-sm font-medium text-neutral-500">
              {{ formatDateSimple(currentTask.created_at) }}
            </div>
          </div>
          <div class="space-y-1 col-span-2 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Temps total passé</span>
            <div class="flex items-center gap-2 text-lg font-bold text-neutral-800">
              <Timer class="h-5 w-5 text-primary-600" />
              {{ currentTask.actual_duration_minutes ? formatDuration(currentTask.actual_duration_minutes) : '0 min' }}
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Description</span>
          <RichTextEditor 
            v-if="currentTask.description" 
            :model-value="currentTask.description" 
            readonly 
          />
          <div v-else class="text-sm italic text-neutral-400">
            Aucune description fournie.
          </div>
        </div>

        <!-- Tags -->
        <div v-if="currentTask.tags?.length" class="space-y-2">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Tags</span>
          <div class="flex flex-wrap gap-1.5">
            <Badge v-for="tag in currentTask.tags" :key="tag" variant="outline" class="text-[10px]">
              #{{ tag }}
            </Badge>
          </div>
        </div>

        <!-- Features (Recurrence, Validation) -->
        <div class="grid grid-cols-2 gap-4">
          <div v-if="currentTask.recurrence_type !== 'none'" class="p-3 rounded-lg border border-primary-100 bg-primary-50/50">
            <div class="flex items-center gap-2 text-primary-700 mb-1">
              <RefreshCw class="h-3.5 w-3.5" />
              <span class="text-xs font-bold uppercase">Récurrence</span>
            </div>
            <span class="text-xs font-medium">{{ currentTask.recurrence_type }}</span>
          </div>
          <div v-if="currentTask.validation_type !== 'none'" class="p-3 rounded-lg border border-forest-100 bg-forest-50/50">
            <div class="flex items-center gap-2 text-forest-700 mb-1">
              <ShieldCheck class="h-3.5 w-3.5" />
              <span class="text-xs font-bold uppercase">Validation</span>
            </div>
            <span class="text-xs font-medium">{{ currentTask.validation_type }}</span>
          </div>
        </div>

        <Separator />

        <!-- Sous-tâches -->
        <SubTaskList 
          :parent-id="currentTask.id" 
          @update-progress="currentTask.actual_duration_minutes = currentTask.actual_duration_minutes"
          @open-detail="navigateToTask"
          @edit="$emit('edit', $event)"
          @open-form="onOpenSubtaskForm"
        />

        <Separator />

        <!-- Images -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-semibold text-neutral-800 flex items-center gap-2">
              <ImageIcon class="h-4 w-4" /> Images
            </h3>
            <span class="text-xs text-neutral-400">{{ taskImages.length }}/5</span>
          </div>

          <!-- Galerie -->
          <div v-if="taskImages.length > 0" class="grid grid-cols-4 sm:grid-cols-5 gap-3">
            <div 
              v-for="(image, index) in taskImages" 
              :key="image.id"
              class="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-neutral-200"
              @click="openLightbox(index)"
            >
              <img :src="image.signedUrl" class="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <!-- Overlay supprimer -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  class="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  @click.stop="confirmDeleteImage(image)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Upload -->
          <FileUpload 
            v-if="taskImages.length < 5"
            :max-files="5"
            :current-count="taskImages.length"
            :loading="isUploadingImage"
            @upload="handleImageUpload"
          />
        </div>

        <Separator />

        <!-- Commentaires -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-semibold text-neutral-800">Commentaires</h3>
            <span class="text-xs text-neutral-400">{{ currentTask.comments?.length || 0 }}</span>
          </div>
          
          <div class="space-y-3">
            <div v-for="comment in currentTask.comments" :key="comment.id" class="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-primary-200">
                    <img v-if="comment.user?.avatar_url" :src="comment.user.avatar_url" class="h-full w-full object-cover" />
                    <span v-else class="text-[10px] font-bold text-primary-600">{{ comment.user?.full_name?.charAt(0) || 'U' }}</span>
                  </div>
                  <span class="text-xs font-bold text-neutral-700">{{ comment.user?.full_name || 'Anonyme' }}</span>
                </div>
                <span class="text-[10px] text-neutral-400">{{ formatDateSimple(comment.created_at) }}</span>
              </div>
              <p class="text-sm text-neutral-600">{{ comment.content }}</p>
            </div>
            
            <div v-if="!currentTask.comments?.length" class="text-center py-6">
              <MessageSquare class="h-8 w-8 text-neutral-200 mx-auto mb-2" />
              <p class="text-xs text-neutral-400 italic">Pas encore de commentaires.</p>
            </div>
          </div>
          
          <div class="flex gap-2">
            <Input 
              v-model="commentContent"
              placeholder="Ajouter un commentaire..." 
              class="bg-white" 
              @keydown.enter="submitComment"
            />
            <Button 
              size="icon" 
              variant="default" 
              class="bg-primary-600"
              :disabled="!commentContent.trim()"
              @click="submitComment"
            >
              <Send class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>

    <!-- Lightbox -->
    <Lightbox 
      v-if="lightboxOpen"
      :is-open="lightboxOpen"
      :images="taskImages"
      :initial-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </Sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  X, Pencil, Pin, Calendar, Clock, FolderOpen, 
  RefreshCw, ShieldCheck, MessageSquare, Send,
  Play, Pause, Timer, CheckCircle2, Image as ImageIcon, Trash2,
  ArrowLeft
} from 'lucide-vue-next'
import { useTimer } from '@/composables/useTimer'
import { useUIStore } from '@/stores/ui.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import CategoryBadge from '@/components/common/CategoryBadge.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import SubTaskList from '@/components/tasks/SubTaskList.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import Lightbox from '@/components/common/Lightbox.vue'
import { storageService } from '@/services/storage.service'
import type { Task } from '@/types/task.types'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTasksStore } from '@/stores/tasks.store'
import { tasksService } from '@/services/tasks.service'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  task: Task | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', task: Task): void
  (e: 'update-task', task: Task): void
  (e: 'open-subtask-form', parentId: string): void
}>()

const tasksStore = useTasksStore()
const uiStore = useUIStore()
const { toast } = useToast()
const { isRunning, currentTaskId, start, pause } = useTimer()
const commentContent = ref('')

function onOpenSubtaskForm(parentId: string) {
  // On ferme d'abord le panneau de détail pour éviter que les deux Sheets
  // ne se superposent, puis on ouvre le formulaire de création
  emit('close')
  setTimeout(() => {
    uiStore.openTaskForm(null, { parent_task_id: parentId })
  }, 300) // délai pour laisser l'animation de fermeture du Sheet se terminer
}

const currentTask = computed(() => 
  props.task ? tasksStore.tasks.find(t => t.id === props.task!.id) || props.task : null
)

const taskImages = ref<any[]>([])
const isUploadingImage = ref(false)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

watch(() => props.task?.id, async (newId) => {
  if (newId) {
    loadImages(newId)
  }
}, { immediate: true })

async function loadImages(taskId: string) {
  try {
    taskImages.value = await storageService.getTaskImages(taskId)
  } catch (e) {
    console.error('Erreur chargement images:', e)
  }
}

async function navigateToTask(subtask: Task) {
  try {
    const fullTask = await tasksService.getById(subtask.id)
    emit('update-task', fullTask)
  } catch (e: any) {
    console.error(e)
    toast({ title: 'Erreur', description: 'Impossible de charger les détails', variant: 'destructive' })
  }
}

async function goToParent() {
  if (!props.task?.parent_task_id) return
  try {
    const parentTask = await tasksService.getById(props.task.parent_task_id)
    emit('update-task', parentTask)
  } catch (e: any) {
    console.error(e)
    toast({ title: 'Erreur', description: 'Impossible de charger le parent', variant: 'destructive' })
  }
}

async function handleImageUpload(file: File) {
  if (!props.task) return
  isUploadingImage.value = true
  try {
    const newImage = await storageService.uploadImage(file, props.task.id)
    taskImages.value.push(newImage)
    toast({ title: 'Image ajoutée 📸' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    isUploadingImage.value = false
  }
}

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function confirmDeleteImage(image: any) {
  if (confirm('Supprimer cette image définitivement ?')) {
    deleteImage(image)
  }
}

async function deleteImage(image: any) {
  try {
    await storageService.deleteImage(image.id, image.storage_path)
    taskImages.value = taskImages.value.filter(img => img.id !== image.id)
    toast({ title: 'Image supprimée 🗑️' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function submitComment() {
  if (!commentContent.value.trim() || !currentTask.value) return
  try {
    await tasksStore.addComment(currentTask.value.id, commentContent.value)
    commentContent.value = ''
    toast({ title: 'Commentaire ajouté ! 💬' })
  } catch (e: any) {
    console.error('Erreur commentaire:', e)
    toast({ 
      title: 'Erreur', 
      description: e.message || 'Impossible d\'enregistrer le commentaire.', 
      variant: 'destructive' 
    })
  }
}

const formatDate = (dateStr: string) => {
  return format(new Date(dateStr), 'dd MMMM yyyy à HH:mm', { locale: fr })
}

const formatDateSimple = (dateStr: string) => {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: fr })
}

const formatDuration = (min: number) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const isOverdue = computed(() => {
  return props.task?.deadline && isBefore(new Date(props.task.deadline), new Date()) && props.task.status !== 'done'
})
</script>
