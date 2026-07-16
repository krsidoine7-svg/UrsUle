<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui.store'
import { useNotesStore } from '@/stores/notes.store'
import { notesService } from '@/services/notes.service'
import { flashcardsService } from '@/services/flashcards.service'
import type { Note, NoteFolder, Flashcard } from '@/types/brain.types'
import { 
  Search, X, FileText, Calendar, Folder, Hash, Layers, Brain, 
  ArrowRight, CornerDownLeft, Loader2, Sparkles, Clock
} from 'lucide-vue-next'

const router = useRouter()
const uiStore = useUIStore()
const notesStore = useNotesStore()

const searchInputRef = ref<HTMLInputElement | null>(null)
const query = ref('')
const activeTab = ref<'all' | 'notes' | 'journals' | 'folders' | 'flashcards' | 'tags'>('all')
const isSearching = ref(false)
const selectedIndex = ref(0)

// Résultats
const foundNotes = ref<Note[]>([])
const foundFlashcards = ref<Flashcard[]>([])
let debounceTimer: any = null

const isOpen = computed(() => uiStore.isGlobalSearchOpen)

// Navigation vers la recherche et filtrage local/distant
async function performSearch(q: string) {
  const clean = q.trim()
  if (!clean) {
    foundNotes.value = []
    foundFlashcards.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  try {
    const [notesRes, cardsRes] = await Promise.all([
      notesService.searchNotes(clean),
      flashcardsService.searchFlashcards(clean)
    ])
    foundNotes.value = notesRes
    foundFlashcards.value = cardsRes
  } catch (err) {
    console.error('Erreur lors de la recherche globale:', err)
    // Fallback sur les notes en mémoire dans le store
    const lower = clean.toLowerCase()
    foundNotes.value = notesStore.notes.filter(n => 
      !n.deleted_at && (
        n.title.toLowerCase().includes(lower) || 
        (n.content && n.content.toLowerCase().includes(lower)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(lower)))
      )
    )
  } finally {
    isSearching.value = false
    selectedIndex.value = 0
  }
}

watch(query, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!newVal.trim()) {
    foundNotes.value = []
    foundFlashcards.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  debounceTimer = setTimeout(() => {
    performSearch(newVal)
  }, 200)
})

// Sections filtrées
const sectionNotes = computed(() => foundNotes.value.filter(n => !n.is_journal))
const sectionJournals = computed(() => foundNotes.value.filter(n => n.is_journal))
const sectionFolders = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return notesStore.folders.filter(f => !f.deleted_at && f.name.toLowerCase().includes(q))
})
const sectionTags = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const allTags = new Set<string>()
  notesStore.notes.forEach(n => {
    if (!n.deleted_at && n.tags) {
      n.tags.forEach(t => {
        if (t.toLowerCase().includes(q)) allTags.add(t)
      })
    }
  })
  return Array.from(allTags).map(name => ({ id: name, name, type: 'tag' }))
})
const sectionFlashcards = computed(() => foundFlashcards.value)

interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
  snippet?: string
  type: 'note' | 'journal' | 'folder' | 'flashcard' | 'tag'
  rawItem?: any
}

// Liste aplatie pour la navigation au clavier
const flattenedResults = computed<SearchResultItem[]>(() => {
  const list: SearchResultItem[] = []

  if (activeTab.value === 'all' || activeTab.value === 'notes') {
    sectionNotes.value.forEach(n => {
      list.push({
        id: n.id,
        title: n.title || 'Sans titre',
        subtitle: getFolderName(n.folder_id),
        snippet: getHighlightedSnippet(n.content || '', query.value),
        type: 'note',
        rawItem: n
      })
    })
  }

  if (activeTab.value === 'all' || activeTab.value === 'journals') {
    sectionJournals.value.forEach(n => {
      list.push({
        id: n.id,
        title: n.title || (n.journal_date ? `Journal du ${n.journal_date}` : 'Journal'),
        subtitle: 'Journal quotidien',
        snippet: getHighlightedSnippet(n.content || '', query.value),
        type: 'journal',
        rawItem: n
      })
    })
  }

  if (activeTab.value === 'all' || activeTab.value === 'folders') {
    sectionFolders.value.forEach(f => {
      list.push({
        id: f.id,
        title: f.name,
        subtitle: 'Dossier de notes',
        type: 'folder',
        rawItem: f
      })
    })
  }

  if (activeTab.value === 'all' || activeTab.value === 'flashcards') {
    sectionFlashcards.value.forEach(c => {
      list.push({
        id: c.id,
        title: c.question,
        subtitle: c.deck_name || 'Flashcard',
        snippet: getHighlightedSnippet(c.answer, query.value),
        type: 'flashcard',
        rawItem: c
      })
    })
  }

  if (activeTab.value === 'all' || activeTab.value === 'tags') {
    sectionTags.value.forEach(t => {
      list.push({
        id: t.id,
        title: `#${t.name}`,
        subtitle: 'Tag',
        type: 'tag',
        rawItem: t
      })
    })
  }

  return list
})

