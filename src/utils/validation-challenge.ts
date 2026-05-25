export type Challenge = {
  type: 'calc' | 'question'
  question: string
  answer: string
  hint?: string
}

// Génère un calcul selon la difficulté
export function generateCalcChallenge(priority: string): Challenge {
  const difficulty = { low: 1, normal: 2, high: 3, urgent: 4 }[priority] ?? 2
  
  let a: number, b: number, op: string, answer: number
  
  if (difficulty === 1) {
    a = Math.floor(Math.random() * 10) + 1
    b = Math.floor(Math.random() * 10) + 1
    op = '+'
    answer = a + b
  } else if (difficulty === 2) {
    a = Math.floor(Math.random() * 20) + 5
    b = Math.floor(Math.random() * 10) + 2
    op = Math.random() > 0.5 ? '+' : '-'
    answer = op === '+' ? a + b : a - b
  } else if (difficulty === 3) {
    a = Math.floor(Math.random() * 12) + 2
    b = Math.floor(Math.random() * 12) + 2
    op = '×'
    answer = a * b
  } else {
    // Difficile : calcul à deux opérations
    a = Math.floor(Math.random() * 10) + 2
    b = Math.floor(Math.random() * 10) + 2
    const c = Math.floor(Math.random() * 10) + 1
    answer = a * b + c
    return {
      type: 'calc',
      question: `Combien fait ${a} × ${b} + ${c} ?`,
      answer: answer.toString()
    }
  }
  
  return {
    type: 'calc',
    question: `Combien fait ${a} ${op} ${b} ?`,
    answer: answer.toString()
  }
}
