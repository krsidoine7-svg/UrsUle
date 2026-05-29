import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { flashcardsService } from '@/services/flashcards.service'
import type { Flashcard, FlashcardReview, CardType } from '@/types/brain.types'

export interface DeckStats {
  name: string
  totalCards: number
  dueCount: number
  masteredCount: number
  masteryRate: number // 0 to 100
}

export const useFlashcardsStore = defineStore('flashcards', () => {
  const cards = ref<Flashcard[]>([])
  const dueCards = ref<Flashcard[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Session active
  const currentSessionCards = ref<Flashcard[]>([])
  const sessionHistory = ref<{ cardId: string; rating: number }[]>([])

  // Computeds
  const decks = computed<DeckStats[]>(() => {
    const map = new Map<string, { total: number; due: number; mastered: number }>()

    // Initialiser le deck Général par défaut si vide
    map.set('Général', { total: 0, due: 0, mastered: 0 })

    // Grouper les cartes par deck
    cards.value.forEach(card => {
      const deckName = card.deck_name || 'Général'
      if (!map.has(deckName)) {
        map.set(deckName, { total: 0, due: 0, mastered: 0 })
      }
      
      const stats = map.get(deckName)!
      stats.total++
      
      // Est-elle due ?
      const todayStr = new Date().toISOString().split('T')[0]
      if (card.due_date <= todayStr) {
        stats.due++
      }

      // Est-elle maîtrisée ? (définition : au moins 3 répétitions correctes et ease_factor >= 2.5)
      const isMastered = card.repetitions >= 3 && Number(card.ease_factor) >= 2.4
      if (isMastered) {
        stats.mastered++
      }
    })

    return Array.from(map.entries()).map(([name, stats]) => {
      const masteryRate = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0
      return {
        name,
        totalCards: stats.total,
        dueCount: stats.due,
        masteredCount: stats.mastered,
        masteryRate
      }
    }).filter(deck => deck.totalCards > 0 || deck.name === 'Général') // Toujours garder Général
  })

  const totalDueCount = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return cards.value.filter(c => c.due_date <= todayStr).length
  })

  // Actions
  async function fetchCards() {
    loading.value = true
    try {
      cards.value = await flashcardsService.getAll()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchDueCards() {
    loading.value = true
    try {
      dueCards.value = await flashcardsService.getDue()
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createCard(cardData: {
    note_id?: string | null
    deck_name?: string
    question: string
    answer: string
    card_type?: CardType
  }) {
    loading.value = true
    try {
      const newCard = await flashcardsService.create(cardData)
      cards.value.unshift(newCard)
      
      // Mettre à jour les cartes dues si elle est due immédiatement (ce qui est le cas par défaut)
      const todayStr = new Date().toISOString().split('T')[0]
      if (newCard.due_date <= todayStr) {
        dueCards.value.push(newCard)
      }
      return newCard
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCard(id: string, cardData: Partial<Flashcard>) {
    try {
      const updated = await flashcardsService.update(id, cardData)
      
      // Remplacer dans la liste générale
      const idx = cards.value.findIndex(c => c.id === id)
      if (idx !== -1) cards.value[idx] = updated

      // Remplacer dans la liste des dues
      const dueIdx = dueCards.value.findIndex(c => c.id === id)
      if (dueIdx !== -1) {
        const todayStr = new Date().toISOString().split('T')[0]
        if (updated.due_date <= todayStr) {
          dueCards.value[dueIdx] = updated
        } else {
          dueCards.value.splice(dueIdx, 1)
        }
      }
      return updated
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  async function deleteCard(id: string) {
    try {
      await flashcardsService.delete(id)
      cards.value = cards.value.filter(c => c.id !== id)
      dueCards.value = dueCards.value.filter(c => c.id !== id)
      currentSessionCards.value = currentSessionCards.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  /**
   * Lance une session de révision active pour un deck donné.
   * Si aucune carte n'est due, permet d'étudier n'importe quelle carte du deck (mode libre).
   */
  function startSession(deckName?: string) {
    const todayStr = new Date().toISOString().split('T')[0]
    
    // 1. Filtrer les cartes dues
    let sessionDue = cards.value.filter(c => c.due_date <= todayStr)
    if (deckName) {
      sessionDue = sessionDue.filter(c => (c.deck_name || 'Général') === deckName)
    }

    // 2. Si aucune carte n'est due, proposer toutes les cartes du deck (mode révision libre)
    if (sessionDue.length === 0) {
      let allDeckCards = [...cards.value]
      if (deckName) {
        allDeckCards = allDeckCards.filter(c => (c.deck_name || 'Général') === deckName)
      }
      // Mélanger les cartes
      currentSessionCards.value = allDeckCards.sort(() => Math.random() - 0.5)
    } else {
      // Mélanger les cartes dues
      currentSessionCards.value = sessionDue.sort(() => Math.random() - 0.5)
    }

    sessionHistory.value = []
  }

  /**
   * Enregistre le feedback d'évaluation (0 à 5) pour une carte.
   * Si l'évaluation est < 3 (échec), la carte est replacée à la fin de la session active pour être revue.
   */
  async function submitCardReview(cardId: string, rating: number, timeTakenSeconds?: number) {
    try {
      const { card: updatedCard } = await flashcardsService.submitReview(cardId, rating, timeTakenSeconds)
      
      // Mettre à jour la liste générale des cartes
      const idx = cards.value.findIndex(c => c.id === cardId)
      if (idx !== -1) cards.value[idx] = updatedCard

      // Mettre à jour les cartes dues
      dueCards.value = dueCards.value.filter(c => c.id !== cardId)

      // Enregistrer dans l'historique de session
      sessionHistory.value.push({ cardId, rating })

      // Retirer de la session active
      const sessionIdx = currentSessionCards.value.findIndex(c => c.id === cardId)
      if (sessionIdx !== -1) {
        currentSessionCards.value.splice(sessionIdx, 1)
      }

      // Si mauvaise note (< 3), replacer la carte à la fin de la session pour la retravailler
      if (rating < 3) {
        currentSessionCards.value.push(updatedCard)
      }

      return updatedCard
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  function resetSession() {
    currentSessionCards.value = []
    sessionHistory.value = []
  }

  return {
    cards,
    dueCards,
    loading,
    error,
    currentSessionCards,
    sessionHistory,
    decks,
    totalDueCount,
    fetchCards,
    fetchDueCards,
    createCard,
    updateCard,
    deleteCard,
    startSession,
    submitCardReview,
    resetSession
  }
})
