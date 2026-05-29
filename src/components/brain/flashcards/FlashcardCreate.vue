<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFlashcardsStore } from '@/stores/flashcards.store'
import { useNotesStore } from '@/stores/notes.store'
import { Button } from '@/components/ui/button'
import { X, FileText, Plus, Check } from 'lucide-vue-next'

const props = defineProps<{
  noteId?: string | null
  initialDeckName?: string
}>()

const emit = defineEmits(['close', 'created'])

const flashcardsStore = useFlashcardsStore()
const notesStore = useNotesStore()

const question = ref('')
const answer = ref('')
const deckName = ref(props.initialDeckName || 'Général')
const cardType = ref<'qa' | 'truefalse' | 'cloze'>('qa')
const selectedNoteId = ref<string | null>(props.noteId || null)

const isSubmitting = ref(false)
const showSuccess = ref(false)

onMounted(async () => {
  if (notesStore.notes.length === 0) {
    await notesStore.fetchNotes()
  }
})

async function handleSubmit() {
  if (!question.value.trim() || !answer.value.trim()) return

  isSubmitting.value = true
  try {
    await flashcardsStore.createCard({
      note_id: selectedNoteId.value,
      deck_name: deckName.value.trim() || 'Général',
      question: question.value.trim(),
      answer: answer.value.trim(),
      card_type: cardType.value
    })

    showSuccess.value = true
    question.value = ''
    answer.value = ''

    setTimeout(() => {
      showSuccess.value = false
      emit('created')
    }, 1500)
  } catch (e) {
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
    <div 
      class="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-100 overflow-hidden transform transition-all flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
        <div>
          <h3 class="text-xl font-bold text-neutral-900">Nouvelle Flashcard</h3>
          <p class="text-xs text-neutral-500 font-medium">Ancrez vos concepts clés en 1 clic</p>
        </div>
        <button 
          @click="emit('close')" 
          class="p-2 hover:bg-neutral-200/60 rounded-xl text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-5 overflow-y-auto flex-1 max-h-[70vh]">
        <!-- Success Alert -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-4 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-4 opacity-0"
        >
          <div v-if="showSuccess" class="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Check class="w-5 h-5" />
            </div>
            <div>
              <p class="font-bold text-sm">Flashcard enregistrée !</p>
              <p class="text-xs text-green-600 font-medium">Elle a été ajoutée à votre deck.</p>
            </div>
          </div>
        </transition>

        <!-- Deck & Type -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Deck</label>
            <input 
              v-model="deckName"
              placeholder="ex: Vue 3, Supabase..."
              class="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Type</label>
            <select 
              v-model="cardType"
              class="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
            >
              <option value="qa">Question / Réponse</option>
              <option value="truefalse">Vrai ou Faux</option>
              <option value="cloze">Texte à trous</option>
            </select>
          </div>
        </div>

        <!-- Note liée -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Note liée (Optionnel)</label>
          <div class="relative">
            <select 
              v-model="selectedNoteId"
              class="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm cursor-pointer"
            >
              <option :value="null">Aucune note</option>
              <option v-for="note in notesStore.notes" :key="note.id" :value="note.id">
                {{ note.title || 'Sans titre' }}
              </option>
            </select>
            <FileText class="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        <!-- Question -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            {{ cardType === 'cloze' ? 'Texte original (avec trous)' : 'Question' }}
          </label>
          <textarea 
            v-model="question"
            rows="3"
            placeholder="ex: Quel hook permet de créer un état réactif dans Vue 3 ?"
            class="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm resize-none"
            required
          ></textarea>
        </div>

        <!-- Réponse -->
        <div>
          <label class="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
            {{ cardType === 'cloze' ? 'Mots à masquer (séparés par des virgules)' : 'Réponse attendue' }}
          </label>
          <textarea 
            v-model="answer"
            rows="3"
            placeholder="ex: ref() et reactive()"
            class="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold outline-none focus:border-primary-500 focus:bg-white transition-all shadow-sm resize-none"
            required
          ></textarea>
        </div>

        <!-- Bouton -->
        <div class="pt-2">
          <Button 
            type="submit" 
            :disabled="isSubmitting || !question.trim() || !answer.trim()"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-2xl shadow-md gap-2"
          >
            <Plus class="w-5 h-5" />
            Créer la carte
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
