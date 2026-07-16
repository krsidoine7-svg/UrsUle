<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { notesService } from '@/services/notes.service'
import type { Note, NoteShare, NoteComment } from '@/types/brain.types'
import NoteEditor from '@/components/brain/notes/NoteEditor.vue'
import {
  FileText, Network, GitBranch, Layers, Lock, AlertTriangle, Clock,
  Loader2, MessageSquare, Send, User, Check, Sparkles, ArrowRight
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const tokenOrSlug = ref((route.params.token || route.params.slug) as string)

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const errorCode = ref<number | null>(null)

const note = ref<Note | null>(null)
const share = ref<NoteShare | null>(null)
const ownerName = ref('Utilisateur UrsUle')

const activeView = ref<'note' | 'graph' | 'mindmap' | 'flashcards'>('note')
const isSaving = ref(false)
const saveStatus = ref('Enregistré')

// Graph & Flashcards data
const graphData = ref<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] })
const flashcards = ref<any[]>([])
const isLoadingSubView = ref(false)

// Commentaires
const comments = ref<NoteComment[]>([])
const newCommentAuthor = ref('')
const newCommentText = ref('')
const isPostingComment = ref(false)

const permission = computed(() => share.value?.permission || 'read')
const allowedViews = computed(() => share.value?.allowed_views || {
  note: true,
  graph: true,
  mindmap: true,
  flashcards: true
})
const targetBlockId = computed(() => share.value?.target_block_id || null)

onMounted(async () => {
  if (!tokenOrSlug.value) {
    errorMessage.value = 'Lien de partage invalide.'
    isLoading.value = false
    return
  }
  await loadSharedNote()
})

async function loadSharedNote() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const data = await notesService.getSharedNoteByToken(tokenOrSlug.value)
    note.value = data.note
    share.value = data.share
    ownerName.value = data.owner_name || 'Utilisateur UrsUle'
    await loadComments()
  } catch (e: any) {
    console.error('Erreur chargement note partagée:', e)
    const msg = e?.message || ''
    if (msg.includes('404')) {
      errorCode.value = 404
      errorMessage.value = 'Cette note est introuvable, a été supprimée ou le lien de partage a expiré.'
    } else if (msg.includes('403') || msg.includes('410')) {
      errorCode.value = 410
      errorMessage.value = 'Vous n’avez plus l’autorisation d’accéder à ce document ou le lien a été révoqué.'
    } else {
      errorMessage.value = 'Impossible de charger le document partagé.'
    }
  } finally {
    isLoading.value = false
  }
}

async function handleViewChange(view: 'note' | 'graph' | 'mindmap' | 'flashcards') {
  activeView.value = view
  if (!allowedViews.value[view]) return

  if (view === 'graph' && graphData.value.nodes.length === 0) {
    isLoadingSubView.value = true
    try {
      graphData.value = await notesService.getSharedNoteGraph(tokenOrSlug.value)
    } catch (e) {
      console.error('Erreur chargement graphe:', e)
    } finally {
      isLoadingSubView.value = false
    }
  } else if (view === 'flashcards' && flashcards.value.length === 0) {
    isLoadingSubView.value = true
    try {
      flashcards.value = await notesService.getSharedNoteFlashcards(tokenOrSlug.value)
    } catch (e) {
      console.error('Erreur chargement flashcards:', e)
    } finally {
      isLoadingSubView.value = false
    }
  }
}

async function handleSaveNote() {
  if (permission.value !== 'write' || !note.value) return
  isSaving.value = true
  saveStatus.value = 'Sauvegarde...'
  try {
    await notesService.updateSharedNoteByToken(
      tokenOrSlug.value,
      note.value.title,
      note.value.content || ''
    )
    saveStatus.value = 'Enregistré'
  } catch (e: any) {
    saveStatus.value = 'Erreur'
    alert(e?.message || 'Erreur lors de l’enregistrement de vos modifications.')
  } finally {
    isSaving.value = false
  }
}

async function loadComments() {
  try {
    comments.value = await notesService.getSharedNoteComments(tokenOrSlug.value)
  } catch (e) {
    console.error('Erreur chargement commentaires:', e)
  }
}

