<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFlashcardsStore } from '@/stores/flashcards.store'
import { Button } from '@/components/ui/button'
import FlashcardDeck from '@/components/brain/flashcards/FlashcardDeck.vue'
import FlashcardReview from '@/components/brain/flashcards/FlashcardReview.vue'
import FlashcardCreate from '@/components/brain/flashcards/FlashcardCreate.vue'
import { Sparkles, Plus, Clock, BookOpen, AlertCircle } from 'lucide-vue-next'

const flashcardsStore = useFlashcardsStore()

const showCreateModal = ref(false)
const showReviewPlayer = ref(false)
const selectedDeckName = ref<string | undefined>(undefined)

onMounted(async () => {
  await flashcardsStore.fetchCards()
})

const totalDueCount = computed(() => flashcardsStore.totalDueCount)
const totalDecksCount = computed(() => flashcardsStore.decks.length)

function handleStartReview(deckName?: string) {
  selectedDeckName.value = deckName
  flashcardsStore.startSession(deckName)
  showReviewPlayer.value = true
}

function handleSessionBack() {
  showReviewPlayer.value = false
  flashcardsStore.resetSession()
  flashcardsStore.fetchCards() // Actualiser après révision
}

function handleCardCreated() {
  showCreateModal.value = false
  flashcardsStore.fetchCards() // Actualiser
}
</script>

<template>
  <div class="h-full bg-neutral-50/50 overflow-y-auto">
    <!-- Active Session Screen -->
    <div v-if="showReviewPlayer" class="h-full">
      <FlashcardReview @back="handleSessionBack" />
    </div>

    <!-- Main Decks View -->
    <div v-else class="p-6 max-w-7xl mx-auto space-y-8">
      
      <!-- Premium Stats Banner -->
      <div class="bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <!-- background dynamic blur circles -->
        <div class="absolute -left-12 -top-12 w-48 h-48 bg-primary-600/20 rounded-full blur-3xl"></div>
        <div class="absolute right-12 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-indigo-200 border border-white/10 flex items-center gap-1.5 shadow-sm">
                <Sparkles class="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                Répétition Espacée active
              </span>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Révision Flashcards (SM-2)</h2>
            <p class="text-indigo-200 text-xs sm:text-sm max-w-md font-semibold leading-relaxed">
              Mémorisez de façon optimale vos concepts clés. L'algorithme calcule intelligemment le meilleur moment pour réviser.
            </p>
          </div>

          <!-- Quick counts widgets -->
          <div class="grid grid-cols-2 sm:flex gap-3 sm:gap-4 w-full md:w-auto shrink-0">
            <!-- Due Widget -->
            <div class="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center shadow-md">
              <div class="text-2xl sm:text-3xl font-black text-rose-400 mb-1 leading-none">
                {{ totalDueCount }}
              </div>
              <div class="text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest flex items-center justify-center gap-1">
                <Clock class="w-3 sm:w-3.5 h-3 sm:h-3.5 text-rose-400" />
                Dues
              </div>
            </div>

            <!-- Total Widget -->
            <div class="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center shadow-md">
              <div class="text-2xl sm:text-3xl font-black text-indigo-300 mb-1 leading-none">
                {{ flashcardsStore.cards.length }}
              </div>
              <div class="text-[9px] sm:text-[10px] font-bold text-indigo-200 uppercase tracking-widest flex items-center justify-center gap-1">
                <BookOpen class="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-300" />
                Cartes
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 class="text-lg sm:text-xl font-bold text-neutral-900 leading-tight">Decks disponibles</h3>
          <p class="text-xs text-neutral-500 font-semibold">Organisez vos apprentissages par thématique ou note</p>
        </div>

        <div class="flex flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Button 
            v-if="totalDueCount > 0"
            @click="() => handleStartReview()"
            class="flex-1 sm:flex-none bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl shadow-md gap-2 h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Clock class="w-4 h-4 text-white" />
            Tout réviser ({{ totalDueCount }})
          </Button>

          <Button 
            @click="showCreateModal = true"
            class="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-2xl shadow-md gap-2 h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Plus class="w-4 h-4 text-white" />
            Nouvelle Carte
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="flashcardsStore.loading && flashcardsStore.cards.length === 0" class="text-center py-20 text-neutral-500 font-semibold">
        Chargement de vos decks...
      </div>

      <!-- Empty State -->
      <div v-else-if="flashcardsStore.cards.length === 0" class="bg-white border-2 border-dashed border-neutral-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm">
        <div class="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200/50 flex items-center justify-center text-neutral-400 mb-4 shadow-inner">
          <AlertCircle class="w-8 h-8" />
        </div>
        <h4 class="text-xl font-bold text-neutral-900 mb-2">Aucune carte mémoire</h4>
        <p class="text-neutral-500 text-sm font-semibold max-w-sm mb-6">
          Commencez à créer des flashcards depuis vos notes ou créez une carte libre pour ancrer vos révisions.
        </p>
        <Button 
          @click="showCreateModal = true"
          class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-2xl shadow-md gap-2"
        >
          <Plus class="w-4 h-4 text-white" />
          Créer votre première carte
        </Button>
      </div>

      <!-- Decks Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <FlashcardDeck 
          v-for="deck in flashcardsStore.decks"
          :key="deck.name"
          :deck="deck"
          @review="handleStartReview"
        />
      </div>

      <!-- Modals -->
      <FlashcardCreate 
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @created="handleCardCreated"
      />

    </div>
  </div>
</template>
