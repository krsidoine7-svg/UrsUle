<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref, onMounted, watch } from 'vue'
import { Brain, FileText, Share2, Search, LibraryBig, Calendar, Waypoints, Network, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Trash2, Menu, X, BarChart2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useNotesStore } from '@/stores/notes.store'
import FolderTree from '@/components/brain/notes/FolderTree.vue'
import SearchModal from '@/components/brain/SearchModal.vue'
 
const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()
const showSearchModal = ref(false)
 
const isRightSidebarOpen = ref(false) // fermé par défaut sur mobile
const isLeftSidebarOpen = ref(false)  // fermé par défaut sur mobile
const isTopHeaderOpen = ref(true)
const isMobileNavOpen = ref(false)    // drawer nav mobile
 
// Détecter la taille d'écran
const isDesktop = ref(false)
 
function checkScreenSize() {
  isDesktop.value = window.innerWidth >= 1024 // lg breakpoint
  if (isDesktop.value) {
    // Sur desktop: sidebars ouvertes par défaut
    if (!isLeftSidebarOpenInitialized.value) {
      isLeftSidebarOpen.value = true
      isLeftSidebarOpenInitialized.value = true
    }
  } else {
    // Sur mobile: sidebars fermées, fermer aussi le drawer nav
    isRightSidebarOpen.value = false
  }
}
 
const isLeftSidebarOpenInitialized = ref(false)
 
onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  notesStore.fetchNotes()
  notesStore.fetchFolders()
})
 
const navLinks = [
  { path: '/brain/notes', label: 'Notes', icon: FileText },
  { path: '/brain/graph', label: 'Graphe', icon: Network },
  { path: '/brain/flashcards', label: 'Flashcards', icon: LibraryBig },
  { path: '/brain/mindmap', label: 'Mind Map', icon: Waypoints },
  { path: '/brain/journal', label: 'Journal', icon: Calendar },
  { path: '/brain/stats', label: 'Stats', icon: BarChart2 },
]
 
const currentPath = computed(() => {
  if (route.path.startsWith('/brain/notes')) return '/brain/notes'
  return route.path
})
 
// Fermer le menu mobile au clic sur un dossier
watch(() => notesStore.selectedFolder, () => {
  if (!isDesktop.value) {
    isLeftSidebarOpen.value = false
  }
})
 
async function handleCreateNote() {
  try {
    const newNote = await notesStore.createNote({
      title: 'Nouvelle note',
      content: ''
    })
    isMobileNavOpen.value = false
    isLeftSidebarOpen.value = false
    router.push(`/brain/notes/${newNote.id}`)
  } catch (e) {
    console.error('Failed to create note', e)
  }
}
 
function navigateTo(path: string) {
  router.push(path)
  isMobileNavOpen.value = false
  isLeftSidebarOpen.value = false
}
</script>

