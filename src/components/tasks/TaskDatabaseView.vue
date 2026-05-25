<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { 
  Table as TableIcon, 
  Tags,
  Clock,
  CalendarRange,
  Pin,
  Calendar as CalendarIcon,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-vue-next'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task } from '@/types/task.types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useCategoriesStore } from '@/stores/categories.store'
import { useAuthStore } from '@/stores/auth.store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { type DateValue, CalendarDate } from '@internationalized/date'

const props = defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits(['edit', 'open-detail', 'duplicate', 'delete', 'update-task', 'create-task'])

const categoriesStore = useCategoriesStore()

const authStore = useAuthStore()

onMounted(() => {
  if (categoriesStore.categories.length === 0) {
    categoriesStore.fetchCategories()
  }
})

const availableColumns = [
  { id: 'title', label: 'Titre' },
  { id: 'status', label: 'Statut' },
  { id: 'priority', label: 'Priorité' },
  { id: 'deadline', label: 'Échéance' },
  { id: 'category', label: 'Catégorie' },
  { id: 'estimated_duration', label: 'Durée estimée' },
  { id: 'actual_duration', label: 'Durée réelle' },
  { id: 'tags', label: 'Tags' },
  { id: 'created_at', label: 'Création' },
  { id: 'is_pinned', label: 'Épinglé' }
]

const visibleColumns = useLocalStorage<string[]>('ursule-task-db-columns', ['title', 'status', 'priority', 'deadline', 'category'])

const isVisible = (columnId: string) => visibleColumns.value.includes(columnId)

// Surveiller l'arrivée de l'utilisateur pour charger les préférences depuis Supabase
watch(() => authStore.user, (user) => {
  if (user?.preferences?.db_view_columns) {
    console.log('Colonnes chargées depuis Supabase:', user.preferences.db_view_columns)
    visibleColumns.value = user.preferences.db_view_columns as string[]
  }
}, { immediate: true })

const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}

const editingCell = ref<{ id: string, field: string } | null>(null)
const editValue = ref('')
const newTaskTitle = ref('')
const newTaskDraft = reactive({
  status: 'todo',
  priority: 'normal',
  deadline: null as string | null,
  category_id: null as string | null,
  estimated_duration_minutes: 0,
  actual_duration_minutes: 0,
  tags: [] as string[],
  is_pinned: false
})

async function createQuickTask() {
  if (!newTaskTitle.value.trim()) return
  emit('create-task', { 
    title: newTaskTitle.value.trim(),
    ...newTaskDraft
  })
  newTaskTitle.value = ''
  // Reset draft
  newTaskDraft.status = 'todo'
  newTaskDraft.priority = 'normal'
  newTaskDraft.deadline = null
  newTaskDraft.category_id = null
  newTaskDraft.estimated_duration_minutes = 0
  newTaskDraft.actual_duration_minutes = 0
  newTaskDraft.tags = []
  newTaskDraft.is_pinned = false
}

function startEditingCell(task: Task, field: string) {
  editingCell.value = { id: task.id, field }
  if (field === 'title') {
    editValue.value = task.title
  } else if (field === 'estimated_duration_minutes' || field === 'actual_duration_minutes') {
    editValue.value = String(task[field as 'estimated_duration_minutes' | 'actual_duration_minutes'] || 0)
  } else if (field === 'tags') {
    editValue.value = task.tags?.join(', ') || ''
  } else if (field === 'deadline') {
    if (task.deadline) {
      editValue.value = new Date(task.deadline).toISOString().split('T')[0]
    } else {
      editValue.value = ''
    }
  }
}

