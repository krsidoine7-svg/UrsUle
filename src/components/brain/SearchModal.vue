<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'
import { notesService } from '@/services/notes.service'
import { useNotesStore } from '@/stores/notes.store'
import { Search, FileText, Folder, LibraryBig, Waypoints, Calendar, X, CornerDownLeft } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const notesStore = useNotesStore()

const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')
const selectedIndex = ref(0)
const loading = ref(false)

// Résultats de recherche typés
interface SearchResult {
  id: string
  title: string
  subtitle?: string
  type: 'note' | 'journal' | 'folder' | 'flashcard' | 'mindmap'
  path: string
}

const results = ref<SearchResult[]>([])

// Fermer le modal
function close() {
  emit('update:modelValue', false)
  query.value = ''
  results.value = []
}

// ─── SÉLECTION & NAVIGATION AU CLAVIER ─────────────────────────────

function selectNext() {
  if (results.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % results.value.length
  scrollToSelected()
}

function selectPrev() {
  if (results.value.length === 0) return
  selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
  scrollToSelected()
}

function selectCurrent() {
  const selected = results.value[selectedIndex.value]
  if (selected) {
    navigate(selected)
  }
}

function navigate(item: SearchResult) {
  close()
  router.push(item.path)
}

function scrollToSelected() {
  nextTick(() => {
    const activeEl = document.querySelector('.search-result-active')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

// ─── DEBOUNCED SEARCH ──────────────────────────────────────────────

let debounceTimeout: any

watch(query, (newQuery) => {
  clearTimeout(debounceTimeout)
  if (!newQuery.trim()) {
    results.value = []
    selectedIndex.value = 0
    return
  }
  
  loading.value = true
  debounceTimeout = setTimeout(async () => {
    try {
      await performSearch(newQuery)
    } catch (e) {
      console.error('Failed search:', e)
    } finally {
      loading.value = false
    }
  }, 200)
})

async function performSearch(searchTerm: string) {
  const searchResults: SearchResult[] = []
  
  // 1. Recherche Notes & Journaux (Postgres FTS)
  try {
    const notes = await notesService.searchNotes(searchTerm)
    notes.forEach(n => {
      if (n.is_journal) {
        searchResults.push({
          id: n.id,
          title: n.title,
          subtitle: `Journal • ${n.journal_date}`,
          type: 'journal',
          path: `/brain/journal`
        })
      } else {
        searchResults.push({
          id: n.id,
          title: n.title,
          subtitle: n.content ? n.content.replace(/<[^>]*>/g, ' ').substring(0, 80) + '...' : 'Pas de contenu',
          type: 'note',
          path: `/brain/notes/${n.id}`
        })
      }
    })
  } catch (err) {
    console.error('Error searching notes:', err)
  }

  // 2. Recherche Dossiers (Local Store)
  const folders = notesStore.folders.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
  folders.forEach(f => {
    searchResults.push({
      id: f.id,
      title: f.name,
      subtitle: 'Dossier de notes',
      type: 'folder',
      path: `/brain/notes` // Clic redirige vers la liste et on peut activer le dossier dans le store
    })
  })

  // 3. Recherche Flashcards (Supabase)
  try {
    const { data: flashcards } = await supabase
      .from('flashcards')
      .select('id, question, answer')
      .or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`)
      .is('deleted_at', null)
      .limit(5)

    if (flashcards) {
      flashcards.forEach(f => {
        searchResults.push({
          id: f.id,
          title: f.question,
          subtitle: `Flashcard • R : ${f.answer.substring(0, 40)}`,
          type: 'flashcard',
          path: `/brain/flashcards`
        })
      })
    }
  } catch (err) {
    console.error('Error searching flashcards:', err)
  }

  // 4. Recherche Mind Maps (Supabase)
  try {
    const { data: mindMaps } = await supabase
      .from('mind_maps')
      .select('id, title')
      .ilike('title', `%${searchTerm}%`)
      .is('deleted_at', null)
      .limit(5)

    if (mindMaps) {
      mindMaps.forEach(m => {
        searchResults.push({
          id: m.id,
          title: m.title,
          subtitle: 'Mind Map',
          type: 'mindmap',
          path: `/brain/mindmap`
        })
      })
    }
  } catch (err) {
    console.error('Error searching mindmaps:', err)
  }

  results.value = searchResults
  selectedIndex.value = 0
}

// ─── RACCOURCI CLAVIER ───

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:modelValue', !props.modelValue)
  }
}

// Surlignage des termes
function highlightText(text: string, search: string) {
  if (!search) return text
  const pattern = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
  return text.replace(pattern, '<mark class="bg-amber-100 text-amber-900 rounded font-bold px-0.5">$1</mark>')
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleGlobalKeydown)
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    query.value = ''
    results.value = []
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  clearTimeout(debounceTimeout)
})
</script>

<template>
  <div 
    v-if="modelValue"
    class="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
  >
    <!-- Overlay noir transparent flouté -->
    <div 
      class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
      @click="close"
    />

    <!-- Boîte de dialogue du modal -->
    <div 
      class="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-neutral-100 overflow-hidden relative flex flex-col max-h-[60vh] z-10 animate-in fade-in zoom-in-95 duration-150"
      @keydown.down.prevent="selectNext"
      @keydown.up.prevent="selectPrev"
      @keydown.enter.prevent="selectCurrent"
      @keydown.esc.prevent="close"
    >
      <!-- Zone d'input de recherche -->
      <div class="flex items-center border-b border-neutral-100 px-4 py-3 gap-3 bg-neutral-50 shrink-0">
        <Search class="w-5 h-5 text-neutral-400 shrink-0" />
        <input 
          ref="searchInput"
          v-model="query"
          type="text"
          placeholder="Rechercher des notes, tags, dossiers, flashcards..."
          class="w-full bg-transparent border-none text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-0"
          autocomplete="off"
        />
        <button 
          @click="close"
          class="p-1 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Zone des résultats -->
      <div class="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <!-- État vide -->
        <div 
          v-if="results.length === 0" 
          class="py-12 text-center flex flex-col items-center justify-center text-neutral-400"
        >
          <Search class="w-8 h-8 mb-3 text-neutral-300" />
          <p class="text-sm font-semibold mb-1">
            {{ query ? 'Aucun résultat trouvé' : 'Recherche globale rapide' }}
          </p>
          <p class="text-xs text-neutral-400">
            {{ query ? 'Essayez avec un autre terme ou mot-clé' : 'Commencez à saisir un mot-clé pour lancer la recherche' }}
          </p>
        </div>

        <!-- Liste des résultats -->
        <div v-else class="space-y-0.5">
          <button
            v-for="(item, idx) in results"
            :key="item.id"
            @click="navigate(item)"
            :class="[
              'w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl transition-all duration-100 group relative',
              idx === selectedIndex 
                ? 'bg-primary-50 text-primary-700 search-result-active shadow-sm' 
                : 'hover:bg-neutral-50 text-neutral-700'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Icône par type -->
              <div 
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                  idx === selectedIndex 
                    ? 'bg-white border-primary-200 text-primary-600' 
                    : 'bg-neutral-50 border-neutral-100 text-neutral-500'
                ]"
              >
                <FileText v-if="item.type === 'note'" class="w-4 h-4" />
                <Calendar v-else-if="item.type === 'journal'" class="w-4 h-4 text-emerald-500" />
                <Folder v-else-if="item.type === 'folder'" class="w-4 h-4 text-blue-500" />
                <LibraryBig v-else-if="item.type === 'flashcard'" class="w-4 h-4 text-purple-500" />
                <Waypoints v-else-if="item.type === 'mindmap'" class="w-4 h-4 text-orange-500" />
              </div>

              <!-- Titres & extraits -->
              <div class="min-w-0">
                <div 
                  class="text-sm font-semibold truncate leading-tight group-hover:text-primary-700"
                  v-html="highlightText(item.title, query)"
                ></div>
                <div 
                  v-if="item.subtitle"
                  class="text-xs text-neutral-400 font-medium truncate mt-0.5"
                  v-html="highlightText(item.subtitle, query)"
                ></div>
              </div>
            </div>

            <!-- Raccourci action (Entrée) -->
            <div 
              v-if="idx === selectedIndex"
              class="flex items-center gap-1 text-[10px] font-bold text-primary-600 bg-white border border-primary-200/60 rounded-md px-1.5 py-0.5 shadow-sm shrink-0"
            >
              ouvrir <CornerDownLeft class="w-2.5 h-2.5" />
            </div>
          </button>
        </div>
      </div>

      <!-- Footer légendes clavier -->
      <div class="px-4 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 font-bold shrink-0">
        <div class="flex items-center gap-4">
          <span><kbd class="bg-white border rounded px-1.5 py-0.5 shadow-sm text-neutral-500 font-sans">↑↓</kbd> Naviguer</span>
          <span><kbd class="bg-white border rounded px-1.5 py-0.5 shadow-sm text-neutral-500 font-sans">Entrée</kbd> Sélectionner</span>
          <span><kbd class="bg-white border rounded px-1.5 py-0.5 shadow-sm text-neutral-500 font-sans">Échap</kbd> Fermer</span>
        </div>
        <div>
          <span>UrsUle Brain Search</span>
        </div>
      </div>
    </div>
  </div>
</template>
