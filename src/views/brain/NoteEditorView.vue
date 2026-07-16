<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useProjectsStore } from '@/stores/projects.store'
import { useNoteLinks } from '@/composables/useNoteLinks'
import NoteEditor from '@/components/brain/notes/NoteEditor.vue'
import NoteDeleteDialog from '@/components/brain/notes/NoteDeleteDialog.vue'
import ShareNoteDialog from '@/components/brain/notes/ShareNoteDialog.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ArrowLeft, Clock, Tags, Folder, Download, Sparkles, Trash2, MoreHorizontal, X, Share2, Link2, ExternalLink } from 'lucide-vue-next'
import FlashcardCreate from '@/components/brain/flashcards/FlashcardCreate.vue'
import { useToast } from '@/components/ui/toast/use-toast'

const route = useRoute()
const showCreateFlashcard = ref(false)
const showDeleteDialog = ref(false)
const showShareDialog = ref(false)
const targetShareBlockId = ref<string | null>(null)
const showMobileMenu = ref(false)
const router = useRouter()
const notesStore = useNotesStore()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
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

function openShareDialog(blockId: string | null = null) {
  targetShareBlockId.value = blockId || null
  showShareDialog.value = true
}

async function loadActiveNote(id: string) {
  noteId.value = id
  if (!id) return
  notesStore.setActiveNote(id)
  let note = notesStore.activeNote
  if (!note) {
    note = await notesStore.fetchNoteById(id)
  }
  if (note) {
    title.value = note.title
    contentHtml.value = note.content || ''
    
    let parsedJson = null
    if (typeof note.content_json === 'string') {
      try {
        parsedJson = JSON.parse(note.content_json)
      } catch (e) {
        parsedJson = null
      }
    } else if (note.content_json && typeof note.content_json === 'object') {
      parsedJson = note.content_json
    }

    if (parsedJson && typeof parsedJson === 'object' && parsedJson.type === 'doc') {
      contentJson.value = parsedJson
    } else {
      contentJson.value = null
    }

    wordCount.value = note.word_count || 0
    readTime.value = note.read_time_minutes || 0
    currentTags.value = note.tags || []
  }
}

onMounted(async () => {
  notesStore.fetchFolders().catch(() => {})
  tasksStore.fetchTasks()
  projectsStore.fetchProjects()
  if (noteId.value) {
    await loadActiveNote(noteId.value)
  }
})

