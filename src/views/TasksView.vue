<template>
  <div class="tasks-view-root absolute inset-0 flex flex-col bg-neutral-50/50 overflow-hidden">
    <div class="flex-1 flex flex-col min-h-0 bg-neutral-50/50">
      <!-- Header Section -->
      <header class="bg-white border-b border-neutral-200 px-4 py-3 md:px-8 md:py-4 z-20 shadow-sm shrink-0">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-[1600px] mx-auto">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl md:text-3xl font-display font-black text-neutral-900 tracking-tight leading-none">
                {{ showTrash ? 'Corbeille' : 'Mes tâches' }}
              </h1>
              <div class="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black transition-all">
                {{ filteredTasks.length }}
              </div>
            </div>
            <p class="text-sm text-neutral-400 font-medium">
              {{ showTrash ? 'Gère tes éléments supprimés.' : 'Gère tes priorités et accomplis tes objectifs.' }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <DropdownMenu v-if="!showTrash">
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="h-11 rounded-xl font-bold border-neutral-200">
                  <Download class="h-4 w-4 mr-2" /> Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-48 rounded-xl">
                <DropdownMenuItem @click="handleExport('pdf')" class="cursor-pointer">
                  <FileText class="mr-2 h-4 w-4" /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleExport('excel')" class="cursor-pointer">
                  <Table class="mr-2 h-4 w-4" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem @click="handleExport('json')" class="cursor-pointer">
                  <Code class="mr-2 h-4 w-4" /> JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline" 
              class="hidden md:flex bg-white hover:bg-neutral-50 h-11 border-neutral-200 font-bold"
              @click="toggleTrash"
            >
              <template v-if="showTrash">
                <ArrowLeft class="h-4 w-4 mr-2" /> Retour
              </template>
              <template v-else>
                <Trash2 class="h-4 w-4 mr-2 text-neutral-500" /> Corbeille
              </template>
            </Button>
            <Button 
              v-if="showTrash && filteredTasks.length > 0"
              variant="ghost" 
              class="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold"
              @click="handleEmptyTrash"
            >
              <Trash2 class="h-4 w-4 mr-2" /> Vider la corbeille
            </Button>
            <Button 
              v-if="!showTrash"
              class="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-100 px-6 h-11 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              @click="openCreateForm"
            >
              <Plus class="h-5 w-5 mr-2" /> Nouvelle tâche
            </Button>
          </div>
        </div>

          <!-- Filters & View Switcher -->
          <div class="mt-3 md:mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 max-w-[1600px] mx-auto pt-3 md:pt-4 border-t border-neutral-100">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative w-full md:w-64">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input 
                  v-model="filters.search" 
                  placeholder="Rechercher une tâche..." 
                  class="pl-10 bg-neutral-50/50 border-neutral-200 focus:bg-white transition-all h-10"
                />
              </div>

              <template v-if="!showTrash">
                <Select v-model="filters.status">
                  <SelectTrigger class="w-40 h-10 bg-white">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="filters.priority">
                  <SelectTrigger class="w-40 h-10 bg-white">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="filters.categoryId">
                  <SelectTrigger class="w-44 h-10 bg-white">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    <SelectItem 
                      v-for="cat in categoriesStore.categories" 
                      :key="cat.id" 
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>
              
              <Select v-model="filters.sortBy">
                <SelectTrigger class="w-48 h-10 bg-white">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at_desc">Plus récent</SelectItem>
                  <SelectItem value="created_at_asc">Plus ancien</SelectItem>
                  <SelectItem value="title_asc">Titre (A-Z)</SelectItem>
                  <SelectItem value="title_desc">Titre (Z-A)</SelectItem>
                  <SelectItem v-if="!showTrash" value="deadline_asc">Échéance proche</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="ghost" 
                size="icon" 
                class="text-neutral-400 hover:text-primary-600" 
                @click="refreshTasks"
                title="Actualiser les données"
              >
                <RotateCcw class="h-4 w-4" />
              </Button>
            </div>

            <!-- ViewSwitcher masqué en mode corbeille -->
            <ViewSwitcher v-if="!showTrash" />
          </div>
        </header>

      <!-- Main Content Section -->
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-32 md:pb-8">
        <div class="max-w-[1600px] mx-auto">
          <!-- Loading State -->
          <div v-if="tasksStore.loading && !tasksStore.tasks.length" class="flex items-center justify-center h-64">
            <Loader2 class="h-10 w-10 text-primary-500 animate-spin" />
          </div>

          <!-- Views -->
          <div v-else class="view-container w-full h-full flex flex-col min-h-0">
            <TaskList 
              v-if="showTrash || uiStore.activeView === 'list'"
              :tasks="filteredTasks"
              :is-trash="showTrash"
              @edit="openEditForm"
              @open-detail="openDetail"
              @duplicate="duplicateTask"
              @delete="deleteTask"
              @restore="handleRestore"
              @delete-permanent="handleDeletePermanent"
            />

            <template v-else-if="!showTrash">
              <TaskGrid
                v-if="uiStore.activeView === 'grid'"
                :tasks="filteredTasks"
                @open-detail="openDetail"
                @edit="openEditForm"
                @duplicate="duplicateTask"
                @delete="deleteTask"
                @restore="handleRestore"
                @delete-permanent="handleDeletePermanent"
              />

              <TaskKanban
                v-else-if="uiStore.activeView === 'kanban'"
                :tasks="filteredTasks"
                @open-detail="openDetail"
                @edit="openEditForm"
                @duplicate="duplicateTask"
                @delete="deleteTask"
              />

              <CalendarView
                v-else-if="uiStore.activeView === 'calendar'"
                @open-detail="openDetail"
              />

              <TaskDatabaseView
                v-else-if="uiStore.activeView === 'database'"
                :tasks="filteredTasks"
                @open-detail="openDetail"
                @edit="openEditForm"
                @duplicate="duplicateTask"
                @delete="deleteTask"
                @update-task="handleQuickUpdate"
                @create-task="handleQuickCreate"
              />

              <TaskGraphView
                v-else-if="uiStore.activeView === 'graph'"
                :tasks="filteredTasks"
                @open-detail="openDetail"
              />
            </template>
          </div>
        </div>
      </main>

      <TaskDetail 
        :task="selectedTaskForDetail"
        @close="selectedTaskId = null"
        @edit="openEditForm"
      />
    </div>

    <!-- Dialogue de confirmation de suppression -->
    <AlertDialog :open="isDeleteDialogOpen" @update:open="val => { if (!val) isDeleteDialogOpen = false }">
      <AlertDialogContent class="rounded-2xl border-neutral-100 max-w-md p-6">
        <AlertDialogHeader>
          <AlertDialogTitle class="font-display text-xl font-bold text-neutral-900">
            {{ showTrash ? 'Supprimer définitivement ?' : 'Envoyer à la corbeille ?' }}
          </AlertDialogTitle>
          <AlertDialogDescription class="text-neutral-500 text-sm">
            {{ showTrash 
              ? 'Attention ! Cette action est irréversible et la tâche sera définitivement perdue.' 
              : 'La tâche sera déplacée dans votre corbeille. Vous pourrez la restaurer plus tard (elles sont automatiquement supprimées après 7 jours).' 
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <!-- Cartographie d'Impact de Suppression -->
        <div v-if="subtasksAffected.length > 0" class="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-2">
          <span class="text-xs font-bold text-amber-800 uppercase tracking-wider block">⚠️ Cartographie d'impact ({{ subtasksAffected.length }} sous-tâches)</span>
          <p class="text-xs text-amber-700 font-medium">
            Les sous-tâches suivantes seront également 
            <span class="font-bold text-red-600 animate-pulse" v-if="showTrash">supprimées définitivement</span>
            <span class="font-bold text-amber-800" v-else>déplacées dans la corbeille</span> :
          </p>
          <ul class="max-h-24 overflow-y-auto space-y-1 pl-4 list-disc text-xs text-amber-600 font-semibold">
            <li v-for="sub in subtasksAffected" :key="sub.id" class="truncate">{{ sub.title }}</li>
          </ul>
        </div>

        <AlertDialogFooter class="mt-6 gap-2">
          <AlertDialogCancel class="rounded-xl font-semibold border-neutral-200" @click="taskToDelete = null">Annuler</AlertDialogCancel>
          <AlertDialogAction
            class="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold border-none shadow-sm shadow-red-100"
            @click="confirmDelete"
          >
            <Trash2 class="mr-2 h-4 w-4" /> 
            {{ showTrash ? 'Supprimer' : 'Mettre à la corbeille' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Hidden Export Template -->
    <div class="fixed -left-[2000px] -top-[2000px] pointer-events-none">
      <ExportTemplate :tasks="filteredTasks" :filters="filters" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  Plus, Search, Trash2, Loader2, RotateCcw, Construction, Download, FileText, Table, Code, ArrowLeft
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskGrid from '@/components/tasks/TaskGrid.vue'
import TaskKanban from '@/components/tasks/TaskKanban.vue'
import TaskDetail from '@/components/tasks/TaskDetail.vue'
import ViewSwitcher from '@/components/common/ViewSwitcher.vue'
import ExportTemplate from '@/components/tasks/ExportTemplate.vue'
import CalendarView from '@/components/calendar/CalendarView.vue'
import TaskDatabaseView from '@/components/tasks/TaskDatabaseView.vue'
import TaskGraphView from '@/components/tasks/TaskGraphView.vue'
import { useTasksStore } from '@/stores/tasks.store'
import { useCategoriesStore } from '@/stores/categories.store'
import { useProjectsStore } from '@/stores/projects.store'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useExport } from '@/composables/useExport'
import type { Task } from '@/types/task.types'
import { useToast } from '@/components/ui/toast/use-toast'

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const projectsStore = useProjectsStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const { exportToPDF, exportTasksToExcel, exportToJSON } = useExport()

const currentView = ref(uiStore.activeView) // kept for backward compat but uiStore is the source of truth
const showTrash = ref(false)
// On stocke l'ID de la tâche sélectionnée, pas l'objet lui-même,
// pour que le panneau détail soit toujours synchronisé avec le store.
const selectedTaskId = ref<string | null>(null)
const selectedTaskForDetail = computed(() =>
  selectedTaskId.value ? (tasksStore.tasks.find(t => t.id === selectedTaskId.value) ?? null) : null
)
const taskToDelete = ref<string | null>(null)
const isDeleteDialogOpen = ref(false)

const filters = reactive({
  search: '',
  status: 'all',
  priority: 'all',
  categoryId: 'all',
  sortBy: 'created_at_desc'
})

const filteredTasks = computed(() => {
  // En mode normal, on n'affiche que les tâches racines. En mode corbeille, on affiche tout ce qui est supprimé.
  let result = showTrash.value 
    ? tasksStore.tasks.filter(t => t.deleted_at) 
    : tasksStore.rootTasks

  if (filters.search) {
    const search = filters.search.toLowerCase()
    result = result.filter((t: Task) => t.title.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search))
  }

  if (filters.status !== 'all') {
    result = result.filter((t: Task) => t.status === filters.status)
  }

  if (filters.priority !== 'all') {
    result = result.filter((t: Task) => t.priority === filters.priority)
  }

  if (filters.categoryId !== 'all') {
    result = result.filter((t: Task) => t.category_id === filters.categoryId)
  }

  // Sort
  result.sort((a, b) => {
    switch (filters.sortBy) {
      case 'title_asc': return a.title.localeCompare(b.title)
      case 'title_desc': return b.title.localeCompare(a.title)
      case 'created_at_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'created_at_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'deadline_asc': {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      default: return 0
    }
  })

  return result
})

const subtasksAffected = computed(() => {
  if (!taskToDelete.value) return []
  return tasksStore.getSubtasks(taskToDelete.value)
})

watch(showTrash, () => {
  tasksStore.fetchTasks({ showTrash: showTrash.value })
})

function refreshTasks() {
  tasksStore.fetchTasks({ showTrash: showTrash.value })
}

function toggleTrash() {
  const nextValue = !showTrash.value
  router.push({
    query: {
      ...route.query,
      filter: nextValue ? 'trash' : undefined
    }
  })
}

function resetFilters() {
  filters.search = ''
  filters.status = 'all'
  filters.priority = 'all'
  filters.categoryId = 'all'
  filters.sortBy = 'created_at_desc'
}

function prepareFilters() {
  const f: any = { ...filters, showTrash: showTrash.value }
  if (f.status === 'all') delete f.status
  if (f.priority === 'all') delete f.priority
  if (f.categoryId === 'all') delete f.categoryId
  return f
}

function openCreateForm() {
  uiStore.openTaskForm()
}

function openEditForm(task: Task) {
  selectedTaskId.value = null  // Ferme le détail
  uiStore.openTaskForm(task)   // Ouvre le formulaire
}

function openDetail(task: Task) {
  selectedTaskId.value = task.id
}

function onTaskSaved() {
  // The store is already updated by the action, but we could refetch if needed
}

async function duplicateTask(task: Task) {
  try {
    const dto = {
      title: `${task.title} (copie)`,
      description: task.description,
      description_json: task.description_json,
      status: task.status === 'done' ? 'todo' : task.status,
      priority: task.priority,
      category_id: task.category_id,
      project_id: task.project_id,
      parent_task_id: task.parent_task_id, // Important pour les sous-tâches
      deadline: task.deadline,
      estimated_duration_minutes: task.estimated_duration_minutes,
      is_pinned: task.is_pinned,
      tags: task.tags ? [...task.tags] : [],
      recurrence_type: task.recurrence_type,
      validation_type: task.validation_type,
      validation_question: task.validation_question,
      validation_answer: task.validation_answer
    }

    const newTask = await tasksStore.createTask(dto as any)
    toast({ 
      title: 'Tâche dupliquée ! ✅', 
      description: `"${newTask.title}" a été ajoutée.` 
    })
  } catch (e: any) {
    console.error('Erreur duplication:', e)
    toast({ title: 'Erreur de duplication', description: e.message, variant: 'destructive' })
  }
}

async function confirmDelete() {
  if (!taskToDelete.value) return
  try {
    console.log("🗑️ Suppression confirmée pour:", taskToDelete.value);
    if (showTrash.value) {
      await tasksStore.deletePermanentTask(taskToDelete.value)
      toast({ title: 'Tâche supprimée définitivement 🔥', description: 'Cette action était irréversible.' })
    } else {
      await tasksStore.deleteTask(taskToDelete.value)
      toast({ title: 'Tâche supprimée', description: 'La tâche a été déplacée dans la corbeille.' })
    }
  } catch (e: any) {
    console.error("❌ Erreur suppression:", e);
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    taskToDelete.value = null
    isDeleteDialogOpen.value = false
  }
}

async function handleQuickUpdate(update: { id: string } & Partial<Task>) {
  try {
    const { id, ...data } = update
    await tasksStore.updateTask(id, data)
    toast({ title: 'Tâche mise à jour ! ✨' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleQuickCreate(data: { title: string }) {
  try {
    await tasksStore.createTask({
      title: data.title,
      status: 'todo',
      priority: 'normal'
    } as any)
    toast({ title: 'Tâche créée ! 🚀' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function deleteTask(id: string) {
  console.log("🛠️ Demande de suppression reçue pour l'ID:", id);
  taskToDelete.value = id
  isDeleteDialogOpen.value = true
}

async function handleRestore(task: Task) {
  try {
    await tasksStore.restoreTask(task.id)
    toast({ title: 'Tâche restaurée ! 🚀', description: `"${task.title}" est de retour.` })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleEmptyTrash() {
  if (!confirm('Voulez-vous vraiment vider la corbeille ? Cette action est irréversible.')) return
  
  try {
    await tasksStore.emptyTrash()
    toast({ title: 'Corbeille vidée 🗑️', description: 'Toutes les tâches supprimées ont été effacées.' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleDeletePermanent(id: string) {
  taskToDelete.value = id
  isDeleteDialogOpen.value = true
}

async function handleExport(type: 'pdf' | 'excel' | 'json') {
  toast({ title: 'Export en cours...', description: 'Ton fichier est en train d\'être généré.' })
  
  try {
    if (type === 'pdf') {
      await exportToPDF('pdf-export-content', 'ursule-taches')
    } else if (type === 'excel') {
      exportTasksToExcel(filteredTasks.value)
    } else if (type === 'json') {
      exportToJSON(filteredTasks.value, 'ursule-backup')
    }
    toast({ title: 'Export prêt ✅', description: 'Le téléchargement a commencé.' })
  } catch (e: any) {
    toast({ title: 'Erreur d\'export', description: e.message, variant: 'destructive' })
  }
}

watch(() => route.query.filter, (newFilter) => {
  if (newFilter === 'trash') {
    showTrash.value = true
  } else if (!newFilter) {
    showTrash.value = false
  }
})

onMounted(() => {
  if (authStore.user) {
    tasksStore.fetchTasks().then(() => {
      // Check for taskId in query params to open detail
      if (route.query.taskId) {
        const task = tasksStore.tasks.find(t => t.id === route.query.taskId as string)
        if (task) openDetail(task)
      }
    })
    categoriesStore.fetchCategories()
    projectsStore.fetchProjects()
    
    // Activer la corbeille si le paramètre est présent dans l'URL
    if (route.query.filter === 'trash') {
      showTrash.value = true
    }
  }
})

// Support navigation from dashboard activities
watch(() => route.query.taskId, (newTaskId) => {
  if (newTaskId) {
    const task = tasksStore.tasks.find(t => t.id === newTaskId as string)
    if (task) openDetail(task)
  }
})
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Transition entre les vues via :key */
.view-container {
  animation: viewFadeIn 0.2s ease-out;
}

@keyframes viewFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
