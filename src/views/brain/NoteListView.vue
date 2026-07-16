<script setup lang="ts">
import { useNotesStore } from '@/stores/notes.store'
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, AlignJustify, ArrowDownAZ, Calendar, Trash2, Search, X } from 'lucide-vue-next'
import NoteDeleteDialog from '@/components/brain/notes/NoteDeleteDialog.vue'
import { useToast } from '@/components/ui/toast/use-toast'
import type { Note } from '@/types/brain.types'
import { useUIStore } from '@/stores/ui.store'

const notesStore = useNotesStore()
const uiStore = useUIStore()
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

const isJournalOnly = computed({
  get() {
    return notesStore.searchQuery.startsWith('type:journal')
  },
  set(val: boolean) {
    if (val) {
      const clean = notesStore.searchQuery.replace(/^type:journal\s*/, '')
      notesStore.searchQuery = `type:journal ${clean}`
    } else {
      notesStore.searchQuery = notesStore.searchQuery.replace(/^type:journal\s*/, '')
    }
  }
})

const cleanSearchQuery = computed({
  get() {
    return notesStore.searchQuery.replace(/^type:journal\s*/, '')
  },
  set(val: string) {
    if (isJournalOnly.value) {
      notesStore.searchQuery = `type:journal ${val}`
    } else {
      notesStore.searchQuery = val
    }
  }
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
      <div class="flex items-center gap-3 min-w-0">
        <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight truncate" :title="currentFolderTitle">{{ currentFolderTitle }}</h2>
        <span class="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full shrink-0">
          {{ displayNotes.length }} note{{ displayNotes.length > 1 ? 's' : '' }}
        </span>
      </div>
      
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
        
        <!-- Tri -->
        <div class="flex items-center bg-neutral-100 rounded-lg p-1 shrink-0">
          <button 
            @click="sortBy = 'date'"
            :class="['px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors', sortBy === 'date' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900']"
          >
            Récent
          </button>
          <button 
            @click="sortBy = 'alpha'"
            :class="['px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1', sortBy === 'alpha' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900']"
          >
            <ArrowDownAZ class="w-3.5 h-3.5" /> A-Z
          </button>
        </div>

        <!-- Bouton Nouvelle Note -->
        <Button @click="handleCreateNote" class="rounded-xl shadow-sm bg-primary-600 hover:bg-primary-700 text-white font-bold gap-2">
          <span>+ Note</span>
        </Button>
      </div>
    </div>

    <!-- Barre de recherche -->
    <div class="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input 
          v-model="cleanSearchQuery"
          type="text" 
          placeholder="Rechercher par titre, contenu ou tag..." 
          class="w-full pl-10 pr-9 py-2.5 bg-neutral-100/80 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary-300 focus:outline-none transition-all"
        />
        <button
          v-if="cleanSearchQuery"
          @click="cleanSearchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          title="Effacer la recherche"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filtre Journal -->
      <button 
        @click="isJournalOnly = !isJournalOnly"
        :class="[
          'px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border shrink-0',
          isJournalOnly 
            ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' 
            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
        ]"
      >
        <Calendar class="w-4 h-4" :class="isJournalOnly ? 'text-amber-600' : 'text-neutral-400'" />
        <span>Entrées Journal</span>
      </button>
    </div>

    <!-- Notes Container -->
    <div class="flex-1 overflow-y-auto pr-1">
      <div v-if="notesStore.loading" class="flex flex-col items-center justify-center h-64">
        <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-sm text-neutral-500 font-medium">Chargement de vos réflexions...</p>
      </div>

      <div v-else-if="displayNotes.length === 0" class="flex flex-col items-center justify-center h-64 text-center">
        <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
          <FileText class="w-8 h-8" />
        </div>
        <p class="text-base font-bold text-neutral-700">Aucune note trouvée</p>
        <p class="text-xs text-neutral-400 max-w-xs mt-1">Créez votre première réflexion dans ce dossier ou ajustez votre recherche.</p>
        <Button @click="handleCreateNote" variant="outline" class="mt-4 rounded-xl border-dashed">
          Créer une note ici
        </Button>
      </div>

      <!-- Liste / Grille de Notes -->
      <div v-else :class="{
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4': viewMode === 'grid',
        'flex flex-col gap-2': viewMode === 'list',
        'flex flex-col gap-1': viewMode === 'compact'
      }">
        <div 
          v-for="note in displayNotes" 
          :key="note.id"
          class="bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group relative"
          :class="{
            'p-5 rounded-2xl flex flex-col min-h-[10rem] h-auto': viewMode === 'grid',
            'p-4 rounded-xl flex items-center gap-4': viewMode === 'list',
            'py-2 px-3 rounded-lg flex items-center justify-between text-sm': viewMode === 'compact'
          }"
          @click="openNote(note)"
        >
          <div :class="{'flex-1 min-w-0': viewMode === 'list'}">
            <h3 class="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors"
                :class="{'text-base mb-1 line-clamp-2': viewMode === 'grid', 'text-base mb-1 truncate': viewMode === 'list', 'truncate': viewMode === 'compact'}"
                :title="note.title || 'Sans titre'">
              {{ note.title || 'Sans titre' }}
            </h3>
            <p v-if="viewMode !== 'compact'" class="text-sm text-neutral-500" :class="{'line-clamp-4': viewMode === 'grid', 'truncate': viewMode === 'list'}" :title="note.content?.replace(/<[^>]+>/g, '') || 'Note vide...'">
              {{ note.content?.replace(/<[^>]+>/g, '') || 'Note vide...' }}
            </p>
          </div>
          <div v-if="viewMode === 'list'" class="text-xs text-neutral-400 whitespace-nowrap shrink-0">
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
