<template>
  <div class="folder-tree h-full flex flex-col">
    <!-- Header: "Toutes les notes" -->
    <div
      class="flex items-center justify-between px-2 py-2 -mx-2 rounded-xl cursor-pointer transition-all duration-200 group mb-2 border border-transparent"
      :class="{
        'bg-primary-50 text-primary-950 font-bold border-primary-100 shadow-sm': notesStore.selectedFolder === null,
        'hover:bg-neutral-100 text-neutral-600 font-semibold': notesStore.selectedFolder !== null
      }"
      @click="notesStore.setSelectedFolder(null)"
    >
      <div class="flex items-center gap-2">
        <Library class="w-5 h-5 text-primary-600" />
        <span class="text-sm select-none">Toutes les notes</span>
      </div>
      <span class="text-[10px] font-extrabold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
        {{ notesStore.notes.length }}
      </span>
    </div>

    <!-- Toolbar du Tree -->
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-xs font-bold text-neutral-400 uppercase tracking-wider select-none">Dossiers</h3>
      <button
        @click="openCreateModal(null)"
        class="p-1 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-95"
        title="Nouveau dossier racine"
      >
        <FolderPlus class="w-4 h-4" />
      </button>
    </div>

    <!-- L'Arbre -->
    <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
      <div v-if="notesStore.folderTree.length === 0" class="text-sm text-neutral-500 italic text-center py-6">
        Aucun dossier pour le moment.
      </div>
      <div v-else class="space-y-0.5">
        <FolderTreeNode
          v-for="node in notesStore.folderTree"
          :key="node.id"
          :node="node"
          @create-subfolder="openCreateModal"
          @rename="openRenameModal"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <!-- Dialogs Premium en remplacement des prompts natifs -->
    <Teleport to="body">
      <FolderDialog
        v-if="showFolderModal"
        :mode="folderModalMode"
        :parent-id="folderModalParentId"
        :folder="folderModalActiveFolder"
        @close="showFolderModal = false"
        @saved="handleFolderSaved"
      />
    </Teleport>

    <Teleport to="body">
      <FolderDeleteDialog
        v-if="showDeleteModal"
        :folder-name="folderToDelete ? folderToDelete.name : ''"
        @close="showDeleteModal = false"
        @confirm="handleDeleteConfirm"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotesStore } from '@/stores/notes.store'
import FolderTreeNode from './FolderTreeNode.vue'
import FolderDialog from './FolderDialog.vue'
import FolderDeleteDialog from './FolderDeleteDialog.vue'
import { Library, FolderPlus } from 'lucide-vue-next'
import type { FolderTreeNode as IFolderTreeNode } from '@/services/folders.service'

const notesStore = useNotesStore()

// States des modaux premium
const showFolderModal = ref(false)
const folderModalMode = ref<'create' | 'edit'>('create')
const folderModalParentId = ref<string | null>(null)
const folderModalActiveFolder = ref<IFolderTreeNode | null>(null)

const showDeleteModal = ref(false)
const folderToDelete = ref<IFolderTreeNode | null>(null)

// Ouvrir la boîte de dialogue de création
function openCreateModal(parentId: string | null = null) {
  folderModalMode.value = 'create'
  folderModalParentId.value = parentId
  folderModalActiveFolder.value = null
  showFolderModal.value = true
}

// Ouvrir la boîte de dialogue d'édition (Paramètres du dossier)
function openRenameModal(node: IFolderTreeNode) {
  folderModalMode.value = 'edit'
  folderModalParentId.value = node.parent_id || null
  folderModalActiveFolder.value = node
  showFolderModal.value = true
}

// Callback de validation de création / modification
function handleFolderSaved() {
  showFolderModal.value = false
  notesStore.fetchFolders() // Re-fetch réactif pour reconstruire l'arbre
}

// Ouvrir le dialogue de suppression sécurisée
function confirmDelete(nodeId: string) {
  const node = findFolderNodeById(notesStore.folderTree, nodeId)
  if (node) {
    folderToDelete.value = node
    showDeleteModal.value = true
  }
}

// Callback de confirmation de suppression
async function handleDeleteConfirm() {
  if (folderToDelete.value) {
    try {
      await notesStore.deleteFolder(folderToDelete.value.id)
      await notesStore.fetchFolders()
      await notesStore.fetchNotes() // Rafraîchir les compteurs
    } catch (e) {
      console.error('Failed to delete folder', e)
    } finally {
      showDeleteModal.value = false
      folderToDelete.value = null
    }
  }
}

// Helper pour retrouver récursivement un noeud dans l'arbre
function findFolderNodeById(nodes: IFolderTreeNode[], id: string): IFolderTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children && node.children.length > 0) {
      const found = findFolderNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 4px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #d4d4d4;
}
</style>
