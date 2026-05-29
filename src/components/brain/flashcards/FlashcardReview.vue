<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFlashcardsStore } from '@/stores/flashcards.store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, AlertCircle, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits(['back'])

const flashcardsStore = useFlashcardsStore()

// State de la session
const currentIndex = ref(0)
const isFlipped = ref(false)
const timeStart = ref(Date.now())
const isFinished = ref(false)

// Score de session
const correctCount = ref(0)
const totalReviewedThisSession = ref(0)

const currentCard = computed(() => {
  return flashcardsStore.currentSessionCards[currentIndex.value] || null
})

const totalCardsInSession = computed(() => {
  return flashcardsStore.currentSessionCards.length
})

const sessionProgressPercent = computed(() => {
  if (totalCardsInSession.value === 0) return 100
  return Math.round((totalReviewedThisSession.value / (totalReviewedThisSession.value + totalCardsInSession.value)) * 100)
})

function handleFlip() {
  isFlipped.value = !isFlipped.value
}

// Notation et passage à la suivante
async function handleRate(rating: number) {
  if (!currentCard.value) return

  const cardId = currentCard.value.id
  const timeTaken = Math.round((Date.now() - timeStart.value) / 1000)

  // Mettre à jour les stats de session
  totalReviewedThisSession.value++
  if (rating >= 3) {
    correctCount.value++
  }

  // Soumettre au store
  await flashcardsStore.submitCardReview(cardId, rating, timeTaken)

  // Si l'évaluation est >= 3, la carte a été retirée de la session.
  // Sinon, elle a été replacée à la fin de la session.
  
  // Si plus aucune carte n'est disponible dans la session active, la session se termine
  if (flashcardsStore.currentSessionCards.length === 0) {
    isFinished.value = true
  } else {
    // Si la carte a été retirée, l'index reste le même car la carte suivante glisse à la position courante.
    // Si la carte a été replacée à la fin, elle n'est plus à l'index courant non plus, donc l'index reste 0.
    isFlipped.value = false
    timeStart.value = Date.now()
  }
}