function getFolderName(folderId?: string): string {
  if (!folderId) return 'Notes libres'
  const f = notesStore.folders.find(folder => folder.id === folderId)
  return f ? f.name : 'Notes libres'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getHighlightedSnippet(htmlOrText: string, q: string): string {
  if (!htmlOrText || !q.trim()) return ''
  // Nettoyer les balises HTML brutes
  const rawText = htmlOrText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
  if (!rawText) return ''

  const lowerText = rawText.toLowerCase()
  const lowerQ = q.trim().toLowerCase()
  const matchIndex = lowerText.indexOf(lowerQ)

  let snippet = ''
  if (matchIndex !== -1) {
    const start = Math.max(0, matchIndex - 35)
    const end = Math.min(rawText.length, matchIndex + lowerQ.length + 65)
    snippet = (start > 0 ? '...' : '') + rawText.substring(start, end) + (end < rawText.length ? '...' : '')
  } else {
    snippet = rawText.substring(0, 100) + (rawText.length > 100 ? '...' : '')
  }

  const escaped = escapeHtml(snippet)
  const escapedQ = escapeHtml(q.trim())
  const regex = new RegExp(`(${escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return escaped.replace(regex, '<mark class="bg-amber-200 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 font-semibold px-0.5 rounded">$1</mark>')
}

function selectItem(item?: SearchResultItem) {
  const target = item || flattenedResults.value[selectedIndex.value]
  if (!target) return

  uiStore.closeGlobalSearch()

  if (target.type === 'note') {
    router.push(`/brain/notes/${target.id}`)
  } else if (target.type === 'journal') {
    if (target.rawItem?.journal_date) {
      router.push(`/brain/journal?date=${target.rawItem.journal_date}`)
    } else {
      router.push(`/brain/notes/${target.id}`)
    }
  } else if (target.type === 'folder') {
    notesStore.selectedFolder = target.id
    router.push('/brain/notes')
  } else if (target.type === 'flashcard') {
    if (target.rawItem?.note_id) {
      router.push(`/brain/notes/${target.rawItem.note_id}`)
    } else {
      router.push('/brain/flashcards')
    }
  } else if (target.type === 'tag') {
    notesStore.searchQuery = `#${target.title.replace(/^#/, '')}`
    router.push('/brain/notes')
  }
}

// Raccourcis et navigation clavier
function handleKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    uiStore.toggleGlobalSearch()
    return
  }

  if (!isOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    uiStore.closeGlobalSearch()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (flattenedResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % flattenedResults.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (flattenedResults.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + flattenedResults.value.length) % flattenedResults.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    selectItem()
  }
}

