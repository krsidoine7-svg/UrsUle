import { supabase } from './supabase'
import { calculateNextReview } from './sm2.service'
import type { Flashcard, FlashcardReview, CardType } from '@/types/brain.types'

export const flashcardsService = {
  /**
   * Récupère toutes les flashcards de l'utilisateur.
   * Possibilité de filtrer par note_id ou deck_name.
   */
  async getAll(filters?: { noteId?: string; deckName?: string }): Promise<Flashcard[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)

    if (filters?.noteId) {
      query = query.eq('note_id', filters.noteId)
    }

    if (filters?.deckName) {
      query = query.eq('deck_name', filters.deckName)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data as Flashcard[]
  },

  /**
   * Récupère les cartes qui sont dues aujourd'hui (due_date <= aujourd'hui).
   */
  async getDue(): Promise<Flashcard[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const todayStr = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .lte('due_date', todayStr)
      .order('due_date', { ascending: true })

    if (error) throw error
    return data as Flashcard[]
  },

  /**
   * Crée une nouvelle flashcard.
   */
  async create(card: {
    note_id?: string | null
    deck_name?: string
    question: string
    answer: string
    card_type?: CardType
  }): Promise<Flashcard> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const newCard = {
      user_id: user.id,
      note_id: card.note_id || null,
      deck_name: card.deck_name || 'Général',
      question: card.question,
      answer: card.answer,
      card_type: card.card_type || 'qa',
      repetitions: 0,
      ease_factor: 2.5,
      interval_days: 1,
      due_date: new Date().toISOString().split('T')[0],
      total_reviews: 0,
      correct_reviews: 0
    }

    const { data, error } = await supabase
      .from('flashcards')
      .insert(newCard)
      .select('*')
      .single()

    if (error) throw error
    return data as Flashcard
  },

  /**
   * Met à jour une flashcard existante.
   */
  async update(id: string, card: Partial<Flashcard>): Promise<Flashcard> {
    const { data, error } = await supabase
      .from('flashcards')
      .update(card)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as Flashcard
  },

  /**
   * Supprime une flashcard.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Soumet une révision pour une flashcard donnée.
   * Calcule le nouvel état via l'algorithme SM-2,
   * met à jour la carte et insère un historique de révision.
   */
  async submitReview(
    flashcardId: string,
    rating: number,
    timeTakenSeconds?: number
  ): Promise<{ card: Flashcard; review: FlashcardReview }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    // 1. Récupérer la carte actuelle
    const { data: card, error: fetchError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', flashcardId)
      .single()

    if (fetchError) throw fetchError

    // 2. Calculer le nouvel état SM-2
    const nextState = calculateNextReview(
      {
        repetitions: card.repetitions,
        easeFactor: Number(card.ease_factor),
        intervalDays: card.interval_days
      },
      rating
    )

    // 3. Mettre à jour la flashcard
    const totalReviews = (card.total_reviews || 0) + 1
    const correctReviews = (card.correct_reviews || 0) + (rating >= 3 ? 1 : 0)

    const updatedCardFields: Partial<Flashcard> = {
      repetitions: nextState.repetitions,
      ease_factor: nextState.easeFactor,
      interval_days: nextState.intervalDays,
      due_date: nextState.dueDate,
      last_reviewed_at: new Date().toISOString(),
      total_reviews: totalReviews,
      correct_reviews: correctReviews
    }

    const { data: updatedCard, error: updateError } = await supabase
      .from('flashcards')
      .update(updatedCardFields)
      .eq('id', flashcardId)
      .select('*')
      .single()

    if (updateError) throw updateError

    // 4. Insérer l'historique dans flashcard_reviews
    const reviewData = {
      flashcard_id: flashcardId,
      user_id: user.id,
      rating,
      time_taken_seconds: timeTakenSeconds || null
    }

    const { data: insertedReview, error: reviewError } = await supabase
      .from('flashcard_reviews')
      .insert(reviewData)
      .select('*')
      .single()

    if (reviewError) throw reviewError

    return {
      card: updatedCard as Flashcard,
      review: insertedReview as FlashcardReview
    }
  }
}
