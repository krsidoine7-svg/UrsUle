<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { notesService } from '@/services/notes.service'
import type { Note, NoteShare } from '@/types/brain.types'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Share2, Copy, Check, Eye, MessageSquare, Edit3, Lock, X,
  FileText, Network, GitBranch, Layers, Mail, Trash2, UserPlus,
  Calendar, Link, Globe, Loader2, Shield
} from 'lucide-vue-next'

const { toast } = useToast()

const props = defineProps<{
  isOpen: boolean
  note: Note | null
  targetBlockId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update'): void
}>()

const activeTab = ref<'link' | 'email'>('link')
const isLoading = ref(false)
const isSaving = ref(false)
const shares = ref<NoteShare[]>([])
const isCopied = ref(false)
const copyTimer = ref<any>(null)

// Formulaire Partage par Lien / Slug
const linkPermission = ref<'read' | 'comment' | 'write'>('read')
const linkExpiresInDays = ref<number | null>(null)
const linkCustomSlug = ref('')
const linkAllowedViews = ref({
  note: true,
  graph: true,
  mindmap: true,
  flashcards: true
})

// Formulaire Partage nominatif par E-mail
const inviteEmail = ref('')
const invitePermission = ref<'read' | 'comment' | 'write'>('read')
const inviteAllowedViews = ref({
  note: true,
  graph: true,
  mindmap: true,
  flashcards: true
})

const activeLinkShare = computed(() => {
  if (!shares.value) return null
  return shares.value.find(s => !s.email && (props.targetBlockId ? s.target_block_id === props.targetBlockId : !s.target_block_id)) || null
})

const emailShares = computed(() => {
  if (!shares.value) return []
  return shares.value.filter(s => !!s.email && (props.targetBlockId ? s.target_block_id === props.targetBlockId : !s.target_block_id))
})

const shareUrl = computed(() => {
  if (!activeLinkShare.value) return ''
  const tokenOrSlug = activeLinkShare.value.custom_slug || activeLinkShare.value.share_token
  if (!tokenOrSlug) return ''
  return `${window.location.origin}/share/${tokenOrSlug}`
})

watch(() => props.isOpen, async (open) => {
  if (open && props.note) {
    await loadShares()
  } else {
    isCopied.value = false
  }
})

async function loadShares() {
  if (!props.note) return
  isLoading.value = true
  try {
    const data = await notesService.getSharesByNote(props.note.id)
    shares.value = data
    if (activeLinkShare.value) {
      linkPermission.value = activeLinkShare.value.permission as any
      linkCustomSlug.value = activeLinkShare.value.custom_slug || ''
      if (activeLinkShare.value.allowed_views) {
        linkAllowedViews.value = { ...activeLinkShare.value.allowed_views }
      }
    } else {
      linkPermission.value = 'read'
      linkCustomSlug.value = props.note.slug ? `${props.note.slug}-${Math.random().toString(36).substring(2, 6)}` : ''
      linkAllowedViews.value = { note: true, graph: true, mindmap: true, flashcards: true }
    }
  } catch (e) {
    console.error('Erreur lors du chargement des partages :', e)
  } finally {
    isLoading.value = false
  }
}

async function handleCreateOrUpdateLinkShare() {
  if (!props.note) return
  isSaving.value = true
  try {
    if (activeLinkShare.value) {
      const updated = await notesService.updateShare(activeLinkShare.value.id, {
        permission: linkPermission.value,
        custom_slug: linkCustomSlug.value.trim() || null,
        allowed_views: linkAllowedViews.value
      })
      const idx = shares.value.findIndex(s => s.id === updated.id)
      if (idx !== -1) shares.value[idx] = updated
    } else {
      const created = await notesService.createShareLink(props.note.id, {
        permission: linkPermission.value,
        allowed_views: linkAllowedViews.value,
        expires_in_days: linkExpiresInDays.value,
        custom_slug: linkCustomSlug.value.trim() || null,
        target_block_id: props.targetBlockId || null
      })
      shares.value.unshift(created)
    }
    emit('update')
    toast({ title: 'Paramètres de partage mis à jour ! 🌐' })
  } catch (e: any) {
    toast({
      title: 'Erreur de partage',
      description: e?.message || 'Erreur lors de la mise à jour du lien de partage.',
      variant: 'destructive'
    })
  } finally {
    isSaving.value = false
  }
}

async function handleInviteEmail() {
  if (!props.note || !inviteEmail.value.trim()) return
  isSaving.value = true
  try {
    const created = await notesService.inviteCollaborator(
      props.note.id,
      inviteEmail.value.trim(),
      invitePermission.value,
      inviteAllowedViews.value
    )
    shares.value.unshift(created)
    inviteEmail.value = ''
    emit('update')
    toast({ title: 'Collaborateur invité avec succès ! ✉️' })
  } catch (e: any) {
    toast({
      title: 'Erreur d’invitation',
      description: e?.message || 'Erreur lors de l’invitation du collaborateur.',
      variant: 'destructive'
    })
  } finally {
    isSaving.value = false
  }
}