<template>
  <div class="flex flex-col h-screen bg-neutral-50 overflow-hidden relative">
    
    <!-- ═══ TOPBAR ═══ -->
    <!-- Bouton repli topbar (Desktop uniquement) -->
    <button 
      @click="isTopHeaderOpen = !isTopHeaderOpen"
      class="hidden lg:flex absolute top-0 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 border border-t-0 border-blue-700 rounded-b-lg px-4 py-0.5 shadow-md z-[60] text-white transition-colors items-center"
      title="Basculer la barre de navigation supérieure"
    >
      <ChevronUp v-if="isTopHeaderOpen" class="w-4 h-4" />
      <ChevronDown v-else class="w-4 h-4" />
    </button>

    <!-- Header Desktop -->
    <header 
      class="bg-white border-neutral-200 shrink-0 z-10 transition-all duration-300 ease-in-out"
      :class="isTopHeaderOpen ? 'h-16 border-b' : 'h-0 border-b-0 overflow-hidden opacity-0'"
    >
      <!-- Desktop Header inner -->
      <div class="hidden lg:flex items-center justify-between h-full px-6">
        <!-- Logo -->
        <div class="flex items-center gap-3 w-[220px] shrink-0">
          <div class="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Brain class="h-5 w-5" />
          </div>
          <div>
            <h1 class="font-bold text-neutral-900 text-sm leading-tight">UrsUle Brain</h1>
            <p class="text-[10px] text-neutral-500 font-medium">Second cerveau connecté</p>
          </div>
        </div>

        <!-- Nav Tabs -->
        <nav class="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl shrink-0">
          <button
            v-for="link in navLinks"
            :key="link.path"
            @click="router.push(link.path)"
            :class="[
              'px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all',
              currentPath === link.path 
                ? 'bg-white text-primary-700 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
            ]"
          >
            <component :is="link.icon" class="h-4 w-4" />
            {{ link.label }}
          </button>
        </nav>

        <!-- Search -->
        <div class="flex items-center gap-2 w-[220px] justify-end shrink-0">
          <Button @click="showSearchModal = true" variant="outline" size="icon" class="rounded-xl" title="Rechercher (Ctrl+K)">
            <Search class="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      <!-- Mobile Header inner -->
      <div class="flex lg:hidden items-center justify-between h-full px-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <Brain class="h-4 w-4" />
          </div>
          <span class="font-bold text-neutral-900">UrsUle Brain</span>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="rounded-xl" @click="isLeftSidebarOpen = true">
            <Menu class="h-5 w-5 text-neutral-600" />
          </Button>
        </div>
      </div>
    </header>

    <!-- ═══ MOBILE NAV DRAWER (overlay) ═══ -->
    <div 
      v-if="isLeftSidebarOpen && !isDesktop"
      class="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-[80] lg:hidden"
      @click="isLeftSidebarOpen = false"
    />
    <aside
      class="fixed top-0 left-0 h-full bg-white z-[90] flex flex-col transition-all duration-300 ease-in-out lg:hidden shadow-2xl"
      :class="isLeftSidebarOpen && !isDesktop ? 'translate-x-0 w-72' : '-translate-x-full w-72'"
    >
      <!-- Drawer header -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-100">
        <div class="flex items-center gap-2">
          <Brain class="h-5 w-5 text-primary-600" />
          <span class="font-bold text-neutral-900">Navigation</span>
        </div>
        <button @click="isLeftSidebarOpen = false" class="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Mobile Nav Links -->
      <div class="px-3 py-3 border-b border-neutral-100">
        <Button 
          @click="handleCreateNote"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm mb-3"
        >
          <FileText class="w-4 h-4 mr-2" />
          Nouvelle note
        </Button>
        <nav class="space-y-1">
          <button
            v-for="link in navLinks"
            :key="link.path"
            @click="navigateTo(link.path)"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left',
              currentPath === link.path 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-neutral-600 hover:bg-neutral-100'
            ]"
          >
            <component :is="link.icon" class="h-4 w-4 shrink-0" />
            {{ link.label }}
          </button>
        </nav>
      </div>

      <!-- Mobile Folder Tree -->
      <div class="flex-1 overflow-y-auto p-3">
        <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1">Dossiers</p>
        <FolderTree />
      </div>

      <!-- Mobile Corbeille -->
      <div class="border-t border-neutral-100 p-3 shrink-0">
        <button
          @click="navigateTo('/brain/trash')"
          :class="[
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
            route.path === '/brain/trash'
              ? 'bg-red-50 text-red-700'
              : 'text-neutral-500 hover:text-red-600 hover:bg-red-50/60'
          ]"
        >
          <Trash2 class="w-4 h-4 shrink-0" />
          Corbeille
        </button>
      </div>
    </aside>

    <!-- ═══ MAIN LAYOUT (Desktop: 3 colonnes, Mobile: 1 colonne) ═══ -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- Sidebar Gauche Desktop UNIQUEMENT -->
      <aside 
        class="hidden lg:flex bg-white border-neutral-200 flex-col shrink-0 transition-all duration-300 ease-in-out"
        :class="isLeftSidebarOpen ? 'w-64 border-r' : 'w-0 border-r-0 overflow-hidden opacity-0'"
      >
        <div class="w-64 shrink-0 flex flex-col h-full">
          <div class="p-4 border-b border-neutral-100">
            <Button 
              @click="handleCreateNote"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm"
            >
              <FileText class="w-4 h-4 mr-2" />
              Nouvelle note
            </Button>
          </div>
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Dossiers</p>
            <div class="flex-1 overflow-hidden pr-2">
              <FolderTree />
            </div>

            <!-- Lien Corbeille -->
            <div class="border-t border-neutral-100 pt-3 mt-2 shrink-0">
              <button
                @click="router.push('/brain/trash')"
                :class="[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                  route.path === '/brain/trash'
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-500 hover:text-red-600 hover:bg-red-50/60'
                ]"
              >
                <Trash2 class="w-4 h-4 shrink-0" />
                Corbeille
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Colonne 2: Contenu principal -->
      <main class="flex-1 overflow-y-auto bg-neutral-50 relative">
        <!-- Toggle sidebar gauche (Desktop) -->
        <button 
          @click="isLeftSidebarOpen = !isLeftSidebarOpen"
          class="hidden lg:flex absolute top-1/2 left-0 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 border border-red-700 border-l-0 rounded-r-lg py-3 px-0.5 shadow-md z-20 text-white transition-colors"
          title="Basculer le panneau des dossiers"
        >
          <ChevronLeft v-if="isLeftSidebarOpen" class="w-4 h-4" />
          <ChevronRight v-else class="w-4 h-4" />
        </button>

        <!-- Child View -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>

        <!-- Toggle sidebar droite (Desktop) -->
        <button 
          @click="isRightSidebarOpen = !isRightSidebarOpen"
          class="hidden lg:flex absolute top-1/2 right-0 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 border border-orange-600 border-r-0 rounded-l-lg py-3 px-0.5 shadow-md z-20 text-white transition-colors"
          title="Basculer le panneau de contexte"
        >
          <ChevronRight v-if="isRightSidebarOpen" class="w-4 h-4" />
          <ChevronLeft v-else class="w-4 h-4" />
        </button>
      </main>

      <!-- Sidebar Droite (Desktop uniquement) -->
      <aside 
        class="hidden lg:flex bg-white border-neutral-200 flex-col shrink-0 transition-all duration-300 ease-in-out"
        :class="isRightSidebarOpen ? 'w-72 border-l' : 'w-0 border-l-0 overflow-hidden opacity-0'"
      >
        <div class="h-14 border-b border-neutral-100 flex items-center px-4 w-72 shrink-0">
          <h3 class="font-bold text-neutral-900 flex items-center gap-2">
            <Share2 class="w-4 h-4 text-primary-500" />
            Contexte
          </h3>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-6 w-72 shrink-0">
          <div>
            <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Mentions (Backlinks)</p>
            <div class="text-sm text-neutral-500 p-3 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-center">
              Aucun lien entrant.
            </div>
          </div>
          
          <div>
            <p class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Lié à UrsUle</p>
            <div class="text-sm text-neutral-500 p-3 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-center">
              Cette note n'est pas liée à une tâche ou un projet.
            </div>
          </div>
        </div>
      </aside>

    </div>
    
    <!-- Modal de recherche global (Cmd+K / Ctrl+K) -->
    <SearchModal v-model="showSearchModal" />
  </div>
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
