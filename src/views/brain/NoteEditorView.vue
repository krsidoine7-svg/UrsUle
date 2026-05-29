<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes.store'
import { useNoteLinks } from '@/composables/useNoteLinks'
import NoteEditor from '@/components/brain/notes/NoteEditor.vue'
import NoteDeleteDialog from '@/components/brain/notes/NoteDeleteDialog.vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Tags, Folder, Download, Sparkles, Trash2, MoreHorizontal, X } from 'lucide-vue-next'
import FlashcardCreate from '@/components/brain/flashcards/FlashcardCreate.vue'
import { useToast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const showCreateFlashcard = ref(false)
const showDeleteDialog = ref(false)
const showMobileMenu = ref(false)
const router = useRouter()
const notesStore = useNotesStore()
const { extractTags, syncLinks } = useNoteLinks()
const { toast } = useToast()

const noteId = ref(route.params.id as string)
const title = ref('')
const contentHtml = ref('')
const contentJson = ref<any>(null)
const isSaving = ref(false)
const saveStatus = ref('Sauvegardé')

const wordCount = ref(0)
const readTime = ref(0)
const currentTags = ref<string[]>([])

onMounted(async () => {
  await notesStore.fetchFolders()
  
  if (noteId.value) {
    notesStore.setActiveNote(noteId.value)
    const note = notesStore.activeNote
    if (note) {
      title.value = note.title
      contentHtml.value = note.content || ''
      contentJson.value = note.content_json || null
      wordCount.value = note.word_count || 0
      readTime.value = note.read_time_minutes || 0
      currentTags.value = note.tags || []
    }
  }
})

const formattedFolders = computed(() => {
  const result: { id: string; name: string }[] = []
  
  function traverse(node: any, path: string) {
    const currentPath = path ? `${path} / ${node.name}` : node.name
    result.push({ id: node.id, name: `${node.icon || '📁'} ${currentPath}` })
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => traverse(child, currentPath))
    }
  }
  
  notesStore.folderTree.forEach((root: any) => traverse(root, ''))
  return result
})

async function handleMoveNote(event: Event) {
  const target = event.target as HTMLSelectElement
  const folderId = target.value === 'none' ? null : target.value
  
  if (noteId.value) {
    try {
      await notesStore.updateNote(noteId.value, { folder_id: folderId })
      await notesStore.fetchNotes()
    } catch (e) {
      console.error('Failed to move note', e)
    }
  }
}

function calculateStats(html: string) {
  const text = html.replace(/<[^>]*>?/gm, '')
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  wordCount.value = words.length
  readTime.value = Math.ceil(wordCount.value / 200)
}

async function handleSave() {
  if (!noteId.value) return
  
  isSaving.value = true
  saveStatus.value = 'Sauvegarde...'
  
  calculateStats(contentHtml.value)
  currentTags.value = extractTags(contentHtml.value)

  try {
    await notesStore.updateNote(noteId.value, {
      title: title.value,
      content: contentHtml.value,
      content_json: contentJson.value,
      word_count: wordCount.value,
      read_time_minutes: readTime.value,
      tags: currentTags.value
    })
    
    await syncLinks(noteId.value, contentHtml.value)
    saveStatus.value = 'Sauvegardé'
  } catch (error) {
    saveStatus.value = 'Erreur'
  } finally {
    isSaving.value = false
  }
}

