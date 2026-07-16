<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects.store'
import { useTasksStore } from '@/stores/tasks.store'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskDetail from '@/components/tasks/TaskDetail.vue'
import ProjectForm from '@/components/projects/ProjectForm.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import { 
  ArrowLeft, 
  Pencil, 
  Archive, 
  Trash2, 
  Calendar, 
  Target, 
  Clock,
  Layout,
  FileText,
  Info,
  Loader2,
  ChevronRight,
  FolderOpen,
  Plus,
  ExternalLink,
  Link2,
  Search,
  X,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Award
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui.store'
import { useNotesStore } from '@/stores/notes.store'
import { supabase } from '@/services/supabase'
import type { Note } from '@/types/brain.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import * as LucideIcons from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()
const notesStore = useNotesStore()
const uiStore = useUIStore()
const { toast } = useToast()

const project = ref<any>(null)
const isLoading = ref(true)
const isEditFormOpen = ref(false)
const selectedTaskForDetail = ref<any>(null)

const IconComponent = computed(() => {
  if (!project.value) return FolderOpen
  return (LucideIcons as any)[project.value.icon] || FolderOpen
})

const stats = computed(() => {
  if (!project.value) return { total: 0, completed: 0, progress: 0 }
  const tasks = project.value.tasks || []
  const total = tasks.length
  const completed = tasks.filter((t: any) => t.status === 'done').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, progress }
})

// Cartographie d'impact dynamique
const activeTasksAffected = computed(() => {
  if (!project.value || !project.value.tasks) return []
  return project.value.tasks.filter((t: any) => !t.deleted_at)
})

