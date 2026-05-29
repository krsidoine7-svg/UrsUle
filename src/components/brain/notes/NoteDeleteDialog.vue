<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, Trash2, X, Link2, BookOpen, ArrowRight, RotateCcw, Loader2
} from 'lucide-vue-next'
import { useNotesStore } from '@/stores/notes.store'

const props = defineProps<{
  noteId: string
  noteTitle: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const notesStore = useNotesStore()

const isLoading = ref(true)
const isSubmitting = ref(false)
const impact = ref<{
  backlinks: { id: string; title: string }[]
  flashcardsCount: number
  outboundLinksCount: number
} | null>(null)

onMounted(async () => {
  try {
    impact.value = await notesStore.getNoteImpact(props.noteId)
  } catch {
    impact.value = { backlinks: [], flashcardsCount: 0, outboundLinksCount: 0 }
  } finally {
    isLoading.value = false
  }
})

const hasImpact = computed(() =>
  impact.value &&
  (impact.value.backlinks.length > 0 ||
   impact.value.flashcardsCount > 0 ||
   impact.value.outboundLinksCount > 0)
)

async function handleConfirm() {
  isSubmitting.value = true
  emit('confirm')
}
</script>

<template>
  <div class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
    <div 
      class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-neutral-100 overflow-hidden transform transition-all flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
            <Trash2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-base font-bold text-neutral-900">Mettre à la corbeille ?</h3>
            <p class="text-xs text-neutral-500 font-medium truncate max-w-xs">{{ noteTitle }}</p>
          </div>
        </div>
        <button 
          @click="emit('close')" 
          class="p-1.5 hover:bg-red-100/60 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-6">
          <Loader2 class="w-6 h-6 text-primary-500 animate-spin" />
          <span class="ml-2 text-sm text-neutral-500">Analyse de l'impact...</span>
        </div>

        <template v-else>
          <!-- Texte principal -->
          <p class="text-sm text-neutral-600 leading-relaxed">
            La note <strong class="text-neutral-900">"{{ noteTitle }}"</strong> sera déplacée dans la 
            <strong class="text-neutral-900">Corbeille</strong>. Vous pourrez la restaurer à tout moment.
          </p>

          <!-- Cartographie d'Impact si des éléments sont liés -->
          <div v-if="hasImpact" class="space-y-3">
            <div class="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <span class="text-xs font-black text-neutral-400 uppercase tracking-widest">📊 Cartographie d'impact</span>
            </div>

            <!-- Backlinks -->
            <div v-if="impact!.backlinks.length > 0" class="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Link2 class="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span class="text-xs font-bold text-amber-800">
                  {{ impact!.backlinks.length }} note{{ impact!.backlinks.length > 1 ? 's' : '' }} pointe{{ impact!.backlinks.length > 1 ? 'nt' : '' }} vers cette note
                </span>
              </div>
              <p class="text-xs text-amber-700 font-medium">
                Ces liens deviendront <span class="font-bold">cassés</span> après la suppression :
              </p>
              <ul class="max-h-24 overflow-y-auto space-y-1 pl-1">
                <li v-for="link in impact!.backlinks" :key="link.id" class="flex items-center gap-1.5 text-xs text-amber-700">
                  <ArrowRight class="w-3 h-3 text-amber-400 shrink-0" />
                  <span class="truncate font-semibold">{{ link.title }}</span>
                </li>
              </ul>
            </div>

            <!-- Flashcards -->
            <div v-if="impact!.flashcardsCount > 0" class="bg-violet-50/70 border border-violet-100 rounded-2xl p-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <BookOpen class="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <span class="text-xs font-bold text-violet-800 block">
                    {{ impact!.flashcardsCount }} flashcard{{ impact!.flashcardsCount > 1 ? 's' : '' }} liée{{ impact!.flashcardsCount > 1 ? 's' : '' }}
                  </span>
                  <span class="text-xs text-violet-600 font-medium">
                    Seront également déplacées vers la corbeille flashcards.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Info sécurité : récupérable -->
          <div class="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 flex items-start gap-2.5">
            <div class="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw class="w-3 h-3 text-emerald-600" />
            </div>
            <p class="text-xs text-emerald-800 font-medium leading-relaxed">
              Cette action est <strong>réversible</strong>. Accédez à la 
              <strong>Corbeille du Cerveau</strong> pour restaurer vos données.
            </p>
          </div>
        </template>

        <!-- Actions -->
        <div class="pt-1 flex gap-3">
          <Button 
            type="button"
            variant="outline"
            class="flex-1 py-2.5 rounded-xl border-neutral-200 font-bold"
            :disabled="isSubmitting"
            @click="emit('close')"
          >
            Annuler
          </Button>
          
          <Button 
            type="button" 
            :disabled="isLoading || isSubmitting"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow-md gap-2 transition-all"
            @click="handleConfirm"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <Trash2 v-else class="w-4 h-4" />
            {{ isSubmitting ? 'Suppression...' : 'Mettre à la corbeille' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