async function handleRevokeShare(shareId: string) {
  if (!confirm('Voulez-vous vraiment révoquer cet accès ?')) return
  try {
    await notesService.deleteShare(shareId)
    shares.value = shares.value.filter(s => s.id !== shareId)
    emit('update')
  } catch (e) {
    console.error('Erreur lors de la suppression :', e)
  }
}

function copyToClipboard() {
  if (!shareUrl.value) return
  navigator.clipboard.writeText(shareUrl.value)
  isCopied.value = true
  toast({ title: 'Lien copié dans le presse-papiers ! 📋' })
  if (copyTimer.value) clearTimeout(copyTimer.value)
  copyTimer.value = setTimeout(() => {
    isCopied.value = false
  }, 2500)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && note"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Share2 class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-white text-base leading-tight">
                {{ targetBlockId ? 'Partager ce bloc' : 'Partager le document' }}
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[240px] sm:max-w-[360px]">
                {{ note.title || 'Note sans titre' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg transition-colors"
            @click="emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Onglets -->
        <div class="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-5 gap-6">
          <button
            type="button"
            class="py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2"
            :class="activeTab === 'link' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold' 
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'"
            @click="activeTab = 'link'"
          >
            <Globe class="w-4 h-4" />
            Partage public par lien
          </button>
          <button
            type="button"
            class="py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2"
            :class="activeTab === 'email' 
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold' 
              : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'"
            @click="activeTab = 'email'"
          >
            <Mail class="w-4 h-4" />
            Collaborateurs invités
            <span v-if="emailShares.length > 0" class="ml-1 px-1.5 py-0.5 text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full font-bold">
              {{ emailShares.length }}
            </span>
          </button>
        </div>

        <!-- Corps du modal -->
        <div class="p-5 overflow-y-auto flex-1 space-y-6">
          <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 class="w-8 h-8 animate-spin text-blue-500" />
            <span class="text-sm">Chargement des paramètres de partage...</span>
          </div>

          <!-- TAB 1 : PARTAGE PAR LIEN -->
          <div v-else-if="activeTab === 'link'" class="space-y-6">
            <div class="space-y-4">
              <!-- Sélecteur de droit principal -->
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                  Droit d'accès principal
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    class="p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left"
                    :class="linkPermission === 'read' 
                      ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'"
                    @click="linkPermission = 'read'"
                  >
                    <div class="flex items-center gap-2 font-medium text-sm">
                      <Eye class="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      Lecture seule
                    </div>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">Consultation du document</span>
                  </button>

                  <button
                    type="button"
                    class="p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left"
                    :class="linkPermission === 'comment' 
                      ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'"
                    @click="linkPermission = 'comment'"
                  >
                    <div class="flex items-center gap-2 font-medium text-sm">
                      <MessageSquare class="w-4 h-4 text-blue-500" />
                      Commentaires
                    </div>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">Lecture & ajout d'avis</span>
                  </button>

                  <button
                    type="button"
                    class="p-3 rounded-xl border flex flex-col items-start gap-1 transition-all text-left"
                    :class="linkPermission === 'write' 
                      ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'"
                    @click="linkPermission = 'write'"
                  >
                    <div class="flex items-center gap-2 font-medium text-sm">
                      <Edit3 class="w-4 h-4 text-emerald-500" />
                      Écriture live
                    </div>
                    <span class="text-xs text-neutral-500 dark:text-neutral-400">Modification en temps réel</span>
                  </button>
                </div>
              </div>

              <!-- Options : Expiration et Slug -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar class="w-3.5 h-3.5" />
                    Expiration du lien
                  </label>
                  <select
                    v-model="linkExpiresInDays"
                    class="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option :value="null">Sans expiration (jamais)</option>
                    <option :value="1">Expirez dans 24 heures</option>
                    <option :value="7">Expirez dans 7 jours</option>
                    <option :value="30">Expirez dans 30 jours</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5 flex items-center gap-1.5">
                    <Link class="w-3.5 h-3.5" />
                    Slug personnalisé (optionnel)
                  </label>
                  <input
                    v-model="linkCustomSlug"
                    type="text"
                    placeholder="ex: ma-note-pro-2026"
                    class="w-full h-10 px-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <!-- Restrictions par Vue -->
              <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Shield class="w-3.5 h-3.5 text-blue-500" />
                  Vues accessibles sur la page partagée
                </label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200 select-none">
                    <input v-model="linkAllowedViews.note" type="checkbox" class="rounded text-blue-600 focus:ring-blue-500" />
                    <FileText class="w-4 h-4 text-neutral-500" />
                    Vue Note
                  </label>
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200 select-none">
                    <input v-model="linkAllowedViews.graph" type="checkbox" class="rounded text-blue-600 focus:ring-blue-500" />
                    <Network class="w-4 h-4 text-blue-500" />
                    Graphe
                  </label>
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200 select-none">
                    <input v-model="linkAllowedViews.mindmap" type="checkbox" class="rounded text-blue-600 focus:ring-blue-500" />
                    <GitBranch class="w-4 h-4 text-purple-500" />
                    Mind Map
                  </label>
                  <label class="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50 cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200 select-none">
                    <input v-model="linkAllowedViews.flashcards" type="checkbox" class="rounded text-blue-600 focus:ring-blue-500" />
                    <Layers class="w-4 h-4 text-amber-500" />
                    Flashcards
                  </label>
                </div>
              </div>

              <!-- Zone d'action Lien de partage -->
              <div class="pt-3">
                <div v-if="activeLinkShare" class="space-y-3">
                  <div class="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                    <input
                      type="text"
                      readonly
                      :value="shareUrl"
                      class="flex-1 bg-transparent border-0 text-xs font-mono text-neutral-800 dark:text-neutral-200 px-2 focus:outline-none truncate"
                    />
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      :class="isCopied 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'"
                      @click="copyToClipboard"
                    >
                      <Check v-if="isCopied" class="w-3.5 h-3.5" />
                      <Copy v-else class="w-3.5 h-3.5" />
                      {{ isCopied ? 'Copié !' : 'Copier' }}
                    </button>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      class="px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors flex items-center gap-1.5"
                      @click="handleRevokeShare(activeLinkShare.id)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      Désactiver ce lien public
                    </button>
                    <button
                      type="button"
                      disabled
                      v-if="isSaving"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-2 opacity-80"
                    >
                      <Loader2 class="w-3.5 h-3.5 animate-spin" />
                      Enregistrement...
                    </button>
                    <button
                      v-else
                      type="button"
                      class="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                      @click="handleCreateOrUpdateLinkShare"
                    >
                      Mettre à jour les paramètres
                    </button>
                  </div>
                </div>

                <div v-else class="flex justify-end">
                  <button
                    type="button"
                    disabled
                    v-if="isSaving"
                    class="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Loader2 class="w-4 h-4 animate-spin" />
                    Création en cours...
                  </button>
                  <button
                    v-else
                    type="button"
                    class="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    @click="handleCreateOrUpdateLinkShare"
                  >
                    <Globe class="w-4 h-4" />
                    Créer et activer le lien public
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2 : PARTAGE NOMINATIF PAR E-MAIL -->
          <div v-else-if="activeTab === 'email'" class="space-y-6">
            <!-- Formulaire d'invitation -->
            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Inviter un collaborateur spécifique
              </label>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="inviteEmail"
                  type="email"
                  placeholder="adresse@exemple.com"
                  class="flex-1 h-10 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  v-model="invitePermission"
                  class="h-10 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="read">Lecture seule</option>
                  <option value="comment">Commentaire</option>
                  <option value="write">Écriture live</option>
                </select>
                <button
                  type="button"
                  disabled
                  v-if="isSaving"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 opacity-80"
                >
                  <Loader2 class="w-4 h-4 animate-spin" />
                </button>
                <button
                  v-else
                  type="button"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  @click="handleInviteEmail"
                >
                  <UserPlus class="w-4 h-4" />
                  Inviter
                </button>
              </div>

              <!-- Choix des vues pour le collaborateur -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <label class="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 select-none">
                  <input v-model="inviteAllowedViews.note" type="checkbox" class="rounded text-blue-600" />
                  Note
                </label>
                <label class="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 select-none">
                  <input v-model="inviteAllowedViews.graph" type="checkbox" class="rounded text-blue-600" />
                  Graphe
                </label>
                <label class="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 select-none">
                  <input v-model="inviteAllowedViews.mindmap" type="checkbox" class="rounded text-blue-600" />
                  Mind Map
                </label>
                <label class="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 select-none">
                  <input v-model="inviteAllowedViews.flashcards" type="checkbox" class="rounded text-blue-600" />
                  Flashcards
                </label>
              </div>
            </div>

            <!-- Liste des collaborateurs invités -->
            <div class="space-y-2">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Personnes ayant accès ({{ emailShares.length }})
              </h4>
              <div v-if="emailShares.length === 0" class="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                Aucun collaborateur invité par e-mail pour cette note.
              </div>
              <div
                v-else
                v-for="s in emailShares"
                :key="s.id"
                class="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-600 dark:text-neutral-300">
                    {{ (s.email || '?')[0].toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-medium text-sm text-neutral-900 dark:text-white">
                      {{ s.email }}
                    </div>
                    <div class="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                      <span v-if="s.permission === 'read'" class="flex items-center gap-1">
                        <Eye class="w-3 h-3 text-neutral-500" /> Lecture seule
                      </span>
                      <span v-else-if="s.permission === 'comment'" class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MessageSquare class="w-3 h-3" /> Commentaires
                      </span>
                      <span v-else-if="s.permission === 'write'" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Edit3 class="w-3 h-3" /> Écriture live
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                  title="Révoquer l'accès"
                  @click="handleRevokeShare(s.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Pied du modal -->
        <div class="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-end">
          <button
            type="button"
            class="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-medium transition-colors"
            @click="emit('close')"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
