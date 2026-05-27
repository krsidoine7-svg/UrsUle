<template>
  <Sheet :open="isOpen" @update:open="onClose">
    <SheetContent side="right" class="w-full sm:max-w-xl overflow-y-auto border-l-primary-100">
      <SheetHeader class="mb-6">
        <SheetTitle class="font-display text-2xl font-bold text-primary-900">
          {{ isEditMode ? 'Modifier la tâche' : 'Nouvelle tâche' }}
        </SheetTitle>
        <SheetDescription>
          Organise tes idées et tes projets pour rester productif.
        </SheetDescription>
      </SheetHeader>

      <form @submit.prevent="onSubmit" class="space-y-6 pb-20">
        <!-- Section Obligatoire -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="title">Titre de la tâche *</Label>
            <Input 
              id="title" 
              v-model="form.title" 
              placeholder="Ex: Finir le rapport UrsUle" 
              :class="{ 'border-red-500': errors.title }"
            />
            <p v-if="errors.title" class="text-xs text-red-500">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Priorité *</Label>
              <Select v-model="form.priority">
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Catégorie *</Label>
              <Select v-model="form.category_id">
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="cat in categoriesStore.categories" 
                    :key="cat.id" 
                    :value="cat.id"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color }"></div>
                      {{ cat.name }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Projet</Label>
              <Select v-model="form.project_id">
                <SelectTrigger>
                  <SelectValue placeholder="Aucun projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun projet</SelectItem>
                  <SelectItem 
                    v-for="proj in projectsStore.projects" 
                    :key="proj.id" 
                    :value="proj.id"
                  >
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: proj.color }"></div>
                      {{ proj.name }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Échéance (Deadline) *</Label>
              <div class="flex gap-2">
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="w-full justify-start text-left font-normal border-neutral-200">
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ displayDate }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar v-model="(deadlineDate as any)" mode="single" />
                  </PopoverContent>
                </Popover>
                <Input type="time" v-model="deadlineTime" class="w-32" />
              </div>
            </div>
          </div>
        </div>

        <!-- Section Optionnelle (Expansible) -->
        <div class="pt-4 border-t border-neutral-100">
          <button 
            type="button" 
            @click="showOptions = !showOptions"
            class="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ChevronDown :class="['h-4 w-4 transition-transform', showOptions && 'rotate-180']" />
            {{ showOptions ? 'Masquer les options avancées' : 'Plus d\'options (Description, Durée, Projet...)' }}
          </button>

          <div v-show="showOptions" class="mt-6 space-y-6 animate-fade-in-up">
            <div class="space-y-2">
              <Label for="description">Description</Label>
              <RichTextEditor 
                v-model="form.description" 
                v-model:json="form.description_json"
                placeholder="Détails de la tâche..." 
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Durée estimée</Label>
                <div class="flex gap-2">
                  <Input type="number" v-model="form.estimated_duration_minutes" class="flex-1" />
                  <Select v-model="durationUnit">
                    <SelectTrigger class="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">min</SelectItem>
                      <SelectItem value="h">h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Épingler la tâche</Label>
                <div class="flex items-center h-10 px-3 border border-neutral-200 rounded-md bg-neutral-50/50">
                  <span class="text-xs text-neutral-500 flex-1">Épingler en haut</span>
                  <Switch v-model:checked="form.is_pinned" />
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Tags</Label>
              <Input 
                v-model="tagInput" 
                @keydown.enter.prevent="addTag" 
                placeholder="Appuie sur Entrée pour ajouter" 
              />
              <div class="flex flex-wrap gap-1 mt-2">
                <Badge 
                  v-for="tag in form.tags" 
                  :key="tag" 
                  variant="secondary"
                  class="bg-blue-50 text-blue-700 hover:bg-blue-100 pr-1 py-0.5"
                >
                  {{ tag }}
                  <X class="h-3 w-3 ml-1 cursor-pointer" @click="removeTag(tag)" />
                </Badge>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Récurrence</Label>
                <Select v-model="form.recurrence_type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label>Validation</Label>
                <Select v-model="form.validation_type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="calc">Calcul</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div class="fixed bottom-0 right-0 w-full sm:max-w-xl p-4 bg-white border-t border-neutral-100 flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            class="flex-1" 
            @click="onClose"
            :disabled="loading"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            class="flex-1 bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200"
            :disabled="loading"
          >
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isEditMode ? 'Mettre à jour' : 'Enregistrer la tâche' }}
          </Button>
        </div>
      </form>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { type DateValue, getLocalTimeZone, today, CalendarDate, parseDate } from '@internationalized/date'
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, ChevronDown, X, Loader2 } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { z } from 'zod'
import { useTasksStore } from '@/stores/tasks.store'
import { useCategoriesStore } from '@/stores/categories.store'
import { useProjectsStore } from '@/stores/projects.store'
import type { Task, CreateTaskDTO, TaskStatus, TaskPriority, RecurrenceType, ValidationType } from '@/types/task.types'
import { useToast } from '@/components/ui/toast/use-toast'

const props = defineProps<{
  isOpen: boolean
  task?: any | null
}>()

const isEditMode = computed(() => !!props.task && !props.task.isNew)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const projectsStore = useProjectsStore()
const { toast } = useToast()

