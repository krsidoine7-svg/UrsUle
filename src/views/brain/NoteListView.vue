<script setup lang="ts">
import { useNotesStore } from '@/stores/notes.store'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, AlignJustify, ArrowDownAZ, Calendar, Trash2 } from 'lucide-vue-next'
import NoteDeleteDialog from '@/components/brain/notes/NoteDeleteDialog.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Note } from '@/types/brain.types'

const notesStore = useNotesStore()
const router = useRouter()
const { toast } = useToast()

const viewMode = ref<'grid' | 'list' | 'compact'>('grid')
const sortBy = ref<'date' | 'alpha'>('date')

// Suppression
const noteToDelete = ref<Note | null>(null)

onMounted(() => {
  notesStore.fetchNotes()
  notesStore.fetchFolders()
})

const currentFolderTitle = computed(() => {
  if (!notesStore.selectedFolder) return 'Toutes les notes'
  const folder = notesStore.folders.find(f => f.id === notesStore.selectedFolder)
  return folder ? `${folder.icon || '📁'} ${folder.name}` : 'Toutes les notes'
})

const displayNotes = computed(() => {
  const notes = [...notesStore.filteredNotes]
  
  if (sortBy.value === 'alpha') {
    notes.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  return notes
})

async function handleCreateNote() {
  try {
    const newNote = await notesStore.createNote({
      title: 'Nouvelle note',
      content: ''
    })
    router.push(`/brain/notes/${newNote.id}`)
  } catch (e) {
    console.error('Failed to create note', e)
  }
}

function openNote(note: Note) {
  router.push(`/brain/notes/${note.id}`)
}

function askDeleteNote(note: Note, event: Event) {
  event.stopPropagation()
  noteToDelete.value = note
}

async function handleConfirmDelete() {
  if (!noteToDelete.value) return
  try {
    await notesStore.deleteNote(noteToDelete.value.id)
    toast({
      title: 'Note déplacée dans la corbeille 🗑️',
      description: 'Accédez à la Corbeille pour la restaurer.'
    })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    noteToDelete.value = null
  }
}
</script>

<template>
  <div class="h-full flex flex-col p-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">{{ currentFolderTitle }}</h2>
      
      <div class="flex flex-wrap items-center gap-2.5 sm:gap-4">
        <!-- Toolbar Vues -->
        <div class="flex items-center bg-neutral-100 rounded-lg p-1 shrink-0">
          <button 
            @click="viewMode = 'list'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900']"
            title="Vue Liste"
          >
            <List class="w-4 h-4" />
          </button>
          <button 
            @click="viewMode = 'grid'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900']"
            title="Vue Grille"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button 
            @click="viewMode = 'compact'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'compact' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900']"
            title="Vue Compacte"
          >
            <AlignJustify class="w-4 h-4" />
          </button>
        </div>

        <!-- Toolbar Tri -->
        <div class="flex items-center bg-neutral-100 rounded-lg p-1 shrink-0">
          <button 
            @click="sortBy = 'date'"
            :class="['p-1.5 rounded-md transition-colors', sortBy === 'date' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900']"
            title="Trier par date"
          >
            <Calendar class="w-4 h-4" />
          </button>
          <button 
            @click="sortBy = 'alpha'"
            :class="['p-1.5 rounded-md transition-colors', sortBy === 'alpha' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900']"
            title="Trier par ordre alphabétique"
          >
            <ArrowDownAZ class="w-4 h-4" />
          </button>
        </div>

        <Button 
          @click="handleCreateNote"
          class="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm shrink-0"
        >
          + Nouvelle note
        </Button>
      </div>
    </div>
    
    <div v-if="notesStore.loading" class="text-neutral-500">Chargement...</div>
    <div v-else-if="displayNotes.length === 0" class="text-neutral-500 text-center py-10 flex-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl">
      <p class="mb-4">Aucune note dans ce dossier.</p>
      <Button variant="outline" @click="handleCreateNote">Créer une note ici</Button>
    </div>
    
    <div v-else :class="{
      'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4': viewMode === 'grid',
      'flex flex-col gap-3': viewMode === 'list',
      'flex flex-col gap-1': viewMode === 'compact'
    }">
      <div 
        v-for="note in displayNotes" 
        :key="note.id"
        class="bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group relative"
        :class="{
          'p-5 rounded-2xl flex flex-col h-40': viewMode === 'grid',
          'p-4 rounded-xl flex items-center gap-4': viewMode === 'list',
          'py-2 px-3 rounded-lg flex items-center justify-between text-sm': viewMode === 'compact'
        }"
        @click="openNote(note)"
      >
        <div :class="{'flex-1 min-w-0': viewMode === 'list'}">
          <h3 class="font-bold text-neutral-900 truncate group-hover:text-primary-600 transition-colors"
              :class="{'text-base mb-1': viewMode !== 'compact'}">
            {{ note.title || 'Sans titre' }}
          </h3>
          <p v-if="viewMode !== 'compact'" class="text-sm text-neutral-500" :class="{'line-clamp-3': viewMode === 'grid', 'truncate': viewMode === 'list'}">
            {{ note.content?.replace(/<[^>]+>/g, '') || 'Note vide...' }}
          </p>
        </div>
        <div v-if="viewMode === 'list'" class="text-xs text-neutral-400 whitespace-nowrap">
          {{ new Date(note.created_at).toLocaleDateString() }}
        </div>
        <div v-if="viewMode === 'compact'" class="flex items-center gap-3">
          <span class="text-xs px-2 py-0.5 bg-neutral-100 rounded text-neutral-500" v-if="note.tags && note.tags.length">
            {{ note.tags.length }} tags
          </span>
          <span class="text-xs text-neutral-400">
            {{ new Date(note.created_at).toLocaleDateString() }}
          </span>
        </div>

        <!-- Bouton Corbeille (visible au hover en mode grid/list) -->
        <button
          v-if="viewMode !== 'compact'"
          @click.stop="askDeleteNote(note, $event)"
          class="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          title="Mettre à la corbeille"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Modal Suppression -->
    <NoteDeleteDialog
      v-if="noteToDelete"
      :note-id="noteToDelete.id"
      :note-title="noteToDelete.title"
      @close="noteToDelete = null"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