const tasksStatsAffected = computed(() => {
  const tasks = activeTasksAffected.value
  const todo = tasks.filter((t: any) => t.status === 'todo').length
  const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length
  const done = tasks.filter((t: any) => t.status === 'done').length
  
  const totalMinutes = tasks.reduce((sum: number, t: any) => sum + (t.estimated_duration_minutes || 0), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const durationStr = hours > 0 
    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` 
    : `${minutes} min`

  return {
    todo,
    inProgress,
    done,
    totalMinutes,
    durationStr
  }
})

onMounted(async () => {
  await loadProject()
  notesStore.fetchNotes()
})

async function loadProject() {
  isLoading.value = true
  try {
    const id = route.params.id as string
    project.value = await projectsStore.projectsService.getById(id)
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    isLoading.value = false
  }
}

async function saveNotes(notes: string) {
  if (!project.value) return
  try {
    await projectsStore.updateProject(project.value.id, { notes })
    toast({ title: 'Notes enregistrées' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr })
}

async function handleDelete() {
  if (!project.value) return
  try {
    await projectsStore.deleteProject(project.value.id)
    toast({ title: 'Projet supprimé' })
    router.push('/projects')
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

const isOverdue = (dateStr: string) => {
  return new Date(dateStr) < new Date()
}

function openDetail(task: any) {
  selectedTaskForDetail.value = task
}

function openEditForm(task: any) {
  selectedTaskForDetail.value = null
  uiStore.openTaskForm(task)
}

// ─── UrsUle Brain (Notes & Quiz Projet) ──────────────────────────
const showLinkNoteModal = ref(false)
const noteSearchQuery = ref('')
const showQuizDialog = ref(false)
const quizAnswer = ref('')
const quizFeedback = ref<{ correct: boolean; message: string } | null>(null)
const isSubmittingQuiz = ref(false)

const linkedNotes = computed(() => {
  if (!project.value) return []
  return notesStore.notes.filter(n => n.linked_project_id === project.value.id && !n.deleted_at)
})

const availableNotesToLink = computed(() => {
  if (!project.value) return []
  const q = noteSearchQuery.value.toLowerCase().trim()
  return notesStore.notes.filter(n => 
    !n.deleted_at && 
    n.linked_project_id !== project.value.id &&
    (!q || n.title.toLowerCase().includes(q))
  ).slice(0, 10)
})

const currentProjectQuiz = computed(() => {
  if (!project.value) return { question: '', title: '' }
  const noteCount = linkedNotes.value.length
  const taskCount = project.value.tasks?.length || 0
  return {
    title: `Quiz de Maîtrise : ${project.value.name}`,
    question: `Vous avez ${noteCount} note(s) et ${taskCount} tâche(s) sur ce projet. Quel est le principal apprentissage ou résultat technique que vous devez retenir et appliquer pour la suite ?`
  }
})

async function linkExistingNote(note: Note) {
  if (!project.value) return
  try {
    await notesStore.linkNoteToProject(note.id, project.value.id)
    showLinkNoteModal.value = false
    noteSearchQuery.value = ''
    toast({ title: 'Note liée au projet ! 📝' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function createNoteForProject() {
  if (!project.value) return
  try {
    const templateContent = `## README : ${project.value.name}\n${project.value.description || 'Description du projet...'}\n\n## Journal des décisions & Architecture\n- \n\n## Leçons retenues & Notes techniques\n- `
    const newNote = await notesStore.createNote({
      title: `[Projet] ${project.value.name}`,
      content: templateContent,
      linked_project_id: project.value.id,
      tags: ['projet', 'wiki', project.value.name.toLowerCase().replace(/\s+/g, '-')]
    })
    toast({ title: 'Note Wiki créée pour le projet ! ✨' })
    router.push({ path: '/brain', query: { noteId: newNote.id } })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function unlinkNote(note: Note) {
  try {
    await notesStore.linkNoteToProject(note.id, null)
    toast({ title: 'Lien supprimé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

function openNoteInBrain(note: Note) {
  router.push({ path: '/brain', query: { noteId: note.id } })
}

async function submitProjectQuiz() {
  if (!quizAnswer.value.trim() || !project.value) return
  isSubmittingQuiz.value = true
  try {
    const isGood = quizAnswer.value.trim().length >= 10
    await supabase.from('note_quizzes').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      project_id: project.value.id,
      trigger: 'project_complete',
      question: currentProjectQuiz.value.question,
      question_type: 'open',
      is_answered: true,
      user_answer: quizAnswer.value,
      is_correct: isGood,
      answered_at: new Date().toISOString()
    })
    quizFeedback.value = {
      correct: isGood,
      message: isGood 
        ? '🎉 Excellent ! Votre réflexion est enregistrée dans l\'historique du projet et de l\'apprentissage.' 
        : '💡 Réponse un peu courte, mais enregistrée ! N\'hésitez pas à détailler davantage vos notes.'
    }
    toast({ title: 'Quiz validé et enregistré dans UrsUle Brain ! 🧠' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    isSubmittingQuiz.value = false
  }
}
</script>

<template>
  <div v-if="isLoading" class="min-h-[60vh] flex items-center justify-center">
    <Loader2 class="h-10 w-10 text-primary-600 animate-spin" />
  </div>

  <div v-else-if="project" class="space-y-8 animate-fade-in pb-20">
    <!-- Header -->
    <div class="flex flex-col gap-6">
      <button 
        @click="router.push('/projects')" 
        class="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-primary-600 transition-colors group w-fit"
      >
        <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Retour aux projets
      </button>

      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div class="flex gap-6 items-start">
          <div 
            class="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-primary-100/50 shrink-0"
            :style="{ backgroundColor: project.color, color: '#fff' }"
          >
            <component :is="IconComponent" class="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <div class="space-y-2">
            <h1 class="text-2xl md:text-4xl font-display font-black text-neutral-900 tracking-tight">{{ project.name }}</h1>
            <div class="flex items-center gap-3">
              <Badge variant="secondary" class="bg-neutral-100 text-neutral-500 font-bold uppercase text-[10px] whitespace-nowrap">
                {{ project.status }}
              </Badge>
              <span class="text-xs md:text-sm font-bold text-neutral-400 flex items-center gap-1 whitespace-nowrap">
                <Layout class="h-3.5 w-3.5 md:h-4 md:w-4" /> {{ stats.total }} tâches
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 md:gap-3">
          <Button 
            @click="uiStore.openTaskForm(null, { project_id: project.id })" 
            class="flex-1 sm:flex-none rounded-xl md:rounded-2xl h-11 md:h-12 px-4 md:px-6 font-bold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-100 text-xs md:text-sm"
          >
            <Plus class="h-4 w-4 mr-2" /> Nouvelle tâche
          </Button>
          <Button @click="isEditFormOpen = true" variant="outline" class="flex-1 sm:flex-none rounded-xl md:rounded-2xl h-11 md:h-12 px-4 md:px-6 font-bold border-neutral-200 text-xs md:text-sm">
            <Pencil class="h-4 w-4 mr-2" /> Éditer
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" class="flex-1 sm:flex-none rounded-xl md:rounded-2xl h-11 md:h-12 px-4 md:px-6 font-bold text-red-600 hover:bg-red-50 hover:text-red-700 text-xs md:text-sm">
                <Trash2 class="h-4 w-4 mr-2" /> Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent class="rounded-[2.5rem] border-none p-8 max-w-2xl bg-white/95 backdrop-blur-md shadow-2xl">
              <AlertDialogHeader class="space-y-3">
                <AlertDialogTitle class="text-3xl font-display font-black text-neutral-900 leading-tight">
                  Supprimer le projet ?
                </AlertDialogTitle>
                <AlertDialogDescription class="text-neutral-500 font-medium text-sm">
                  Le projet <span class="font-bold text-neutral-900">"{{ project.name }}"</span> sera déplacé dans la corbeille. 
                  Vous pourrez le restaurer ultérieurement.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <!-- Cartographie d'Impact de Suppression Dynamique -->
              <div class="mt-6 space-y-4">
                <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <span class="text-xs font-black text-neutral-400 uppercase tracking-widest">
                    📊 Cartographie d'impact
                  </span>
                  <span class="text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                    {{ activeTasksAffected.length }} tâche(s) liée(s)
                  </span>
                </div>

                <!-- Stats de l'impact -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Temps perdu</span>
                    <span class="text-sm font-black text-neutral-800">{{ tasksStatsAffected.durationStr }}</span>
                  </div>
                  <div class="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/50 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">À faire</span>
                    <span class="text-sm font-black text-amber-800">{{ tasksStatsAffected.todo }}</span>
                  </div>
                  <div class="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider">En cours</span>
                    <span class="text-sm font-black text-blue-800">{{ tasksStatsAffected.inProgress }}</span>
                  </div>
                  <div class="p-3.5 bg-green-50/50 rounded-2xl border border-green-100/50 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-green-600 uppercase tracking-wider">Terminées</span>
                    <span class="text-sm font-black text-green-800">{{ tasksStatsAffected.done }}</span>
                  </div>
                </div>

                <!-- Warning Message Box -->
                <div class="p-4 bg-red-50/60 border border-red-100/60 rounded-3xl flex items-start gap-3">
                  <div class="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5">
                    <Trash2 class="h-4 w-4" />
                  </div>
                  <div class="space-y-1">
                    <span class="text-sm font-bold text-red-800 block">Soft-delete en cascade</span>
                    <p class="text-xs text-red-700/90 font-medium leading-relaxed">
                      Conformément aux règles d'intégrité relationnelle d'UrsUle, toutes les tâches associées ci-dessous seront également soft-supprimées. Aucune donnée ne sera effacée définitivement de la base de données.
                    </p>
                  </div>
                </div>

                <!-- Liste des tâches impactées -->
                <div v-if="activeTasksAffected.length > 0" class="space-y-2">
                  <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Tâches concernées :</span>
                  <div class="max-h-40 overflow-y-auto border border-neutral-100 rounded-2xl p-3 bg-neutral-50/30 divide-y divide-neutral-100">
                    <div 
                      v-for="task in activeTasksAffected" 
                      :key="task.id"
                      class="py-2.5 flex items-center justify-between text-xs font-semibold"
                    >
                      <span class="text-neutral-700 truncate max-w-sm">{{ task.title }}</span>
                      <Badge 
                        variant="secondary"
                        :class="[
                          task.status === 'done' ? 'bg-green-50 text-green-600 border border-green-100' :
                          task.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          'bg-neutral-100 text-neutral-500 border border-neutral-200'
                        ]"
                        class="text-[9px] font-bold uppercase tracking-wider rounded-lg py-0.5 px-2"
                      >
                        {{ task.status === 'done' ? 'Terminé' : task.status === 'in_progress' ? 'En cours' : 'À faire' }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <AlertDialogFooter class="gap-3 mt-8">
                <AlertDialogCancel class="rounded-2xl h-12 px-6 font-bold border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-all">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction 
                  @click="handleDelete" 
                  class="rounded-2xl h-12 px-6 font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100 border-none transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Trash2 class="h-4 w-4 mr-2" /> Supprimer le projet
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <Tabs default-value="tasks" class="w-full">
      <div class="flex items-center justify-between border-b border-neutral-100 mb-8">
        <TabsList class="bg-transparent h-auto p-0 gap-8">
          <TabsTrigger 
            value="tasks" 
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 rounded-none px-0 py-4 text-sm font-bold text-neutral-400 transition-all border-b-2 border-transparent"
          >
            <Layout class="h-4 w-4 mr-2" /> Tâches
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 rounded-none px-0 py-4 text-sm font-bold text-neutral-400 transition-all border-b-2 border-transparent"
          >
            <FileText class="h-4 w-4 mr-2" /> Notes
          </TabsTrigger>
          <TabsTrigger 
            value="infos" 
            class="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-600 rounded-none px-0 py-4 text-sm font-bold text-neutral-400 transition-all border-b-2 border-transparent"
          >
            <Info class="h-4 w-4 mr-2" /> Infos
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tasks" class="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
        <div v-if="project.tasks?.length > 0">
          <TaskList 
            :tasks="project.tasks" 
            @open-detail="openDetail"
            @edit="openEditForm"
          />
        </div>
        <div v-else class="text-center py-24 bg-white rounded-[40px] border border-dashed border-neutral-200">
          <div class="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout class="h-8 w-8 text-neutral-200" />
          </div>
          <h3 class="text-lg font-bold text-neutral-800 mb-2">Aucune tâche dans ce projet</h3>
          <p class="text-neutral-400 text-sm mb-6">Ajoute des tâches pour commencer à avancer !</p>
          <Button 
            @click="uiStore.openTaskForm(null, { project_id: project.id })" 
            variant="outline" 
            class="rounded-xl font-bold"
          >
            <Plus class="h-4 w-4 mr-2" /> Ajouter une tâche
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="notes" class="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none space-y-6">
        <!-- Barre d'actions & Quiz UrsUle Brain -->
        <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-[2rem] p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <BookOpen class="h-6 w-6 text-primary-200" />
            </div>
            <div>
              <h3 class="text-lg font-display font-bold">📖 Wiki & Centre de Connaissances</h3>
              <p class="text-xs text-primary-100">Synchronisé en temps réel avec le Second Cerveau (UrsUle Brain)</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              class="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-bold rounded-xl"
              @click="showQuizDialog = !showQuizDialog"
            >
              <HelpCircle class="h-4 w-4 mr-1.5 text-amber-300" /> 
              {{ showQuizDialog ? 'Fermer le Quiz' : '✨ Quiz de Révision' }}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              class="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs font-bold rounded-xl"
              @click="showLinkNoteModal = !showLinkNoteModal"
            >
              <Link2 class="h-4 w-4 mr-1.5" /> Lier une note
            </Button>
            <Button 
              size="sm" 
              class="bg-white text-primary-800 hover:bg-primary-50 text-xs font-bold rounded-xl shadow-md"
              @click="createNoteForProject"
            >
              <Plus class="h-4 w-4 mr-1.5" /> Nouvelle note Wiki
            </Button>
          </div>
        </div>

        <!-- Encadré Quiz de Révision Projet -->
        <div v-if="showQuizDialog" class="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-[2rem] p-6 shadow-md space-y-4 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div class="flex items-center gap-2">
              <span class="p-1.5 bg-amber-500 text-white rounded-xl shadow-sm">
                <Award class="h-4 w-4" />
              </span>
              <h4 class="font-display font-bold text-neutral-900 text-sm">{{ currentProjectQuiz.title }}</h4>
            </div>
            <Badge variant="outline" class="bg-white text-amber-800 border-amber-300 text-[10px] font-bold">
              Validation active
            </Badge>
          </div>
          
          <p class="text-xs text-neutral-700 font-medium leading-relaxed">
            {{ currentProjectQuiz.question }}
          </p>

          <div class="space-y-3">
            <textarea 
              v-model="quizAnswer"
              rows="3"
              placeholder="Rédigez ici votre synthèse ou vos points d'attention (min. 10 caractères)..."
              class="w-full text-xs p-3 rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-800 placeholder:text-neutral-400"
            ></textarea>
            
            <div class="flex items-center justify-between">
              <span v-if="quizFeedback" class="text-xs font-bold" :class="quizFeedback.correct ? 'text-green-700' : 'text-amber-700'">
                {{ quizFeedback.message }}
              </span>
              <span v-else class="text-[11px] text-neutral-400 italic">Répondez pour valider et indexer votre progression dans le PKM</span>
              
              <Button 
                size="sm" 
                class="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-4"
                :disabled="isSubmittingQuiz || !quizAnswer.trim()"
                @click="submitProjectQuiz"
              >
                <CheckCircle2 class="h-4 w-4 mr-1.5" /> Enregistrer ma synthèse
              </Button>
            </div>
          </div>
        </div>

        <!-- Mini sélecteur pour lier une note existante -->
        <div v-if="showLinkNoteModal" class="p-5 rounded-[2rem] bg-white border border-primary-200 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-neutral-800 flex items-center gap-2">
              <Search class="h-4 w-4 text-primary-600" /> Sélectionner une note existante dans UrsUle Brain
            </span>
            <button class="text-neutral-400 hover:text-neutral-600" @click="showLinkNoteModal = false">
              <X class="h-4 w-4" />
            </button>
          </div>
          <Input 
            v-model="noteSearchQuery" 
            placeholder="Rechercher par titre (ex: Architecture, Réunion, Idée)..." 
            class="h-10 text-xs bg-neutral-50 rounded-xl"
          />
          <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            <div 
              v-for="n in availableNotesToLink" 
              :key="n.id"
              class="p-3 rounded-xl hover:bg-primary-50 cursor-pointer flex items-center justify-between text-xs transition-colors border border-neutral-100 hover:border-primary-200"
              @click="linkExistingNote(n)"
            >
              <div class="flex items-center gap-2.5 truncate pr-2">
                <FileText class="h-4 w-4 text-primary-600 shrink-0" />
                <span class="font-bold text-neutral-800 truncate">{{ n.title }}</span>
              </div>
              <Badge variant="outline" class="text-[10px] shrink-0 bg-white border-primary-200 text-primary-700 font-bold">Lier au projet</Badge>
            </div>
            <div v-if="availableNotesToLink.length === 0" class="text-center py-6 text-xs text-neutral-400 italic bg-neutral-50 rounded-xl">
              Aucune note correspondante dans votre Second Cerveau.
            </div>
          </div>
        </div>

        <!-- Liste des notes liées à ce projet (UrsUle Brain) -->
        <div v-if="linkedNotes.length > 0" class="space-y-3">
          <h4 class="text-sm font-bold text-neutral-400 uppercase tracking-widest px-2">
            📚 Notes indexées pour ce projet ({{ linkedNotes.length }})
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="note in linkedNotes" 
              :key="note.id"
              class="p-4 rounded-[1.8rem] bg-white border border-neutral-200 hover:border-primary-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <div class="p-2.5 rounded-2xl bg-primary-50 text-primary-600 shrink-0">
                  <FileText class="h-5 w-5" />
                </div>
                <div class="overflow-hidden">
                  <h5 class="text-sm font-bold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                    {{ note.title }}
                  </h5>
                  <div class="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                    <span>Modifié le {{ formatDate(note.updated_at) }}</span>
                    <span v-if="note.tags?.length" class="flex gap-1">
                      <span v-for="tag in note.tags.slice(0, 2)" :key="tag" class="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium">
                        #{{ tag }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  class="h-9 w-9 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl"
                  @click="openNoteInBrain(note)"
                  title="Ouvrir dans UrsUle Brain"
                >
                  <ExternalLink class="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  class="h-9 w-9 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  @click="unlinkNote(note)"
                  title="Détacher la note du projet"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- README principal / Notes de brouillon -->
        <div class="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 class="text-xl font-display font-bold text-neutral-800">📝 Brouillon rapide & Notes README</h3>
              <p class="text-xs text-neutral-400">Ces notes restent rattachées à la fiche du projet</p>
            </div>
            <Badge variant="secondary" class="bg-primary-50 text-primary-700 font-bold">
              Markdown Auto-save
            </Badge>
          </div>
          <RichTextEditor 
            v-model="project.notes" 
            @update:model-value="saveNotes"
            placeholder="Prends des notes rapides, définis l'architecture, ou rédige le README de ton projet..."
          />
        </div>
      </TabsContent>

      <TabsContent value="infos" class="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Calendar class="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Échéance</p>
              <p class="text-lg font-bold text-neutral-800">
                {{ project.deadline ? formatDate(project.deadline) : 'Pas de date' }}
              </p>
            </div>
          </div>

          <div class="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <Target class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Budget</p>
              <p class="text-lg font-bold text-neutral-800">
                {{ project.budget ? `${project.budget.toLocaleString()} ${project.budget_currency}` : 'Non défini' }}
              </p>
            </div>
          </div>

          <div class="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Clock class="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Créé le</p>
              <p class="text-lg font-bold text-neutral-800">
                {{ formatDate(project.created_at) }}
              </p>
            </div>
          </div>

          <div class="md:col-span-3 bg-neutral-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div class="relative z-10 space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-2xl font-display font-bold">État d'avancement</h3>
                <span class="text-4xl font-black text-primary-400">{{ stats.progress }}%</span>
              </div>
              <div class="h-4 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500 transition-all duration-1000" 
                  :style="{ width: `${stats.progress}%` }"
                ></div>
              </div>
              <p class="text-neutral-400 text-sm">
                Tu as complété <span class="text-white font-bold">{{ stats.completed }}</span> tâches sur un total de <span class="text-white font-bold">{{ stats.total }}</span>.
                Continue comme ça !
              </p>
            </div>
            <div class="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full translate-x-20 -translate-y-20 blur-3xl"></div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <ProjectForm 
      :is-open="isEditFormOpen" 
      :project="project"
      @close="isEditFormOpen = false; loadProject()" 
    />

    <TaskDetail 
      :task="selectedTaskForDetail"
      @close="selectedTaskForDetail = null"
      @edit="openEditForm"
      @update-task="selectedTaskForDetail = $event"
    />
  </div>

  <div v-else class="min-h-[60vh] flex flex-col items-center justify-center">
    <FolderOpen class="h-16 w-16 text-neutral-200 mb-4" />
    <h2 class="text-2xl font-bold text-neutral-800">Projet introuvable</h2>
    <Button @click="router.push('/projects')" variant="link" class="mt-4">Retour aux projets</Button>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