// Gestion des raccourcis clavier
function handleKeyDown(event: KeyboardEvent) {
  if (isFinished.value) return

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    handleFlip()
  } else if (isFlipped.value && event.key >= '0' && event.key <= '5') {
    const rating = parseInt(event.key, 10)
    handleRate(rating)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  timeStart.value = Date.now()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const ratings = [
  { value: 0, label: 'Bloqué', desc: '😰 Oubli total', color: 'bg-rose-500 hover:bg-rose-600 shadow-rose-100' },
  { value: 1, label: 'Difficile', desc: '😟 Presque oublié', color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' },
  { value: 2, label: 'Hésitant', desc: '😐 Effort requis', color: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' },
  { value: 3, label: 'Correct', desc: '😊 Rappel normal', color: 'bg-lime-500 hover:bg-lime-600 shadow-lime-100' },
  { value: 4, label: 'Facile', desc: '🚀 Réponse aisée', color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100' },
  { value: 5, label: 'Immédiat', desc: '⚡ Parfaite maîtrise', color: 'bg-teal-500 hover:bg-teal-600 shadow-teal-100' }
]
</script>

<template>
  <div class="h-full flex flex-col p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 shrink-0">
      <Button 
        variant="ghost" 
        size="sm" 
        class="rounded-xl text-neutral-500 hover:text-neutral-900 gap-2"
        @click="emit('back')"
      >
        <ArrowLeft class="w-4 h-4" />
        Retour aux Decks
      </Button>

      <div class="flex items-center gap-3" v-if="!isFinished && currentCard">
        <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider bg-neutral-100 px-3 py-1 rounded-xl">
          Deck: {{ currentCard.deck_name || 'Général' }}
        </span>
        <span class="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-xl">
          {{ totalCardsInSession }} restantes
        </span>
      </div>
    </div>

    <!-- Active Review Player -->
    <div v-if="!isFinished && currentCard" class="flex-1 flex flex-col gap-6 justify-center items-center">
      
      <!-- Progress Bar -->
      <div class="w-full max-w-xl space-y-1.5 shrink-0">
        <div class="flex justify-between text-xs font-bold text-neutral-500">
          <span>Progression</span>
          <span>{{ sessionProgressPercent }}%</span>
        </div>
        <div class="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
          <div 
            class="h-full bg-gradient-to-r from-primary-400 to-indigo-500 rounded-full transition-all duration-300"
            :style="{ width: `${sessionProgressPercent}%` }"
          ></div>
        </div>
      </div>

      <!-- Flashcard 3D container -->
      <div 
        @click="handleFlip"
        class="w-full max-w-xl min-h-[280px] sm:min-h-[340px] perspective-1000 cursor-pointer group relative"
      >
        <div 
          class="w-full h-full min-h-[280px] sm:min-h-[340px] duration-500 transform-style-3d relative transition-transform"
          :class="{ 'rotate-y-180': isFlipped }"
        >
          <!-- Front Card (Question) -->
          <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-neutral-200/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-md group-hover:shadow-xl group-hover:border-primary-200 transition-all overflow-y-auto">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-primary-500 bg-primary-50 px-2.5 py-1 rounded-lg mb-4 shrink-0">Question</span>
            <div class="text-lg sm:text-xl md:text-2xl font-extrabold text-neutral-850 px-2 sm:px-4 select-none leading-relaxed my-auto">
              {{ currentCard.question }}
            </div>
            <p class="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest mt-4 sm:mt-8 flex items-center gap-1.5 shrink-0">
              <Sparkles class="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500 fill-yellow-500" />
              Cliquer ou Espace pour retourner
            </p>
          </div>

          <!-- Back Card (Answer) -->
          <div class="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-neutral-200/80 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-md rotate-y-180 overflow-y-auto">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-lg mb-4 shrink-0">Réponse attendue</span>
            <div class="text-base sm:text-lg md:text-xl font-bold text-neutral-800 px-2 sm:px-4 leading-relaxed whitespace-pre-wrap my-auto">
              {{ currentCard.answer }}
            </div>
            <p class="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest mt-4 sm:mt-8 shrink-0">
              Évaluez votre degré de rappel ci-dessous
            </p>
          </div>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="w-full max-w-xl shrink-0 mt-4">
        <!-- Before flipped hint -->
        <transition name="fade" mode="out-in">
          <div v-if="!isFlipped" class="flex justify-center">
            <Button 
              @click="handleFlip"
              class="bg-neutral-900 hover:bg-neutral-850 text-white font-bold px-8 py-3 rounded-2xl shadow-lg transform active:scale-95 transition-all text-sm gap-2 h-11"
            >
              Afficher la réponse
              <ChevronRight class="w-4 h-4 text-white" />
            </Button>
          </div>

          <!-- Rating Buttons (Visible only when flipped) -->
          <div v-else class="space-y-4">
            <p class="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">
              Raccourcis clavier : tapez <kbd class="px-1.5 py-0.5 bg-neutral-100 border rounded font-mono shadow-sm text-[10px]">0</kbd> à <kbd class="px-1.5 py-0.5 bg-neutral-100 border rounded font-mono shadow-sm text-[10px]">5</kbd>
            </p>
            <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
              <button 
                v-for="rate in ratings" 
                :key="rate.value"
                @click="handleRate(rate.value)"
                class="flex flex-col items-center justify-center py-2 px-1 rounded-2xl border border-neutral-100 shadow-sm text-white font-semibold transition-all hover:scale-105 active:scale-95 text-center min-h-[60px] sm:min-h-[75px]"
                :class="rate.color"
              >
                <span class="text-base sm:text-lg font-black leading-none mb-0.5">{{ rate.value }}</span>
                <span class="text-[10px] sm:text-xs font-bold leading-none mb-0.5 sm:mb-1">{{ rate.label }}</span>
                <span class="hidden sm:inline-block text-[8px] md:text-[9px] font-medium opacity-85 leading-none">{{ rate.desc }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>

    </div>

    <!-- Finished Screen -->
    <div v-else-if="isFinished" class="flex-1 flex flex-col justify-center items-center text-center p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm">
      <div class="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle2 class="w-10 h-10" />
      </div>

      <h2 class="text-3xl font-extrabold text-neutral-900 mb-2">Félicitations !</h2>
      <p class="text-neutral-500 font-semibold max-w-md mb-8">
        Vous avez terminé votre session de révision. Vos progrès ont été enregistrés et programmés.
      </p>

      <!-- Session Stats Cards -->
      <div class="grid grid-cols-2 gap-6 w-full max-w-sm mb-10">
        <div class="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl text-center shadow-sm">
          <div class="text-3xl font-black text-neutral-800 mb-1">{{ totalReviewedThisSession }}</div>
          <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Cartes révisées</div>
        </div>

        <div class="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl text-center shadow-sm">
          <div class="text-3xl font-black text-green-500 mb-1">
            {{ totalReviewedThisSession > 0 ? Math.round((correctCount / totalReviewedThisSession) * 100) : 0 }}%
          </div>
          <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Taux de réussite</div>
        </div>
      </div>

      <div class="flex gap-4">
        <Button 
          variant="outline"
          class="font-bold py-2.5 px-6 rounded-2xl border-neutral-300"
          @click="emit('back')"
        >
          Fermer la session
        </Button>
        
        <Button 
          class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-2xl shadow-md gap-2"
          @click="() => { isFinished = false; currentIndex = 0; correctCount = 0; totalReviewedThisSession = 0; flashcardsStore.startSession() }"
        >
          <RefreshCw class="w-4 h-4 text-white" />
          Réviser à nouveau
        </Button>
      </div>
    </div>

    <!-- Empty Session Screen -->
    <div v-else class="flex-1 flex flex-col justify-center items-center text-center p-6">
      <div class="w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mb-4 border border-dashed border-neutral-200">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-neutral-900 mb-2">Aucune carte active</h3>
      <p class="text-neutral-500 font-semibold max-w-sm mb-6">
        Il n'y a plus aucune carte due ou disponible pour cette session.
      </p>
      <Button 
        class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-5 rounded-xl shadow-md"
        @click="emit('back')"
      >
        Retourner aux Decks
      </Button>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}
.transform-style-3d {
  transform-style: preserve-3d;
}
.backface-hidden {
  backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