watch(isOpen, (newVal) => {
  if (newVal) {
    selectedIndex.value = 0
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  } else {
    query.value = ''
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-neutral-900/60 backdrop-blur-sm" @click.self="uiStore.closeGlobalSearch()">
      <div class="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in zoom-in-95 duration-150">
        <!-- Search Input Bar -->
        <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Search class="h-5 w-5 text-neutral-400 shrink-0" />
          <input
            ref="searchInputRef"
            v-model="query"
            type="text"
            placeholder="Rechercher une note, un journal, un tag, un dossier ou une flashcard..."
            class="w-full bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-base font-medium"
          />
          <Loader2 v-if="isSearching" class="h-5 w-5 text-primary-600 animate-spin shrink-0" />
          <button
            @click="uiStore.closeGlobalSearch()"
            class="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Filter Tabs -->
        <div class="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/60 dark:bg-neutral-800/30 flex items-center gap-1 overflow-x-auto">
          <button
            @click="activeTab = 'all'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0"
            :class="activeTab === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            Tout <span class="opacity-75 ml-0.5">({{ flattenedResults.length }})</span>
          </button>
          <button
            v-if="sectionNotes.length > 0 || activeTab === 'notes'"
            @click="activeTab = 'notes'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            :class="activeTab === 'notes' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            <FileText class="h-3.5 w-3.5" /> Notes <span class="opacity-75">({{ sectionNotes.length }})</span>
          </button>
          <button
            v-if="sectionJournals.length > 0 || activeTab === 'journals'"
            @click="activeTab = 'journals'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            :class="activeTab === 'journals' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            <Calendar class="h-3.5 w-3.5" /> Journaux <span class="opacity-75">({{ sectionJournals.length }})</span>
          </button>
          <button
            v-if="sectionFolders.length > 0 || activeTab === 'folders'"
            @click="activeTab = 'folders'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            :class="activeTab === 'folders' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            <Folder class="h-3.5 w-3.5" /> Dossiers <span class="opacity-75">({{ sectionFolders.length }})</span>
          </button>
          <button
            v-if="sectionFlashcards.length > 0 || activeTab === 'flashcards'"
            @click="activeTab = 'flashcards'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            :class="activeTab === 'flashcards' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            <Layers class="h-3.5 w-3.5" /> Flashcards <span class="opacity-75">({{ sectionFlashcards.length }})</span>
          </button>
          <button
            v-if="sectionTags.length > 0 || activeTab === 'tags'"
            @click="activeTab = 'tags'"
            class="px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
            :class="activeTab === 'tags' ? 'bg-primary-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'"
          >
            <Hash class="h-3.5 w-3.5" /> Tags <span class="opacity-75">({{ sectionTags.length }})</span>
          </button>
        </div>

        <!-- Results List -->
        <div class="flex-1 overflow-y-auto p-3 divide-y divide-neutral-100 dark:divide-neutral-800/50">
          <!-- Empty State when typing returns nothing -->
          <div v-if="query.trim() && !isSearching && flattenedResults.length === 0" class="py-12 text-center flex flex-col items-center justify-center text-neutral-400">
            <Search class="h-10 w-10 stroke-1 mb-2 opacity-40" />
            <p class="text-sm font-medium">Aucun résultat trouvé pour "{{ query }}"</p>
            <p class="text-xs text-neutral-500 mt-1">Essayez d'autres mots-clés ou vérifiez l'orthographe.</p>
          </div>

          <!-- Empty State before typing -->
          <div v-else-if="!query.trim()" class="py-8 px-4 flex flex-col items-center justify-center text-center text-neutral-400">
            <Sparkles class="h-8 w-8 text-primary-500 mb-2 opacity-80" />
            <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Recherche Plein Texte & Instantanée</p>
            <p class="text-xs text-neutral-500 max-w-sm mt-1">
              Saisissez votre requête ci-dessus pour explorer simultanément vos notes, journaux quotidiens, dossiers et flashcards.
            </p>
          </div>

          <!-- Flattened results item list -->
          <div
            v-for="(item, index) in flattenedResults"
            :key="`${item.type}-${item.id}`"
            @click="selectItem(item)"
            @mouseenter="selectedIndex = index"
            class="p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors select-none"
            :class="selectedIndex === index ? 'bg-primary-50 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border border-transparent'"
          >
            <!-- Icon by Type -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              :class="[
                item.type === 'note' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : '',
                item.type === 'journal' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' : '',
                item.type === 'folder' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : '',
                item.type === 'flashcard' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : '',
                item.type === 'tag' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : ''
              ]"
            >
              <FileText v-if="item.type === 'note'" class="h-4 w-4" />
              <Calendar v-else-if="item.type === 'journal'" class="h-4 w-4" />
              <Folder v-else-if="item.type === 'folder'" class="h-4 w-4" />
              <Layers v-else-if="item.type === 'flashcard'" class="h-4 w-4" />
              <Hash v-else-if="item.type === 'tag'" class="h-4 w-4" />
            </div>

            <!-- Main Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">{{ item.title }}</span>
                <span v-if="item.subtitle" class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 shrink-0">
                  {{ item.subtitle }}
                </span>
              </div>
              <p v-if="item.snippet" class="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed font-normal" v-html="item.snippet" />
            </div>

            <!-- Action Arrow -->
            <div class="shrink-0 self-center pl-2 text-neutral-400" :class="selectedIndex === index ? 'text-primary-600 dark:text-primary-400' : 'opacity-0'">
              <CornerDownLeft class="h-4 w-4" />
            </div>
          </div>
        </div>

        <!-- Footer / Shortcuts -->
        <div class="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono shadow-sm">↑</kbd>
              <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono shadow-sm">↓</kbd>
              <span>pour naviguer</span>
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono shadow-sm">↵</kbd>
              <span>pour ouvrir</span>
            </span>
          </div>
          <span class="flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-mono shadow-sm">Échap</kbd>
            <span>pour fermer</span>
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
