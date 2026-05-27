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
  Plus
} from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui.store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

      <TabsContent value="notes" class="animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none">
        <div class="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-neutral-800">Notes du projet</h3>
            <p class="text-xs text-neutral-400">Sauvegarde automatique via Markdown</p>
          </div>
          <RichTextEditor 
            v-model="project.notes" 
            @update:model-value="saveNotes"
            placeholder="Prends des notes pour ce projet..."
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