const loading = ref(false)
const showOptions = ref(false)
const tagInput = ref('')
const deadlineDate = ref<DateValue | undefined>(today(getLocalTimeZone()))
const deadlineTime = ref('09:00')
const durationUnit = ref<'min' | 'h'>('min')
const displayDate = computed(() => {
  if (!deadlineDate.value) return 'Choisir une date'
  try {
    const d = deadlineDate.value as any
    return format(new Date(d.year, d.month - 1, d.day), 'PPP', { locale: fr })
  } catch (e) {
    return 'Choisir une date'
  }
})

const form = reactive({
  title: '',
  description: '',
  description_json: undefined as object | undefined,
  status: 'todo' as TaskStatus,
  priority: 'normal' as TaskPriority,
  category_id: undefined as string | undefined,
  project_id: 'none' as string,
  deadline: '',
  estimated_duration_minutes: undefined as number | undefined,
  is_pinned: false,
  tags: [] as string[],
  recurrence_type: 'none' as RecurrenceType,
  validation_type: 'none' as ValidationType,
  parent_task_id: undefined as string | undefined,
})

const errors = reactive<Record<string, string>>({})

const taskSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  category_id: z.string().min(1, 'La catégorie est obligatoire'),
})

watch(() => props.task, (newTask) => {
  if (newTask) {
    Object.assign(form, {
      title: newTask.isNew ? '' : newTask.title,
      description: newTask.description || '',
      description_json: newTask.description_json,
      status: newTask.status || 'todo',
      priority: newTask.priority || 'normal',
      category_id: newTask.category_id || categoriesStore.categories[0]?.id || undefined,
      project_id: newTask.project_id || 'none',
      deadline: newTask.deadline || '',
      estimated_duration_minutes: newTask.estimated_duration_minutes,
      is_pinned: newTask.is_pinned || false,
      tags: newTask.tags ? [...newTask.tags] : [],
      recurrence_type: newTask.recurrence_type || 'none',
      validation_type: newTask.validation_type || 'none',
      parent_task_id: newTask.parent_task_id,
    })
    
    if (newTask.deadline) {
      const date = new Date(newTask.deadline)
      deadlineDate.value = new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      deadlineTime.value = format(date, 'HH:mm')
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  Object.assign(form, {
    title: '',
    description: '',
    status: 'todo',
    priority: 'normal',
    category_id: categoriesStore.categories[0]?.id || undefined,
    project_id: 'none',
    deadline: '',
    estimated_duration_minutes: undefined,
    is_pinned: false,
    tags: [],
    recurrence_type: 'none',
    validation_type: 'none',
  })
  deadlineDate.value = today(getLocalTimeZone())
  deadlineTime.value = '09:00'
}

function onClose() {
  emit('close')
}

function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    tagInput.value = ''
  }
}

function removeTag(tag: string) {
  form.tags = form.tags.filter(t => t !== tag)
}

async function onSubmit() {
  errors.title = ''
  
  const validation = taskSchema.safeParse(form)
  if (!validation.success) {
    validation.error.issues.forEach((issue: z.ZodIssue) => {
      errors[issue.path[0] as string] = issue.message
    })
    return
  }

  // Fusionner la date et l'heure pour l'échéance si définie
  let calculatedDeadline: string | null = null
  if (deadlineDate.value) {
    const [hours, minutes] = deadlineTime.value.split(':')
    const d = deadlineDate.value as any
    const date = new Date(d.year, d.month - 1, d.day)
    date.setHours(parseInt(hours), parseInt(minutes))
    calculatedDeadline = date.toISOString()
  }

  const dto: CreateTaskDTO = {
    title: form.title.trim(),
    description: form.description || null,
    description_json: form.description_json,
    status: form.status,
    priority: form.priority,
    category_id: form.category_id,
    project_id: form.project_id === 'none' ? null : form.project_id,
    deadline: calculatedDeadline || null, // Résout l'erreur de date vide "" -> null
    estimated_duration_minutes: form.estimated_duration_minutes 
      ? (durationUnit.value === 'h' ? Number(form.estimated_duration_minutes) * 60 : Number(form.estimated_duration_minutes)) 
      : null, // Résout l'erreur de durée vide "" -> null
    is_pinned: form.is_pinned,
    tags: form.tags,
    recurrence_type: form.recurrence_type,
    validation_type: form.validation_type,
    parent_task_id: form.parent_task_id || null,
  }

  // 🚀 FERMETURE ET ÉMISSION IMMÉDIATE POUR EXPÉRIENCE INSTANTANÉE !
  onClose()
  emit('saved')

  // Exécution de l'appel réseau en arrière-plan sans bloquer l'interface
  try {
    if (isEditMode.value) {
      console.log("📡 Mise à jour tâche ID en arrière-plan:", props.task.id);
      await tasksStore.updateTask(props.task.id, dto)
      toast({ 
        title: 'Tâche mise à jour ! ✨', 
        description: `"${dto.title}" a été modifiée avec succès.` 
      })
    } else {
      console.log("📡 Création tâche en arrière-plan...");
      const newTask = await tasksStore.createTask(dto)
      toast({ 
        title: 'Tâche créée ! 🚀', 
        description: `"${newTask.title}" est prête.` 
      })
    }
  } catch (e: any) {
    console.error("❌ Erreur lors de l'enregistrement de la tâche:", e);
    toast({ 
      title: 'Échec de la sauvegarde ⚠️', 
      description: e.message || 'Impossible d\'enregistrer la tâche. Vérifie ta connexion.', 
      variant: 'destructive' 
    })
  }
}

onMounted(() => {
  if (categoriesStore.categories.length === 0) {
    categoriesStore.fetchCategories()
  }
  if (projectsStore.projects.length === 0) {
    projectsStore.fetchProjects()
  }
})
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