function getCalendarDate(dateStr?: string | null): DateValue | undefined {
  if (!dateStr) return undefined
  const d = new Date(dateStr)
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function handleDateSelect(task: Task, val: DateValue | undefined) {
  if (val) {
    const date = new Date(val.year, val.month - 1, val.day, 12, 0, 0).toISOString()
    updateCell(task, 'deadline', date)
  } else {
    updateCell(task, 'deadline', null)
  }
}

function updateCell(task: Task, field: string, value: any) {
  if (task[field as keyof Task] !== value) {
    emit('update-task', { id: task.id, [field]: value })
  }
  editingCell.value = null
}

function saveEdit(task: Task) {
  if (!editingCell.value) return
  const field = editingCell.value.field

  if (field === 'title') {
    if (editValue.value.trim() && editValue.value !== task.title) {
      emit('update-task', { id: task.id, title: editValue.value.trim() })
    }
  } else if (field === 'estimated_duration_minutes' || field === 'actual_duration_minutes') {
    const val = parseInt(editValue.value)
    if (!isNaN(val) && val !== task[field as 'estimated_duration_minutes' | 'actual_duration_minutes']) {
      emit('update-task', { id: task.id, [field]: val })
    }
  } else if (field === 'tags') {
    const newTags = editValue.value.split(',').map(t => t.trim()).filter(t => t !== '')
    emit('update-task', { id: task.id, tags: newTags })
  }
  editingCell.value = null
}
const toggleColumn = async (columnId: string) => {
  console.log('Toggle column:', columnId)
  const current = [...visibleColumns.value]
  let next: string[]
  
  if (current.includes(columnId)) {
    if (columnId === 'title' && current.length === 1) return
    next = current.filter(id => id !== columnId)
  } else {
    next = [...current, columnId]
  }
  
  visibleColumns.value = next

  // Sauvegarder dans Supabase
  if (authStore.user) {
    const preferences = { 
      ...(authStore.user.preferences || {}), 
      db_view_columns: next 
    }
    try {
      await authStore.updateProfile({ preferences })
    } catch (e) {
      console.error('Erreur lors de la synchronisation des colonnes:', e)
    }
  }
}

const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedTasks = computed(() => {
  if (!sortKey.value) return props.tasks
  
  return [...props.tasks].sort((a, b) => {
    let valA: any = a[sortKey.value as keyof Task]
    let valB: any = b[sortKey.value as keyof Task]
    
    // Cas particuliers
    if (sortKey.value === 'category') {
      valA = a.category?.name || ''
      valB = b.category?.name || ''
    }
    
    if (valA === valB) return 0
    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1
    
    const modifier = sortOrder.value === 'asc' ? 1 : -1
    return valA < valB ? -1 * modifier : 1 * modifier
  })
})

const formatDuration = (minutes?: number) => {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return format(new Date(date), 'dd MMM yyyy', { locale: fr })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-100 text-green-700'
    case 'in_progress': return 'bg-blue-100 text-blue-700'
    case 'todo': return 'bg-neutral-100 text-neutral-700'
    case 'archived': return 'bg-amber-100 text-amber-700'
    default: return 'bg-neutral-100 text-neutral-700'
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm animate-fade-in">
    <div class="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-white">
      <div class="flex items-center gap-2">
        <TableIcon class="h-4 w-4 text-neutral-500" />
        <span class="font-bold text-neutral-800 text-sm">Vue Base de Données</span>
      </div>
      

    </div>

    <div class="overflow-x-auto">
      <Table class="border-collapse w-full">
        <TableHeader class="bg-neutral-50">
          <TableRow class="hover:bg-transparent border-b border-neutral-200">
            <TableHead 
              v-for="col in availableColumns.filter(c => isVisible(c.id))" 
              :key="col.id"
              @click="toggleSort(col.id)"
              class="font-semibold text-neutral-600 text-xs border-r border-neutral-200 px-4 py-2.5 h-auto cursor-pointer hover:bg-neutral-100 transition-colors group/head"
              :class="[
                col.id === 'title' ? 'w-[300px]' : 
                col.id === 'status' ? 'w-[120px]' :
                col.id === 'priority' ? 'w-[120px]' :
                col.id === 'deadline' ? 'w-[140px]' :
                col.id === 'category' ? 'w-[140px]' :
                col.id === 'estimated_duration' ? 'w-[120px]' :
                col.id === 'actual_duration' ? 'w-[120px]' :
                col.id === 'tags' ? 'w-[150px]' :
                col.id === 'created_at' ? 'w-[140px]' : 'w-[80px]'
              ]"
            >
              <div class="flex items-center justify-between">
                {{ col.label }}
                <span class="ml-2">
                  <ArrowUp v-if="sortKey === col.id && sortOrder === 'asc'" class="h-3 w-3 text-primary-500" />
                  <ArrowDown v-else-if="sortKey === col.id && sortOrder === 'desc'" class="h-3 w-3 text-primary-500" />
                  <ArrowUpDown v-else class="h-3 w-3 text-neutral-300 opacity-0 group-hover/head:opacity-100 transition-opacity" />
                </span>
              </div>
            </TableHead>
            
            <!-- Bouton + pour ajouter des colonnes (comme Airtable) -->
            <TableHead class="w-[50px] p-0 h-auto align-middle sticky right-0 bg-neutral-50 z-10 border-l border-neutral-200">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-10 w-full hover:bg-neutral-100 rounded-none transition-colors">
                    <Plus class="h-4 w-4 text-neutral-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-56 rounded-xl shadow-lg border-neutral-200">
                  <DropdownMenuLabel class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Afficher/Masquer les colonnes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    v-for="column in availableColumns"
                    :key="column.id"
                    @select="(e: Event) => { e.preventDefault(); toggleColumn(column.id); }"
                    class="text-sm font-medium flex items-center gap-2 cursor-pointer py-2.5 px-3 hover:bg-neutral-50 transition-all outline-none"
                  >
                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                      <CheckCircle2 v-if="isVisible(column.id)" class="h-4 w-4 text-primary-600 animate-in zoom-in-50 duration-200" />
                      <div v-else class="w-3.5 h-3.5 rounded-full border-2 border-neutral-200 transition-all"></div>
                    </div>
                    <span :class="isVisible(column.id) ? 'text-neutral-900 font-bold' : 'text-neutral-500 transition-colors'">
                      {{ column.label }}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="task in sortedTasks" 
            :key="task.id"
            class="group hover:bg-neutral-50/80 border-b border-neutral-200 transition-colors h-10 select-none"
          >
            <TableCell v-if="isVisible('title')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-text" @dblclick="startEditingCell(task, 'title')">
              <div class="flex items-center gap-3">
                <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: task.category?.color || '#e5e5e5' }"></div>
                
                <div v-if="editingCell?.id === task.id && editingCell.field === 'title'" class="flex-1">
                  <input 
                    v-model="editValue"
                    v-focus
                    @keyup.enter="saveEdit(task)"
                    @blur="saveEdit(task)"
                    @keyup.esc="editingCell = null"
                    class="w-full bg-white border border-primary-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-sm"
                  />
                </div>
                <span 
                  v-else
                  class="font-medium text-sm text-neutral-800 group-hover:text-primary-700 transition-colors truncate"
                >
                  {{ task.title }}
                </span>
              </div>
            </TableCell>
            
            <TableCell v-if="isVisible('status')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-pointer" @dblclick="startEditingCell(task, 'status')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'status'">
                <Select :default-value="task.status" @update:model-value="(v) => updateCell(task, 'status', v)">
                  <SelectTrigger class="h-7 text-xs font-bold uppercase rounded shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">À Faire</SelectItem>
                    <SelectItem value="in_progress">En Cours</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge v-else variant="secondary" :class="[getStatusColor(task.status), 'font-bold uppercase text-[10px] rounded-md px-2 py-0.5 shadow-none border-none']">
                {{ task.status }}
              </Badge>
            </TableCell>

            <TableCell v-if="isVisible('priority')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-pointer" @dblclick="startEditingCell(task, 'priority')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'priority'">
                <Select :default-value="task.priority" @update:model-value="(v) => updateCell(task, 'priority', v)">
                  <SelectTrigger class="h-7 text-xs font-medium capitalize rounded shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-else class="flex items-center gap-2">
                <div 
                  class="w-1.5 h-1.5 rounded-full"
                  :class="{
                    'bg-red-500': task.priority === 'urgent',
                    'bg-orange-500': task.priority === 'high',
                    'bg-blue-500': task.priority === 'normal',
                    'bg-neutral-400': task.priority === 'low'
                  }"
                ></div>
                <span class="text-sm font-medium text-neutral-700 capitalize">{{ task.priority }}</span>
              </div>
            </TableCell>

            <TableCell v-if="isVisible('deadline')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-pointer" @dblclick="startEditingCell(task, 'deadline')">
              <Popover v-if="editingCell?.id === task.id && editingCell.field === 'deadline'" :default-open="true" @update:open="(val) => { if (!val) editingCell = null }">
                <PopoverTrigger as-child>
                  <div class="h-full w-full text-sm font-medium text-neutral-600">{{ formatDate(task.deadline) }}</div>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar 
                    :model-value="getCalendarDate(task.deadline)"
                    @update:model-value="(v) => handleDateSelect(task, v as any)"
                    mode="single"
                  />
                </PopoverContent>
              </Popover>
              <span v-else class="text-sm font-medium text-neutral-600">{{ formatDate(task.deadline) }}</span>
            </TableCell>

            <TableCell v-if="isVisible('category')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-pointer" @dblclick="startEditingCell(task, 'category_id')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'category_id'">
                <Select :default-value="task.category_id || undefined" @update:model-value="(v) => updateCell(task, 'category_id', v)">
                  <SelectTrigger class="h-7 text-xs font-medium rounded shadow-sm truncate max-w-[140px]">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="cat in categoriesStore.categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span v-else class="text-sm font-medium text-neutral-600 truncate block max-w-[140px]">{{ task.category?.name || '-' }}</span>
            </TableCell>

            <TableCell v-if="isVisible('estimated_duration')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-text" @dblclick="startEditingCell(task, 'estimated_duration_minutes')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'estimated_duration_minutes'">
                <input 
                  type="number"
                  v-model="editValue"
                  v-focus
                  @keyup.enter="saveEdit(task)"
                  @blur="saveEdit(task)"
                  @keyup.esc="editingCell = null"
                  class="w-full bg-white border border-primary-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-sm"
                />
              </div>
              <span v-else class="text-sm font-medium text-neutral-600">{{ formatDuration(task.estimated_duration_minutes) }}</span>
            </TableCell>

            <TableCell v-if="isVisible('actual_duration')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-text" @dblclick="startEditingCell(task, 'actual_duration_minutes')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'actual_duration_minutes'">
                <input 
                  type="number"
                  v-model="editValue"
                  v-focus
                  @keyup.enter="saveEdit(task)"
                  @blur="saveEdit(task)"
                  @keyup.esc="editingCell = null"
                  class="w-full bg-white border border-primary-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-sm"
                />
              </div>
              <span v-else class="text-sm font-medium text-neutral-600">{{ formatDuration(task.actual_duration_minutes) }}</span>
            </TableCell>

            <TableCell v-if="isVisible('tags')" class="border-r border-neutral-200 px-4 py-2 align-middle cursor-text" @dblclick="startEditingCell(task, 'tags')">
              <div v-if="editingCell?.id === task.id && editingCell.field === 'tags'">
                <input 
                  v-model="editValue"
                  v-focus
                  placeholder="tag1, tag2..."
                  @keyup.enter="saveEdit(task)"
                  @blur="saveEdit(task)"
                  @keyup.esc="editingCell = null"
                  class="w-full bg-white border border-primary-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-100 shadow-sm"
                />
              </div>
              <div v-else class="flex flex-wrap gap-1">
                <Badge v-for="tag in task.tags" :key="tag" variant="outline" class="text-[9px] px-1.5 py-0 rounded-sm">
                  {{ tag }}
                </Badge>
                <span v-if="!task.tags?.length" class="text-neutral-300">-</span>
              </div>
            </TableCell>

            <TableCell v-if="isVisible('created_at')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <span class="text-xs text-neutral-400">{{ formatDate(task.created_at) }}</span>
            </TableCell>

            <TableCell v-if="isVisible('is_pinned')" class="border-r border-neutral-200 px-4 py-2 align-middle text-center cursor-pointer hover:bg-neutral-50/50" @click="emit('update-task', { id: task.id, is_pinned: !task.is_pinned })">
              <Pin v-if="task.is_pinned" class="h-3.5 w-3.5 text-amber-500 mx-auto fill-amber-500" />
              <Pin v-else class="h-3.5 w-3.5 text-neutral-300 mx-auto opacity-20 group-hover:opacity-100 transition-opacity" />
            </TableCell>

            <!-- Cellule vide pour correspondre au bouton + -->
            <TableCell class="p-0 bg-neutral-50/5 sticky right-0 border-l border-neutral-200"></TableCell>
          </TableRow>

          <!-- Ligne de création rapide -->
          <TableRow class="group/new bg-primary-50/10 hover:bg-primary-50/20 border-b-2 border-primary-100 transition-colors h-12">
            <TableCell v-if="isVisible('title')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <div class="flex items-center gap-3">
                <Plus class="h-4 w-4 text-primary-500 transition-colors" />
                <input 
                  v-model="newTaskTitle"
                  placeholder="Nouvelle tâche..."
                  @keyup.enter="createQuickTask"
                  class="bg-transparent border-none focus:ring-0 text-sm font-bold text-neutral-800 placeholder:text-primary-300 w-full outline-none"
                />
              </div>
            </TableCell>

            <TableCell v-if="isVisible('status')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <Select v-model="newTaskDraft.status">
                <SelectTrigger class="h-8 text-[10px] font-bold uppercase rounded border-none bg-white/50 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">À Faire</SelectItem>
                  <SelectItem value="in_progress">En Cours</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>

            <TableCell v-if="isVisible('priority')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <Select v-model="newTaskDraft.priority">
                <SelectTrigger class="h-8 text-xs font-medium capitalize rounded border-none bg-white/50 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>

            <TableCell v-if="isVisible('deadline')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="ghost" size="sm" class="h-8 w-full text-xs font-medium text-neutral-500 justify-start px-0">
                    {{ newTaskDraft.deadline ? formatDate(newTaskDraft.deadline) : 'Échéance' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar 
                    :model-value="getCalendarDate(newTaskDraft.deadline)"
                    @update:model-value="(v) => { if (v) newTaskDraft.deadline = new Date(v.year, v.month - 1, v.day, 12, 0, 0).toISOString(); else newTaskDraft.deadline = null }"
                    mode="single"
                  />
                </PopoverContent>
              </Popover>
            </TableCell>

            <TableCell v-if="isVisible('category')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <Select v-model="newTaskDraft.category_id">
                <SelectTrigger class="h-8 text-xs font-medium rounded border-none bg-white/50 shadow-none">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="cat in categoriesStore.categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </TableCell>

            <TableCell v-if="isVisible('estimated_duration')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <input 
                type="number"
                v-model="newTaskDraft.estimated_duration_minutes"
                placeholder="0 min"
                class="bg-transparent border-none focus:ring-0 text-sm font-medium text-neutral-600 w-full outline-none"
              />
            </TableCell>

            <TableCell v-if="isVisible('actual_duration')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <input 
                type="number"
                v-model="newTaskDraft.actual_duration_minutes"
                placeholder="0 min"
                class="bg-transparent border-none focus:ring-0 text-sm font-medium text-neutral-600 w-full outline-none"
              />
            </TableCell>

            <TableCell v-if="isVisible('tags')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <input 
                :value="newTaskDraft.tags.join(', ')"
                @input="(e: any) => newTaskDraft.tags = e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')"
                placeholder="Tags..."
                class="bg-transparent border-none focus:ring-0 text-xs font-medium text-neutral-400 w-full outline-none"
              />
            </TableCell>

            <TableCell v-if="isVisible('created_at')" class="border-r border-neutral-200 px-4 py-2 align-middle">
              <span class="text-[10px] text-neutral-300 italic">Auto</span>
            </TableCell>

            <TableCell v-if="isVisible('is_pinned')" class="border-r border-neutral-200 px-4 py-2 align-middle text-center">
              <Button variant="ghost" size="icon" class="h-7 w-7" @click="newTaskDraft.is_pinned = !newTaskDraft.is_pinned">
                <Pin :class="['h-3.5 w-3.5', newTaskDraft.is_pinned ? 'text-amber-500 fill-amber-500' : 'text-neutral-300']" />
              </Button>
            </TableCell>

            <TableCell class="p-0 bg-primary-50/10 sticky right-0 border-l border-neutral-200 flex items-center justify-center">
              <Button size="icon" variant="ghost" class="h-8 w-8 text-primary-600 hover:bg-primary-100" @click="createQuickTask">
                <CheckCircle2 class="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    
    <div v-if="tasks.length === 0" class="py-20 text-center text-neutral-400">
      Aucune donnée à afficher.
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