function exportToMarkdown() {
  const frontmatter = [
    '---',
    `title: "${title.value}"`,
    `date: ${new Date().toISOString()}`,
    `tags: [${currentTags.value.join(', ')}]`,
    '---',
    ''
  ].join('\n')
  
  const blob = new Blob([frontmatter + contentHtml.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.value.toLowerCase().replace(/\s+/g, '-')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showMobileMenu.value = false
}

async function handleDeleteNote() {
  try {
    await notesStore.deleteNote(noteId.value)
    toast({ title: 'Note déplacée dans la corbeille 🗑️', description: 'Vous pouvez la restaurer depuis la corbeille.' })
    router.push('/brain/notes')
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  } finally {
    showDeleteDialog.value = false
    showMobileMenu.value = false
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- ═══ HEADER ═══ -->
    <header class="bg-white border-b border-neutral-200 px-3 sm:px-6 py-3 shrink-0">
      
      <!-- Ligne 1: Navigation + Titre + Actions -->
      <div class="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" @click="router.push('/brain/notes')" class="shrink-0 text-neutral-500 hover:text-neutral-900 -ml-1">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <input 
          v-model="title" 
          placeholder="Titre de la note"
          class="text-lg sm:text-2xl lg:text-3xl font-bold text-neutral-900 bg-transparent border-none outline-none w-full placeholder:text-neutral-300 min-w-0"
          @blur="handleSave"
        />

        <!-- Statut de sauvegarde -->
        <span class="text-xs font-medium shrink-0 hidden sm:inline" :class="isSaving ? 'text-primary-600' : 'text-neutral-400'">
          {{ saveStatus }}
        </span>

        <!-- Actions Desktop -->
        <div class="hidden md:flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            class="gap-1.5 border-primary-200 text-primary-700 bg-primary-50/50 hover:bg-primary-50 text-xs" 
            @click="showCreateFlashcard = true"
          >
            <Sparkles class="w-3.5 h-3.5 text-primary-500 fill-primary-500/20" />
            Flashcard
          </Button>
          <Button variant="outline" size="sm" class="gap-1.5 text-xs" @click="exportToMarkdown">
            <Download class="w-3.5 h-3.5" />
            <span class="hidden lg:inline">Exporter .md</span>
            <span class="lg:hidden">.md</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            class="gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100" 
            @click="showDeleteDialog = true"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span class="hidden lg:inline">Corbeille</span>
          </Button>
        </div>

        <!-- Actions Mobile: bouton "..." -->
        <div class="flex md:hidden items-center gap-1 shrink-0">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <MoreHorizontal class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Ligne 2: Métadonnées (masquée sur très petit écran) -->
      <div class="flex items-center gap-3 sm:gap-5 mt-2 pl-10 sm:pl-14 text-xs sm:text-sm text-neutral-500 flex-wrap">
        <div class="flex items-center gap-1.5" title="Temps de lecture">
          <Clock class="w-3.5 h-3.5 shrink-0" />
          <span>{{ readTime }}min · {{ wordCount }} mots</span>
        </div>
        <div class="flex items-center gap-1.5 min-w-0">
          <Tags class="w-3.5 h-3.5 shrink-0" />
          <div class="flex gap-1 flex-wrap max-w-[180px] sm:max-w-none">
            <span v-if="currentTags.length === 0" class="text-neutral-400 italic text-xs">Aucun tag</span>
            <span v-for="tag in currentTags.slice(0, 3)" :key="tag" class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap">
              #{{ tag }}
            </span>
            <span v-if="currentTags.length > 3" class="text-neutral-400 text-[10px]">+{{ currentTags.length - 3 }}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100/85 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer font-semibold text-neutral-600 border border-neutral-200/50 shadow-sm shrink-0">
          <Folder class="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select 
            :value="notesStore.activeNote?.folder_id || 'none'" 
            @change="handleMoveNote"
            class="bg-transparent border-none outline-none text-[10px] sm:text-[11px] font-bold cursor-pointer appearance-none select-none text-neutral-700 max-w-[80px] sm:max-w-[150px] md:max-w-none truncate"
          >
            <option value="none">📁 Non classé</option>
            <option v-for="folder in formattedFolders" :key="folder.id" :value="folder.id" class="truncate">
              {{ folder.name }}
            </option>
          </select>
        </div>
        <!-- Statut mobile -->
        <span class="sm:hidden text-xs ml-auto" :class="isSaving ? 'text-primary-600' : 'text-neutral-400'">
          {{ saveStatus }}
        </span>
      </div>
    </header>

    <!-- Mobile Action Dropdown -->
    <div 
      v-if="showMobileMenu"
      class="md:hidden bg-white border-b border-neutral-200 px-4 py-3 flex flex-col gap-2 shadow-sm shrink-0"
    >
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-700 bg-primary-50/70 hover:bg-primary-50 transition-colors"
        @click="showCreateFlashcard = true; showMobileMenu = false"
      >
        <Sparkles class="w-4 h-4 text-primary-500 fill-primary-500/20" />
        Créer une Flashcard
      </button>
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
        @click="exportToMarkdown"
      >
        <Download class="w-4 h-4 text-neutral-500" />
        Exporter en .md
      </button>
      <button
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
        @click="showDeleteDialog = true; showMobileMenu = false"
      >
        <Trash2 class="w-4 h-4 text-red-500" />
        Mettre à la corbeille
      </button>
    </div>

    <!-- Editor Area -->
    <div class="flex-1 overflow-hidden p-3 sm:p-6 bg-neutral-50/50">
      <div class="max-w-4xl mx-auto h-full">
        <NoteEditor 
          v-model="contentHtml"
          v-model:jsonValue="contentJson"
          @save="handleSave"
        />
      </div>
    </div>

    <!-- Modal Flashcard -->
    <FlashcardCreate 
      v-if="showCreateFlashcard"
      :note-id="noteId"
      :initial-deck-name="title"
      @close="showCreateFlashcard = false"
      @created="showCreateFlashcard = false"
    />

    <!-- Modal Suppression Note -->
    <NoteDeleteDialog
      v-if="showDeleteDialog"
      :note-id="noteId"
      :note-title="title"
      @close="showDeleteDialog = false"
      @confirm="handleDeleteNote"
    />
  </div>
</template>
