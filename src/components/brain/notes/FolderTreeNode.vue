<template>
  <div class="folder-node">
    <!-- Le noeud lui-même -->
    <div
      class="group flex items-center justify-between px-2 py-1.5 -mx-2 rounded-lg cursor-pointer transition-colors"
      :class="{
        'bg-primary-50 text-primary-900 font-bold': notesStore.selectedFolder === node.id,
        'hover:bg-neutral-100 text-neutral-700': notesStore.selectedFolder !== node.id
      }"
      @click="notesStore.setSelectedFolder(node.id)"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <button
          v-if="node.children.length > 0"
          @click.stop="toggleExpand"
          class="p-0.5 rounded hover:bg-neutral-200/50 text-neutral-400"
        >
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-90': isExpanded }"
          />
        </button>
        <div v-else class="w-4"></div>

        <!-- Dynamic Lucide Icon with Custom Color -->
        <component 
          :is="IconComponent" 
          class="w-4 h-4 shrink-0 transition-colors" 
          :style="{ color: node.color || '#64748b' }" 
        />
        
        <span class="truncate text-sm font-semibold select-none">{{ node.name }}</span>
      </div>

      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <span class="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">{{ noteCount }}</span>
        
        <button
          @click.stop="$emit('create-subfolder', node.id)"
          class="p-1 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="Nouveau sous-dossier"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button class="p-1 rounded text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
              <MoreHorizontal class="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48 rounded-xl shadow-lg border border-neutral-100 p-1">
            <DropdownMenuItem @click.stop="$emit('rename', node)" class="rounded-lg py-2 cursor-pointer font-semibold text-neutral-700">
              <Edit2 class="w-4 h-4 mr-2 text-neutral-400" /> Paramètres du dossier
            </DropdownMenuItem>
            <DropdownMenuSeparator class="my-1 bg-neutral-100" />
            <DropdownMenuItem class="text-red-600 rounded-lg py-2 cursor-pointer font-semibold hover:bg-red-50" @click.stop="$emit('delete', node.id)">
              <Trash2 class="w-4 h-4 mr-2" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Les enfants -->
    <div
      v-show="isExpanded"
      class="ml-4 pl-2 border-l border-neutral-250 mt-0.5 space-y-0.5"
    >
      <FolderTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @create-subfolder="$emit('create-subfolder', $event)"
        @rename="$emit('rename', $event)"
        @change-color="$emit('change-color', $event)"
        @change-icon="$emit('change-icon', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotesStore } from '@/stores/notes.store'
import type { FolderTreeNode as IFolderTreeNode } from '@/services/folders.service'
import * as LucideIcons from 'lucide-vue-next'
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit2
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  node: IFolderTreeNode
}>()

defineEmits([
  'create-subfolder',
  'rename',
  'change-color',
  'change-icon',
  'delete'
])

const notesStore = useNotesStore()

// Dynamic Lucide component resolution with fallback to Folder icon
const IconComponent = computed(() => {
  const iconName = props.node.icon
  if (iconName && iconName in LucideIcons) {
    return LucideIcons[iconName as keyof typeof LucideIcons]
  }
  return LucideIcons.Folder
})

// Compter les notes dans ce dossier spécifique
const noteCount = computed(() => {
  return notesStore.notes.filter(n => n.folder_id === props.node.id).length
})

// Récupération et mutation de l'état d'expansion de manière réactive
const isExpanded = computed({
  get: () => notesStore.isFolderExpanded(props.node.id),
  set: (val) => notesStore.setFolderExpanded(props.node.id, val)
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}
</script>