async function handlePostComment() {
  if (!newCommentText.value.trim() || isPostingComment.value) return
  isPostingComment.value = true
  try {
    const created = await notesService.createSharedNoteComment(
      tokenOrSlug.value,
      newCommentAuthor.value.trim() || 'Visiteur',
      newCommentText.value.trim()
    )
    comments.value.push(created)
    newCommentText.value = ''
  } catch (e: any) {
    alert(e?.message || 'Impossible de publier le commentaire.')
  } finally {
    isPostingComment.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col font-sans">
    
    <!-- En-tête Public Responsive -->
    <header class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-sm flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
          <FileText class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
            {{ note?.title || 'Note Partagée' }}
          </h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5">
            <span>Partagé par <strong class="text-neutral-700 dark:text-neutral-300">{{ ownerName }}</strong></span>
            <span>•</span>
            <span class="font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide text-[10px]">
              {{ permission === 'write' ? 'Écriture live' : (permission === 'comment' ? 'Commentaire' : 'Lecture seule') }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <span v-if="permission === 'write'" class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {{ saveStatus }}
        </span>

        <button
          @click="router.push('/login')"
          class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm hover:opacity-90 transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Sparkles class="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
          <span class="hidden sm:inline">Créer mon compte UrsUle</span>
          <span class="sm:hidden">UrsUle</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    <!-- Zone de Chargement -->
    <main v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-8 text-neutral-500 gap-3">
      <Loader2 class="w-10 h-10 animate-spin text-blue-600" />
      <span class="text-sm font-medium">Chargement du document sécurisé...</span>
    </main>

    <!-- Zone d'Erreur (404 / 410 / Lien Expiré) -->
    <main v-else-if="errorMessage" class="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div class="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800/60">
          <Clock v-if="errorCode === 410" class="w-7 h-7" />
          <AlertTriangle v-else class="w-7 h-7" />
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
            {{ errorCode === 410 ? 'Lien expiré ou révoqué' : 'Document non disponible' }}
          </h2>
          <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {{ errorMessage }}
          </p>
        </div>
        <div class="pt-2">
          <button
            @click="router.push('/')"
            class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all"
          >
            Retour au Second Cerveau
          </button>
        </div>
      </div>
    </main>

    <!-- Document partagé en succès -->
    <main v-else-if="note" class="flex-1 flex flex-col max-w-5xl w-full mx-auto px-2 sm:px-6 py-4 sm:py-6 gap-6">
      
      <!-- Bannière Mode Focus (Si target_block_id) -->
      <div v-if="targetBlockId" class="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center gap-3 text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-200">
        <Lock class="w-4 h-4 text-blue-600 shrink-0" />
        <div>
          <span><strong>Mode Focus :</strong> Le propriétaire a partagé ce paragraphe/bloc spécifique en isolation. Le reste de la note n’est pas visible.</span>
        </div>
      </div>

      <!-- Barre d'Onglets des Vues (Responsive horizontal scroll) -->
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto shadow-sm shrink-0">
        <button
          type="button"
          @click="handleViewChange('note')"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all"
          :class="activeView === 'note' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          <FileText class="w-4 h-4" />
          <span>Note</span>
        </button>

        <button
          type="button"
          @click="handleViewChange('graph')"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all"
          :class="activeView === 'graph' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          <Network class="w-4 h-4" />
          <span>Graphe</span>
        </button>

        <button
          type="button"
          @click="handleViewChange('mindmap')"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all"
          :class="activeView === 'mindmap' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          <GitBranch class="w-4 h-4" />
          <span>Mind Map</span>
        </button>

        <button
          type="button"
          @click="handleViewChange('flashcards')"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all"
          :class="activeView === 'flashcards' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'"
        >
          <Layers class="w-4 h-4" />
          <span>Flashcards</span>
        </button>
      </div>

      <!-- Contenu de la Vue active -->
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-8 shadow-sm min-h-[480px] flex flex-col">
        
        <!-- Cas 1 : VUE RESTREINTE / CADENAS -->
        <div v-if="!allowedViews[activeView]" class="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
            <Lock class="w-7 h-7" />
          </div>
          <div>
            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
              Vue restreinte par le propriétaire
            </h3>
            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Vous n'avez pas l'autorisation d'accéder à la vue <strong>{{ activeView }}</strong> pour ce document partagé.
            </p>
          </div>
        </div>

        <!-- Cas 2 : VUE NOTE (Document) -->
        <div v-else-if="activeView === 'note'" class="flex-1 flex flex-col">
          <input
            v-if="permission === 'write'"
            v-model="note.title"
            class="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white bg-transparent border-none outline-none mb-4 w-full placeholder:text-neutral-300"
            placeholder="Titre de la note..."
            @blur="handleSaveNote"
          />
          <h2 v-else class="text-xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-6">
            {{ note.title }}
          </h2>

          <div class="flex-1">
            <NoteEditor
              v-model="note.content"
              :read-only="permission !== 'write'"
              @save="handleSaveNote"
            />
          </div>
        </div>

        <!-- Cas 3 : VUE GRAPHE -->
        <div v-else-if="activeView === 'graph'" class="flex-1 flex flex-col items-center justify-center p-8">
          <div v-if="isLoadingSubView" class="flex items-center gap-2 text-neutral-400">
            <Loader2 class="w-6 h-6 animate-spin text-blue-500" />
            <span class="text-sm">Chargement du graphe...</span>
          </div>
          <div v-else class="text-center space-y-3">
            <div class="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
              <Network class="w-8 h-8" />
            </div>
            <h3 class="font-bold text-neutral-900 dark:text-white">Graphe des connexions</h3>
            <p class="text-xs text-neutral-500 max-w-sm mx-auto">
              Ce document est au centre de son sous-réseau. {{ graphData.nodes.length }} nœuds interconnectés.
            </p>
            <div class="pt-4 flex justify-center gap-2 flex-wrap">
              <span v-for="n in graphData.nodes" :key="n.id" class="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                {{ n.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cas 4 : VUE MIND MAP -->
        <div v-else-if="activeView === 'mindmap'" class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div class="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
            <GitBranch class="w-8 h-8" />
          </div>
          <h3 class="font-bold text-neutral-900 dark:text-white">Arborescence Mind Map</h3>
          <p class="text-xs text-neutral-500 max-w-sm">
            Structure hiérarchique des idées et des sous-parties de la note partagée.
          </p>
        </div>

        <!-- Cas 5 : VUE FLASHCARDS -->
        <div v-else-if="activeView === 'flashcards'" class="flex-1 flex flex-col p-4">
          <div v-if="isLoadingSubView" class="py-12 flex items-center justify-center gap-2 text-neutral-400">
            <Loader2 class="w-6 h-6 animate-spin text-amber-500" />
            <span class="text-sm">Chargement des cartes de révision...</span>
          </div>
          <div v-else-if="flashcards.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
            <Layers class="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
            <h4 class="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Aucune flashcard associée</h4>
            <p class="text-xs text-neutral-500 max-w-sm">
              L'auteur n'a pas encore créé de cartes de mémorisation pour cette note.
            </p>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="c in flashcards" :key="c.id" class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
              <div class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Question</div>
              <div class="text-sm font-bold text-neutral-900 dark:text-white">{{ c.question }}</div>
              <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <div class="text-[10px] font-semibold text-neutral-400 uppercase">Réponse</div>
                <div class="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">{{ c.answer }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Section Commentaires (Si permission == 'comment' ou 'write' ou 'read') -->
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <h3 class="font-bold text-neutral-900 dark:text-white text-base flex items-center gap-2">
            <MessageSquare class="w-5 h-5 text-blue-600" />
            Commentaires & Discussions
            <span class="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {{ comments.length }}
            </span>
          </h3>
        </div>

        <!-- Formulaire d'ajout (uniquement si 'comment' ou 'write') -->
        <div v-if="permission === 'comment' || permission === 'write'" class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div class="flex items-center gap-2">
            <User class="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              v-model="newCommentAuthor"
              type="text"
              placeholder="Votre nom ou pseudo (optionnel)"
              class="h-9 px-3 text-xs rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
          <div class="flex gap-2">
            <textarea
              v-model="newCommentText"
              rows="2"
              placeholder="Écrivez un commentaire, une remarque ou une suggestion..."
              class="flex-1 p-3 text-sm rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>
            <button
              type="button"
              disabled
              v-if="isPostingComment || !newCommentText.trim()"
              class="px-4 bg-blue-600/50 text-white rounded-xl text-xs font-semibold flex items-center justify-center shrink-0 cursor-not-allowed"
            >
              <Send class="w-4 h-4" />
            </button>
            <button
              v-else
              type="button"
              class="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center shrink-0 shadow-md transition-all"
              @click="handlePostComment"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-else class="text-xs text-neutral-400 italic">
          Cette note est en lecture seule sans autorisation de commenter.
        </div>

        <!-- Liste des commentaires -->
        <div class="space-y-3 pt-2">
          <div v-if="comments.length === 0" class="py-6 text-center text-xs text-neutral-400">
            Aucun commentaire pour le moment. Soyez le premier à réagir !
          </div>
          <div
            v-else
            v-for="c in comments"
            :key="c.id"
            class="p-4 rounded-xl border transition-all flex gap-3.5"
            :class="c.is_owner 
              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60' 
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              :class="c.is_owner ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'"
            >
              {{ (c.author_name || '?')[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                  {{ c.author_name }}
                  <span v-if="c.is_owner" class="px-1.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-blue-600 text-white">
                    Auteur
                  </span>
                </span>
                <span class="text-[10px] text-neutral-400">
                  {{ new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <p class="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {{ c.content }}
              </p>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>
