<template>
  <div class="space-y-4">
    <div class="rounded-xl border border-neutral-200 bg-white overflow-x-auto shadow-sm">
      <Table>
        <TableHeader class="bg-neutral-50/50">
          <TableRow>
            <TableHead class="w-[40px]">
              <Checkbox 
                :checked="selectedTasks.length === displayedTasks.length && displayedTasks.length > 0"
                @update:checked="toggleSelectAll"
              />
            </TableHead>
            <TableHead class="w-[30px]"></TableHead>
            <TableHead class="cursor-pointer hover:text-primary-600" @click="sortBy('title')">
              Titre <ArrowUpDown v-if="sortKey === 'title'" class="inline h-3 w-3 ml-1" />
            </TableHead>
            <TableHead class="cursor-pointer hover:text-primary-600" @click="sortBy('status')">
              Statut <ArrowUpDown v-if="sortKey === 'status'" class="inline h-3 w-3 ml-1" />
            </TableHead>
            <TableHead class="cursor-pointer hover:text-primary-600" @click="sortBy('priority')">
              Priorité <ArrowUpDown v-if="sortKey === 'priority'" class="inline h-3 w-3 ml-1" />
            </TableHead>
            <TableHead class="hidden md:table-cell">Catégorie</TableHead>
            <TableHead class="cursor-pointer hover:text-primary-600" @click="sortBy('deadline')">
              Échéance <ArrowUpDown v-if="sortKey === 'deadline'" class="inline h-3 w-3 ml-1" />
            </TableHead>
            <TableHead class="w-[50px] hidden lg:table-cell">Ressenti</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="task in displayedTasks" 
            :key="task.id"
            :class="[
              'hover:bg-neutral-50/80 transition-colors cursor-pointer group',
              task.is_pinned && 'bg-amber-50/40'
            ]"
            @click="$emit('open-detail', task)"
          >
            <TableCell @click.stop>
              <Checkbox 
                :checked="selectedTasks.includes(task.id)"
                @update:checked="toggleSelect(task.id)"
              />
            </TableCell>
            <TableCell>
              <Pin v-if="task.is_pinned" class="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            </TableCell>
            <TableCell class="font-medium text-neutral-800">
              <div class="flex flex-col gap-1">
                <span>{{ task.title }}</span>
                <div v-if="getSubtasks(task.id).length" class="flex items-center gap-2">
                  <div class="w-16 h-1 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-green-500" 
                      :style="{ width: `${Math.round((getSubtasks(task.id).filter(s => s.status === 'done').length / getSubtasks(task.id).length) * 100)}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-neutral-400 font-bold">
                    {{ getSubtasks(task.id).filter(s => s.status === 'done').length }}/{{ getSubtasks(task.id).length }}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge :status="task.status" />
            </TableCell>
            <TableCell>
              <PriorityBadge :priority="task.priority" />
            </TableCell>
            <TableCell class="hidden md:table-cell">
              <CategoryBadge v-if="task.category" :category="task.category" />
              <span v-else class="text-neutral-300">-</span>
            </TableCell>
            <TableCell :class="{ 'text-red-500 font-semibold animate-pulse': isOverdue(task) }">
              {{ task.deadline ? formatDate(task.deadline) : '-' }}
            </TableCell>
            <TableCell class="text-center hidden lg:table-cell">
              <span v-if="task.appreciation" class="text-xl" :title="task.appreciation">
                {{ appreciationEmoji[task.appreciation] }}
              </span>
              <span v-else class="text-neutral-200">-</span>
            </TableCell>
            <TableCell class="text-right" @click.stop>
              <div v-if="isTrash" class="flex items-center justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="h-9 px-3 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 font-bold rounded-lg transition-all"
                  @click="$emit('restore', task)"
                >
                  <RotateCcw class="h-4 w-4 mr-2" /> Restaurer
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  class="h-9 px-3 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-lg transition-all"
                  @click="$emit('delete-permanent', task.id)"
                >
                  <Trash2 class="h-4 w-4 mr-2" /> Supprimer
                </Button>
              </div>
              <div v-else class="flex items-center justify-end gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  @click.stop="$emit('open-detail', task)"
                  title="Voir les détails"
                >
                  <Eye class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  @click.stop="$emit('edit', task)"
                  title="Modifier"
                >
                  <Pencil class="h-4 w-4" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  @click.stop="requestDelete(task.id)"
                  title="Supprimer"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          
          <TableRow v-if="displayedTasks.length === 0">
            <TableCell colspan="9" class="h-32 text-center text-neutral-500 font-body">
              Aucune tâche trouvée. Commence par en créer une !
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2 py-4">
      <div class="text-xs text-neutral-500">
        Affichage de {{ displayedTasks.length }} sur {{ filteredTasks.length }} tâches
      </div>
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          Précédent
        </Button>
        <div class="flex items-center gap-1">
          <Button 
            v-for="p in totalPages" 
            :key="p"
            size="sm"
            :variant="currentPage === p ? 'default' : 'outline'"
            class="h-8 w-8 p-0"
            @click="currentPage = p"
          >
            {{ p }}
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Suivant
        </Button>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

import { 
  MoreHorizontal, Pin, Pencil, Copy, Archive, Trash2, ArrowUpDown, RotateCcw,
  Eye
} from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PriorityBadge from '@/components/common/PriorityBadge.vue'
import CategoryBadge from '@/components/common/CategoryBadge.vue'
import type { Task } from '@/types/task.types'
import { format, isBefore } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTasksStore } from '@/stores/tasks.store'
import { useToast } from '@/components/ui/toast/use-toast'

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

const props = defineProps<{
  tasks: Task[]
  isTrash?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-detail', task: Task): void
  (e: 'edit', task: Task): void
  (e: 'duplicate', task: Task): void
  (e: 'restore', task: Task): void
  (e: 'delete', id: string): void
  (e: 'delete-permanent', id: string): void
}>()

const tasksStore = useTasksStore()
const { toast } = useToast()

const getSubtasks = (taskId: string) => tasksStore.getSubtasks(taskId)

const selectedTasks = ref<string[]>([])
const sortKey = ref<keyof Task | 'title'>('title')
const sortOrder = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const itemsPerPage = 20


function requestDelete(id: string) {
  emit('delete', id)
}


const filteredTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    
    const valA = a[sortKey.value as keyof Task]
    const valB = b[sortKey.value as keyof Task]
    
    if (valA === valB) return 0
    if (valA === undefined) return 1
    if (valB === undefined) return -1
    
    const modifier = sortOrder.value === 'asc' ? 1 : -1
    return valA < valB ? -modifier : modifier
  })
})

const totalPages = computed(() => Math.ceil(filteredTasks.value.length / itemsPerPage) || 1)

const displayedTasks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTasks.value.slice(start, start + itemsPerPage)
})

function sortBy(key: keyof Task | 'title') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

function toggleSelect(id: string) {
  if (selectedTasks.value.includes(id)) {
    selectedTasks.value = selectedTasks.value.filter(t => t !== id)
  } else {
    selectedTasks.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedTasks.value.length === displayedTasks.value.length) {
    selectedTasks.value = []
  } else {
    selectedTasks.value = displayedTasks.value.map(t => t.id)
  }
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'dd MMM HH:mm', { locale: fr })
}

function isOverdue(task: Task) {
  return task.deadline && isBefore(new Date(task.deadline), new Date()) && task.status !== 'done'
}

async function togglePin(task: Task) {
  try {
    await tasksStore.updateTask(task.id, { is_pinned: !task.is_pinned })
    toast({ title: task.is_pinned ? 'Désépinglé' : 'Épinglé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}
</script>
