<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes.store'
import { useToast } from '@/components/ui/toast/use-toast'
import { Button } from '@/components/ui/button'
import { 
  Trash2, RotateCcw, FileText, Folder, AlertTriangle, Loader2, ArrowLeft, Flame
} from 'lucide-vue-next'
import type { Note, NoteFolder } from '@/types/brain.types'

const notesStore = useNotesStore()
const router = useRouter()
const { toast } = useToast()

const activeTab = ref<'notes' | 'folders'>('notes')
const confirmPermanentId = ref<string | null>(null)
const confirmPermanentType = ref<'note' | 'folder'>('note')

onMounted(() => {
  notesStore.fetchTrash()
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

async function handleRestoreNote(note: Note) {
  try {
    await notesStore.restoreNote(note.id)
    toast({ title: 'Note restaurée ✅', description: `"${note.title}" est de retour dans vos notes.` })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleRestoreFolder(folder: NoteFolder) {
  try {
    await notesStore.restoreFolder(folder.id)
    toast({ title: 'Dossier restauré ✅', description: `"${folder.name}" est de retour dans votre arborescence.` })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

function askPermanentDelete(id: string, type: 'note' | 'folder') {
  confirmPermanentId.value = id
  confirmPermanentType.value = type
}

async function handleDeletePermanent() {
  if (!confirmPermanentId.value) return
  try {
    if (confirmPermanentType.value === 'note') {
      await notesStore.deleteNotePermanent(confirmPermanentId.value)
      toast({ title: 'Note supprimée définitivement 🔥', description: 'Cette action était irréversible.' })
    } else {
      await notesStore.deleteFolderPermanent(confirmPermanentId.value)
      toast({ title: 'Dossier supprimé définitivement 🔥', description: 'Cette action était irréversible.' })
    }
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    confirmPermanentId.value = null
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-neutral-200 px-6 py-5 shrink-0 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.push('/brain/notes')" class="text-neutral-500 hover:text-neutral-900 shrink-0">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <div>
          <h2 class="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Trash2 class="w-5 h-5 text-red-500" />
            Corbeille du Cerveau
          </h2>
          <p class="text-sm text-neutral-500 font-medium mt-0.5">
            Restaurez vos notes et dossiers ou supprimez-les définitivement.
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white border-b border-neutral-200 px-6 shrink-0">
      <div class="flex gap-1">
        <button
          @click="activeTab = 'notes'"
          :class="[
            'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all',
            activeTab === 'notes'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
          ]"
        >
          <FileText class="w-4 h-4" />
          Notes
          <span class="ml-1 bg-red-100 text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">
            {{ notesStore.deletedNotes.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'folders'"
          :class="[
            'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all',
            activeTab === 'folders'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
          ]"
        >
          <Folder class="w-4 h-4" />
          Dossiers
          <span class="ml-1 bg-red-100 text-red-600 text-xs font-black px-1.5 py-0.5 rounded-full">
            {{ notesStore.deletedFolders.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- Loading -->
      <div v-if="notesStore.loadingTrash" class="flex items-center justify-center h-40">
        <Loader2 class="w-6 h-6 animate-spin text-primary-500" />
      </div>

      <!-- Notes Tab -->
      <div v-else-if="activeTab === 'notes'">
        <div v-if="notesStore.deletedNotes.length === 0" class="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-neutral-200 rounded-3xl">
          <Trash2 class="w-10 h-10 text-neutral-300 mb-3" />
          <p class="text-neutral-500 font-semibold">Aucune note dans la corbeille</p>
          <p class="text-sm text-neutral-400 mt-1">Vos notes supprimées apparaîtront ici.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="note in notesStore.deletedNotes"
            :key="note.id"
            class="group bg-white border border-neutral-200 hover:border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all hover:shadow-sm"
          >
            <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0">
                <FileText class="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-neutral-800 truncate group-hover:text-neutral-900 text-sm sm:text-base">
                  {{ note.title || 'Note sans titre' }}
                </p>
                <p class="text-[10px] sm:text-xs text-neutral-400 font-medium mt-0.5">
                  Supprimée le {{ formatDate(note.deleted_at!) }}
                </p>
                <p class="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                  {{ note.word_count }} mots · {{ note.tags?.length || 0 }} tag(s)
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                class="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5 h-8 text-xs flex-1 sm:flex-none"
                @click="handleRestoreNote(note)"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                Restaurer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 font-bold gap-1.5 h-8 text-xs flex-1 sm:flex-none"
                @click="askPermanentDelete(note.id, 'note')"
              >
                <Flame class="w-3.5 h-3.5" />
                Purger
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Folders Tab -->
      <div v-else-if="activeTab === 'folders'">
        <div v-if="notesStore.deletedFolders.length === 0" class="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-neutral-200 rounded-3xl">
          <Folder class="w-10 h-10 text-neutral-300 mb-3" />
          <p class="text-neutral-500 font-semibold">Aucun dossier dans la corbeille</p>
          <p class="text-sm text-neutral-400 mt-1">Vos dossiers supprimés apparaîtront ici.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="folder in notesStore.deletedFolders"
            :key="folder.id"
            class="group bg-white border border-neutral-200 hover:border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all hover:shadow-sm"
          >
            <div class="flex items-center gap-3 sm:gap-4 min-w-0">
              <div 
                class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                :style="{ backgroundColor: (folder.color || '#3B82F6') + '20' }"
              >
                <Folder class="w-4.5 h-4.5 sm:w-5 sm:h-5" :style="{ color: folder.color || '#3B82F6' }" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-neutral-800 truncate group-hover:text-neutral-900 text-sm sm:text-base">
                  {{ folder.name }}
                </p>
                <p class="text-[10px] sm:text-xs text-neutral-400 font-medium mt-0.5">
                  Supprimé le {{ formatDate(folder.deleted_at!) }}
                </p>
                <p v-if="folder.parent_id" class="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                  Sous-dossier
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity w-full sm:w-auto justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0">
              <Button
                variant="outline"
                size="sm"
                class="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold gap-1.5 h-8 text-xs flex-1 sm:flex-none"
                @click="handleRestoreFolder(folder)"
              >
                <RotateCcw class="w-3.5 h-3.5" />
                Restaurer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 font-bold gap-1.5 h-8 text-xs flex-1 sm:flex-none"
                @click="askPermanentDelete(folder.id, 'folder')"
              >
                <Flame class="w-3.5 h-3.5" />
                Purger
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal confirmation suppression définitive -->
    <div v-if="confirmPermanentId" class="fixed inset-0 bg-neutral-900/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4" @click.self="confirmPermanentId = null">
      <div class="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-neutral-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-red-50 to-rose-50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle class="w-4.5 h-4.5" />
            </div>
            <h3 class="text-base font-bold text-neutral-900">Suppression définitive</h3>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-neutral-700 leading-relaxed">
            Cette action est <strong class="text-red-600">irréversible</strong>. 
            {{ confirmPermanentType === 'note' ? 'La note' : 'Le dossier' }} et toutes ses données associées 
            seront <strong class="text-red-600">définitivement perdues</strong>.
          </p>
          <div class="bg-red-50 border border-red-100 rounded-2xl p-3 text-xs text-red-700 font-semibold flex gap-2">
            <Flame class="w-4 h-4 text-red-500 shrink-0" />
            Aucune restauration possible après confirmation.
          </div>
          <div class="flex gap-3 pt-1">
            <Button variant="outline" class="flex-1 rounded-xl font-bold border-neutral-200" @click="confirmPermanentId = null">
              Annuler
            </Button>
            <Button
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm gap-2"
              @click="handleDeletePermanent"
            >
              <Flame class="w-4 h-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
