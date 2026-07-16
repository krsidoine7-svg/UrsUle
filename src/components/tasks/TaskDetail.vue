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
                class="flex items-center gap-1 text-[10px] font-bold text-primary-600 uppercase hover:underline max-w-[250px]"
                :title="parentTaskTitle ? 'Retour vers: ' + parentTaskTitle : 'Retour au parent'"
              >
                <ArrowLeft class="h-3 w-3 shrink-0" />
                <span class="truncate">Parent : {{ parentTaskTitle || 'Chargement...' }}</span>
              </button>
              <CategoryBadge v-if="currentTask.category && !currentTask.parent_task_id" :category="currentTask.category" />
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

        <!-- Notes liées (UrsUle Brain) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-semibold text-neutral-800 flex items-center gap-2">
              <FileText class="h-4 w-4 text-primary-600" /> Notes liées
            </h3>
            <div class="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                class="text-xs h-7 gap-1 border-primary-200 text-primary-700 hover:bg-primary-50"
                @click="showLinkNoteModal = !showLinkNoteModal"
              >
                <Link2 class="h-3.5 w-3.5" /> Lier une note
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                class="text-xs h-7 gap-1 bg-primary-600 hover:bg-primary-700 text-white"
                @click="createNoteForTask"
              >
                <Plus class="h-3.5 w-3.5" /> Créer une note
              </Button>
            </div>
          </div>

          <!-- Mini sélecteur pour lier une note existante -->
          <div v-if="showLinkNoteModal" class="p-3 rounded-xl bg-white border border-primary-200 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Search class="h-3.5 w-3.5 text-primary-600" /> Choisir une note à lier
              </span>
              <button class="text-neutral-400 hover:text-neutral-600" @click="showLinkNoteModal = false">
                <X class="h-4 w-4" />
              </button>
            </div>
            <Input 
              v-model="noteSearchQuery" 
              placeholder="Rechercher par titre de note..." 
              class="h-8 text-xs bg-neutral-50"
            />
            <div class="max-h-48 overflow-y-auto space-y-1">
              <div 
                v-for="n in availableNotesToLink" 
                :key="n.id"
                class="p-2 rounded-lg hover:bg-primary-50 cursor-pointer flex items-center justify-between text-xs transition-colors border border-transparent hover:border-primary-100"
                @click="linkExistingNote(n)"
              >
                <div class="flex items-center gap-2 truncate pr-2">
                  <FileText class="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  <span class="font-medium text-neutral-800 truncate">{{ n.title }}</span>
                </div>
                <Badge variant="outline" class="text-[9px] shrink-0 bg-white">Lier</Badge>
              </div>
              <div v-if="availableNotesToLink.length === 0" class="text-center py-4 text-xs text-neutral-400 italic">
                Aucune note disponible ou correspondante.
              </div>
            </div>
          </div>

          <!-- Liste des notes liées -->
          <div v-if="linkedNotes.length > 0" class="grid grid-cols-1 gap-2.5">
            <div 
              v-for="note in linkedNotes" 
              :key="note.id"
              class="p-3 rounded-xl bg-gradient-to-r from-primary-50/40 to-neutral-50 border border-primary-100/80 hover:border-primary-300 transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <div class="p-2 rounded-lg bg-white border border-primary-100 text-primary-600 shadow-sm">
                  <FileText class="h-4 w-4" />
                </div>
                <div class="overflow-hidden">
                  <h4 class="text-sm font-bold text-neutral-800 truncate group-hover:text-primary-700 transition-colors">
                    {{ note.title }}
                  </h4>
                  <div class="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                    <span>Modifié le {{ formatDateSimple(note.updated_at) }}</span>
                    <span v-if="note.tags?.length" class="flex gap-1">
                      <span v-for="tag in note.tags.slice(0, 2)" :key="tag" class="px-1.5 py-0.5 rounded bg-primary-100/60 text-primary-700 font-medium">
                        #{{ tag }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  class="h-8 w-8 text-neutral-500 hover:text-primary-600 hover:bg-primary-50"
                  @click="openNoteInBrain(note)"
                  title="Ouvrir dans le Brain"
                >
                  <ExternalLink class="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  class="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="unlinkNote(note)"
                  title="Détacher la note"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
            <FileText class="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p class="text-xs text-neutral-500 font-medium">Aucune note liée à cette tâche.</p>
            <p class="text-[11px] text-neutral-400 mt-0.5">Créez ou liez une note pour documenter votre avancement et vos apprentissages.</p>
          </div>
        </div>

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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  X, Pencil, Pin, Calendar, Clock, FolderOpen, 
  RefreshCw, ShieldCheck, MessageSquare, Send,
  Play, Pause, Timer, CheckCircle2, Image as ImageIcon, Trash2,
  ArrowLeft, FileText, Plus, Link2, ExternalLink, Search
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
import type { Note } from '@/types/brain.types'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTasksStore } from '@/stores/tasks.store'
import { useNotesStore } from '@/stores/notes.store'
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
const notesStore = useNotesStore()
const router = useRouter()
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

const parentTaskTitle = computed(() => {
  if (!currentTask.value?.parent_task_id) return ''
  const parent = tasksStore.tasks.find(t => t.id === currentTask.value!.parent_task_id)
  return parent?.title || ''
})

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

// ─── UrsUle Brain (Notes liées) ──────────────────────────────────
onMounted(() => {
  notesStore.fetchNotes()
})

const showLinkNoteModal = ref(false)
const noteSearchQuery = ref('')

const linkedNotes = computed(() => {
  if (!currentTask.value) return []
  return notesStore.notes.filter(n => n.linked_task_id === currentTask.value?.id && !n.deleted_at)
})

const availableNotesToLink = computed(() => {
  if (!currentTask.value) return []
  const q = noteSearchQuery.value.toLowerCase().trim()
  return notesStore.notes.filter(n => 
    !n.deleted_at && 
    n.linked_task_id !== currentTask.value?.id &&
    (!q || n.title.toLowerCase().includes(q))
  ).slice(0, 10)
})

async function linkExistingNote(note: Note) {
  if (!currentTask.value) return
  try {
    await notesStore.linkNoteToTask(note.id, currentTask.value.id)
    showLinkNoteModal.value = false
    noteSearchQuery.value = ''
    toast({ title: 'Note liée avec succès ! 📝' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function createNoteForTask() {
  if (!currentTask.value) return
  try {
    const templateContent = `## Description\n${currentTask.value.description || 'Aucune description initialement.'}\n\n## Apprentissages & Notes de réalisation\n- \n\n## Points à creuser / Questions\n- `
    const newNote = await notesStore.createNote({
      title: `[Tâche] ${currentTask.value.title}`,
      content: templateContent,
      linked_task_id: currentTask.value.id,
      tags: ['tâche', ...(currentTask.value.tags || [])]
    })
    toast({ title: 'Note créée pour cette tâche ! ✨' })
    emit('close')
    router.push({ path: '/brain', query: { noteId: newNote.id } })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function unlinkNote(note: Note) {
  try {
    await notesStore.linkNoteToTask(note.id, null)
    toast({ title: 'Lien supprimé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

function openNoteInBrain(note: Note) {
  emit('close')
  router.push({ path: '/brain', query: { noteId: note.id } })
}
</script>
