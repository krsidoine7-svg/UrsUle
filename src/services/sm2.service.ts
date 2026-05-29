export interface SM2State {
  repetitions: number
  easeFactor: number
  intervalDays: number
  dueDate: string
}

/**
 * Calcule le prochain intervalle de révision d'une carte mémoire
 * en utilisant l'algorithme d'espacement de SuperMemo 2 (SM-2).
 * 
 * @param state État actuel de la carte (répétitions, easeFactor, intervalDays)
 * @param rating Évaluation de l'utilisateur (0 à 5)
 *               0 : Blocage total
 *               1 : Très difficile (erreur, mais réponse connue à la vue)
 *               2 : Difficile (temps d'hésitation important)
 *               3 : Correct (effort de mémoire requis)
 *               4 : Facile (réponse rapide sans hésitation)
 *               5 : Très facile / Immédiat
 */
export function calculateNextReview(
  state: { repetitions: number; easeFactor: number; intervalDays: number },
  rating: number
): SM2State {
  let { repetitions, easeFactor, intervalDays } = state

  if (rating < 3) {
    // Échec de rappel -> réinitialiser les répétitions à 0 et l'intervalle à 1 jour
    repetitions = 0
    intervalDays = 1
  } else {
    // Succès de rappel -> augmenter l'intervalle
    if (repetitions === 0) {
      intervalDays = 1
    } else if (repetitions === 1) {
      intervalDays = 6
    } else {
      intervalDays = Math.round(intervalDays * easeFactor)
    }
    repetitions++
  }

  // Ajustement du facteur de facilité (ease factor)
  // easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  
  // Limiter le facteur de facilité à un minimum de 1.3 (recommandé par l'algorithme original)
  if (easeFactor < 1.3) {
    easeFactor = 1.3
  }

  // Calcul de la date d'échéance (due_date) au format local YYYY-MM-DD
  const dueDateObj = new Date()
  dueDateObj.setDate(dueDateObj.getDate() + intervalDays)
  
  // Formater proprement YYYY-MM-DD en tenant compte du fuseau local
  const year = dueDateObj.getFullYear()
  const month = String(dueDateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dueDateObj.getDate()).padStart(2, '0')
  const dueDate = `${year}-${month}-${day}`

  return {
    repetitions,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    intervalDays,
    dueDate
  }
}