watch(() => route.params.id, async (newId) => {
  if (newId && typeof newId === 'string' && newId !== noteId.value) {
    await loadActiveNote(newId)
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

// ─── Panneau Lié à (Tâche / Projet) ──────────────────────────
const showLinkedPanel = ref(false)
const taskSearchQuery = ref('')
const projectSearchQuery = ref('')

const linkedTask = computed(() => {
  const taskId = notesStore.activeNote?.linked_task_id
  if (!taskId) return null
  return tasksStore.tasks.find(t => t.id === taskId)
})

const linkedProject = computed(() => {
  const projectId = notesStore.activeNote?.linked_project_id
  if (!projectId) return null
  return projectsStore.projects.find(p => p.id === projectId)
})

const filteredTasks = computed(() => {
  const q = taskSearchQuery.value.toLowerCase().trim()
  return tasksStore.tasks.filter(t => !t.deleted_at && (!q || t.title.toLowerCase().includes(q))).slice(0, 15)
})

const filteredProjects = computed(() => {
  const q = projectSearchQuery.value.toLowerCase().trim()
  return projectsStore.projects.filter(p => !p.deleted_at && (!q || p.name.toLowerCase().includes(q))).slice(0, 15)
})

async function handleLinkTask(taskId: string) {
  if (!noteId.value) return
  try {
    await notesStore.linkNoteToTask(noteId.value, taskId)
    toast({ title: 'Note liée à la tâche ! 🔗' })
    showLinkedPanel.value = false
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleUnlinkTask() {
  if (!noteId.value) return
  try {
    await notesStore.linkNoteToTask(noteId.value, null)
    toast({ title: 'Lien avec la tâche supprimé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleLinkProject(projectId: string) {
  if (!noteId.value) return
  try {
    await notesStore.linkNoteToProject(noteId.value, projectId)
    toast({ title: 'Note liée au projet ! 🔗' })
    showLinkedPanel.value = false
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
  }
}

async function handleUnlinkProject() {
  if (!noteId.value) return
  try {
    await notesStore.linkNoteToProject(noteId.value, null)
    toast({ title: 'Lien avec le projet supprimé' })
  } catch (e: any) {
    toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
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
            class="gap-1.5 border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-50 text-xs font-semibold shadow-sm" 
            @click="openShareDialog()"
          >
            <Share2 class="w-3.5 h-3.5 text-blue-600" />
            Partager
          </Button>
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

        <!-- Badge Lié à (Tâche / Projet) -->
        <div 
          class="flex items-center gap-1.5 bg-neutral-50 hover:bg-neutral-100/85 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl transition-all cursor-pointer font-semibold text-neutral-600 border border-neutral-200/50 shadow-sm shrink-0"
          @click="showLinkedPanel = true"
        >
          <Link2 class="w-3.5 h-3.5 text-primary-600 shrink-0" />
          <span v-if="linkedTask" class="text-[10px] sm:text-[11px] font-bold text-primary-700 truncate max-w-[120px]" title="Tâche liée">
            ✓ {{ linkedTask.title }}
          </span>
          <span v-else-if="linkedProject" class="text-[10px] sm:text-[11px] font-bold text-primary-700 truncate max-w-[120px]" title="Projet lié">
            📁 {{ linkedProject.name }}
          </span>
          <span v-else class="text-[10px] sm:text-[11px] font-bold text-neutral-500">
            Lié à : Aucun
          </span>
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
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50/70 hover:bg-blue-50 transition-colors"
        @click="openShareDialog(); showMobileMenu = false"
      >
        <Share2 class="w-4 h-4 text-blue-600" />
        Partager la note
      </button>
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
          @share-block="openShareDialog"
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

    <!-- Modal Partage Note (BRAIN-F10) -->
    <ShareNoteDialog
      :is-open="showShareDialog"
      :note="notesStore.activeNote || null"
      :target-block-id="targetShareBlockId"
      @close="showShareDialog = false; targetShareBlockId = null"
    />

    <!-- Panneau latéral : Lié à (Tâche / Projet) -->
    <Sheet :open="showLinkedPanel" @update:open="showLinkedPanel = $event">
      <SheetContent side="right" class="w-full sm:max-w-md overflow-y-auto p-6 space-y-6 bg-white shadow-2xl z-50">
        <div class="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="p-2.5 bg-primary-50 rounded-2xl text-primary-600">
              <Link2 class="h-5 w-5" />
            </div>
            <div>
              <h3 class="font-display font-bold text-lg text-neutral-900">🔗 Intégration Liée</h3>
              <p class="text-xs text-neutral-400">Rattachez cette note à vos flux de travail</p>
            </div>
          </div>
        </div>

        <!-- Section 1 : Carte Tâche / Projet actuellement lié(e) -->
        <div v-if="linkedTask" class="p-5 rounded-3xl bg-gradient-to-br from-primary-50/70 to-blue-50/40 border border-primary-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <Badge class="bg-primary-600 text-white font-bold text-[10px]">Tâche reliée</Badge>
            <button @click="handleUnlinkTask" class="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Détacher">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div>
            <h4 class="font-bold text-neutral-900 text-base leading-snug">{{ linkedTask.title }}</h4>
            <p v-if="linkedTask.description" class="text-xs text-neutral-500 line-clamp-2 mt-1">
              {{ linkedTask.description.replace(/<[^>]*>?/gm, '') }}
            </p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-primary-100/60 text-xs">
            <span class="font-semibold text-neutral-600">Statut : {{ linkedTask.status }}</span>
            <Button size="sm" class="bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-xl h-8 px-3" @click="router.push('/'); showLinkedPanel = false">
              <ExternalLink class="h-3.5 w-3.5 mr-1.5" /> Voir les tâches
            </Button>
          </div>
        </div>

        <div v-else-if="linkedProject" class="p-5 rounded-3xl bg-gradient-to-br from-forest-50/70 to-emerald-50/40 border border-forest-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <Badge class="bg-forest-600 text-white font-bold text-[10px]">Projet relié</Badge>
            <button @click="handleUnlinkProject" class="text-neutral-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Détacher">
              <X class="h-4 w-4" />
            </button>
          </div>
          <div>
            <h4 class="font-bold text-neutral-900 text-base leading-snug">{{ linkedProject.name }}</h4>
            <p v-if="linkedProject.description" class="text-xs text-neutral-500 line-clamp-2 mt-1">
              {{ linkedProject.description }}
            </p>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-forest-100/60 text-xs">
            <span class="font-semibold text-neutral-600">Progression : {{ (linkedProject as any).progress || 0 }}%</span>
            <Button size="sm" class="bg-forest-600 hover:bg-forest-700 text-white text-xs rounded-xl h-8 px-3" @click="router.push(`/projects/${linkedProject.id}`); showLinkedPanel = false">
              <ExternalLink class="h-3.5 w-3.5 mr-1.5" /> Voir le projet
            </Button>
          </div>
        </div>

        <div v-else class="p-6 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/60 text-center space-y-2">
          <Link2 class="h-8 w-8 text-neutral-300 mx-auto" />
          <p class="text-xs font-bold text-neutral-700">Cette note n'est rattachée à aucun élément</p>
          <p class="text-[11px] text-neutral-400">Choisissez une tâche ou un projet ci-dessous pour créer un lien bidirectionnel dans votre Second Cerveau.</p>
        </div>

        <!-- Section 2 : Modifier / Lier à une Tâche -->
        <div class="space-y-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
            Lier à une Tâche
          </span>
          <Input 
            v-model="taskSearchQuery" 
            placeholder="Rechercher une tâche..." 
            class="h-9 text-xs bg-neutral-50 rounded-xl"
          />
          <div class="max-h-40 overflow-y-auto space-y-1.5 border border-neutral-100 rounded-2xl p-2 bg-white">
            <div 
              v-for="t in filteredTasks" 
              :key="t.id"
              class="p-2.5 rounded-xl hover:bg-primary-50 cursor-pointer flex items-center justify-between text-xs transition-colors border border-transparent hover:border-primary-100"
              @click="handleLinkTask(t.id)"
            >
              <span class="font-medium text-neutral-800 truncate pr-2">{{ t.title }}</span>
              <Badge variant="outline" class="text-[9px] shrink-0 bg-white">Lier</Badge>
            </div>
            <div v-if="filteredTasks.length === 0" class="text-center py-4 text-xs text-neutral-400 italic">
              Aucune tâche correspondante.
            </div>
          </div>
        </div>

        <!-- Section 3 : Modifier / Lier à un Projet -->
        <div class="space-y-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest block">
            Lier à un Projet
          </span>
          <Input 
            v-model="projectSearchQuery" 
            placeholder="Rechercher un projet..." 
            class="h-9 text-xs bg-neutral-50 rounded-xl"
          />
          <div class="max-h-40 overflow-y-auto space-y-1.5 border border-neutral-100 rounded-2xl p-2 bg-white">
            <div 
              v-for="p in filteredProjects" 
              :key="p.id"
              class="p-2.5 rounded-xl hover:bg-forest-50 cursor-pointer flex items-center justify-between text-xs transition-colors border border-transparent hover:border-forest-100"
              @click="handleLinkProject(p.id)"
            >
              <span class="font-medium text-neutral-800 truncate pr-2">{{ p.name }}</span>
              <Badge variant="outline" class="text-[9px] shrink-0 border-forest-200 text-forest-700 bg-white">Lier</Badge>
            </div>
            <div v-if="filteredProjects.length === 0" class="text-center py-4 text-xs text-neutral-400 italic">
              Aucun projet correspondant.
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
