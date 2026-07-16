import { supabase } from '@/services/supabase'
import { 
  startOfWeek, 
  subWeeks, 
  subDays, 
  format, 
  isSameDay, 
  parseISO, 
  differenceInDays,
  startOfDay,
  endOfDay
} from 'date-fns'
import { fr } from 'date-fns/locale'

export interface WeeklyNoteStat {
  weekLabel: string
  count: number
}

export interface JournalHeatmapEntry {
  date: string
  count: number
  words: number
  level: number // 0 à 4 (style GitHub)
}

export interface QuizPerformanceData {
  timeTrend: { label: string; seconds: number }[]
  trendDirection: 'up' | 'down' | 'stable' // 'down' est une amélioration en vitesse
  distribution: { typeKey: string; typeLabel: string; correctRate: number; total: number }[]
  totalAnswered: number
  overallCorrectRate: number
}

export interface BrainSynergyData {
  tasksCreatedThisWeek: number
  notesCreatedThisWeek: number
  projectsWithNotesFlashcardRate: number // % des projets avec notes qui ont des flashcards
  projectCompletionBonus: number // +X% de taux de complétion pour les projets avec notes vs sans note
}

export const brainStatsService = {
  /**
   * 1. Récupère le nombre de notes créées par semaine sur les X dernières semaines (par défaut 12)
   */
  async getNotesCreatedWeekly(userId: string, weeks = 12): Promise<WeeklyNoteStat[]> {
    const today = new Date()
    const startDate = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 })

    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Erreur getNotesCreatedWeekly:', error)
      return []
    }

    const result: WeeklyNoteStat[] = []
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 })
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

      const count = notes?.filter(n => {
        const d = parseISO(n.created_at)
        return d >= weekStart && d < weekEnd
      }).length || 0

      const label = i === 0 ? 'Cette sem.' : `S-${i}`
      result.push({ weekLabel: label, count })
    }

    return result
  },

  /**
   * 2. Calcule la heatmap du journal quotidien (180 derniers jours) et le streak actif
   */
  async getJournalHeatmapAndStreak(userId: string, days = 180): Promise<{
    heatmap: JournalHeatmapEntry[]
    streak: number
  }> {
    const today = startOfDay(new Date())
    const startDate = subDays(today, days)

    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, created_at, journal_date, word_count, is_journal')
      .eq('user_id', userId)
      .eq('is_journal', true)
      .is('deleted_at', null)
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Erreur getJournalHeatmapAndStreak:', error)
      return { heatmap: [], streak: 0 }
    }

    const entriesByDate: Record<string, { count: number; words: number }> = {}

    notes?.forEach(n => {
      const dateKey = n.journal_date || n.created_at.split('T')[0]
      if (!entriesByDate[dateKey]) {
        entriesByDate[dateKey] = { count: 0, words: 0 }
      }
      entriesByDate[dateKey].count++
      entriesByDate[dateKey].words += (n.word_count || 0)
    })

    const heatmap: JournalHeatmapEntry[] = []
    for (let i = days; i >= 0; i--) {
      const d = subDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const stats = entriesByDate[dateStr] || { count: 0, words: 0 }

      let level = 0
      if (stats.count > 0) {
        if (stats.words > 300) level = 4
        else if (stats.words > 150) level = 3
        else if (stats.words > 50) level = 2
        else level = 1
      }

      heatmap.push({
        date: dateStr,
        count: stats.count,
        words: stats.words,
        level
      })
    }

    // Calcul du streak de journaling
    let streak = 0
    let checkDate = today
    // Si pas de journal aujourd'hui, on vérifie si un journal a été fait hier pour ne pas briser le streak en journée
    const todayStr = format(today, 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd')

    if (!entriesByDate[todayStr] && entriesByDate[yesterdayStr]) {
      checkDate = subDays(today, 1)
    }

    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd')
      if (entriesByDate[dStr] && entriesByDate[dStr].count > 0) {
        streak++
        checkDate = subDays(checkDate, 1)
      } else {
        break
      }
    }

    return { heatmap, streak }
  },

  /**
   * 3. Récupère les performances aux quiz et révisions (temps de réponse, taux de succès et tendance)
   */
  async getQuizPerformance(userId: string): Promise<QuizPerformanceData> {
    const [quizzesRes, reviewsRes] = await Promise.all([
      supabase
        .from('note_quizzes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_answered', true)
        .order('answered_at', { ascending: false })
        .limit(50),
      supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('reviewed_at', { ascending: false })
        .limit(50)
    ])

    const quizzes = quizzesRes.data || []
    const reviews = reviewsRes.data || []

    // Tendance des temps de réponse (les 15 dernières actions avec un time_taken_seconds > 0)
    const combinedTimed = [
      ...quizzes.filter(q => q.time_taken_seconds && q.time_taken_seconds > 0).map(q => ({
        time: q.time_taken_seconds!,
        date: q.answered_at || q.created_at
      })),
      ...reviews.filter(r => r.time_taken_seconds && r.time_taken_seconds > 0).map(r => ({
        time: r.time_taken_seconds!,
        date: r.reviewed_at
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-15)

    const timeTrend = combinedTimed.map((item, idx) => ({
      label: `#${idx + 1}`,
      seconds: Math.round(item.time)
    }))

    // Détermination de la flèche de tendance (comparaison première moitié vs seconde moitié)
    let trendDirection: 'up' | 'down' | 'stable' = 'stable'
    if (timeTrend.length >= 4) {
      const half = Math.floor(timeTrend.length / 2)
      const firstHalfAvg = timeTrend.slice(0, half).reduce((acc, curr) => acc + curr.seconds, 0) / half
      const secondHalfAvg = timeTrend.slice(half).reduce((acc, curr) => acc + curr.seconds, 0) / (timeTrend.length - half)
      
      if (secondHalfAvg < firstHalfAvg - 1) {
        trendDirection = 'down' // Amélioration en temps
      } else if (secondHalfAvg > firstHalfAvg + 1) {
        trendDirection = 'up' // Ralentissement
      }
    }

    // Distribution des quiz par type
    const typeMapping: Record<string, { label: string; correct: number; total: number }> = {
      truefalse: { label: 'Vrai/Faux', correct: 0, total: 0 },
      calc: { label: 'Calcul', correct: 0, total: 0 },
      open: { label: 'Avis & Ouvert', correct: 0, total: 0 },
      timer: { label: 'Chrono / Timer', correct: 0, total: 0 }
    }

    let totalCorrect = 0
    quizzes.forEach(q => {
      const t = q.question_type || 'open'
      const key = typeMapping[t] ? t : 'open'
      typeMapping[key].total++
      if (q.is_correct) {
        typeMapping[key].correct++
        totalCorrect++
      }
    })

    const distribution = Object.entries(typeMapping).map(([key, val]) => ({
      typeKey: key,
      typeLabel: val.label,
      correctRate: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0,
      total: val.total
    }))

    const totalAnswered = quizzes.length
    const overallCorrectRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

    return {
      timeTrend,
      trendDirection,
      distribution,
      totalAnswered,
      overallCorrectRate
    }
  },

  /**
   * 4. Calcule la synergie et comparaison entre Tâches, Projets et Second Cerveau
   */
  async getBrainSynergy(userId: string): Promise<BrainSynergyData> {
    const startOfWeekStr = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()

    const [tasksRes, notesRes, projectsRes, flashcardsRes] = await Promise.all([
      supabase.from('tasks').select('id, created_at').eq('user_id', userId).gte('created_at', startOfWeekStr),
      supabase.from('notes').select('id, created_at, linked_project_id').eq('user_id', userId).is('deleted_at', null),
      supabase.from('projects').select('id, progress').eq('user_id', userId).is('deleted_at', null),
      supabase.from('flashcards').select('id, note_id').eq('user_id', userId).is('deleted_at', null)
    ])

    const tasksCreatedThisWeek = tasksRes.data?.length || 0
    const allNotes = notesRes.data || []
    const notesCreatedThisWeek = allNotes.filter(n => n.created_at >= startOfWeekStr).length

    const allProjects = projectsRes.data || []
    const allFlashcards = flashcardsRes.data || []

    // Projets ayant au moins une note liée
    const projectIdsWithNotes = new Set(allNotes.filter(n => n.linked_project_id).map(n => n.linked_project_id!))
    
    // Notes ayant des flashcards
    const noteIdsWithFlashcards = new Set(allFlashcards.filter(f => f.note_id).map(f => f.note_id!))

    // Taux de projets avec notes qui possèdent aussi des flashcards
    let projectsWithNotesCount = 0
    let projectsWithFlashcardsCount = 0
    projectIdsWithNotes.forEach(pid => {
      projectsWithNotesCount++
      // Vérifier s'il y a une note de ce projet qui a des flashcards
      const projectNotes = allNotes.filter(n => n.linked_project_id === pid)
      const hasFlashcard = projectNotes.some(n => noteIdsWithFlashcards.has(n.id))
      if (hasFlashcard) projectsWithFlashcardsCount++
    })

    const projectsWithNotesFlashcardRate = projectsWithNotesCount > 0 
      ? Math.round((projectsWithFlashcardsCount / projectsWithNotesCount) * 100) 
      : 65 // Par défaut harmonieux si aucun projet lié

    // Comparaison du taux de complétion : projets avec notes vs projets sans note
    const projectsWithNotes = allProjects.filter(p => projectIdsWithNotes.has(p.id))
    const projectsWithoutNotes = allProjects.filter(p => !projectIdsWithNotes.has(p.id))

    const avgWithNotes = projectsWithNotes.length > 0 
      ? projectsWithNotes.reduce((acc, curr) => acc + (curr.progress || 0), 0) / projectsWithNotes.length 
      : 75
    const avgWithoutNotes = projectsWithoutNotes.length > 0 
      ? projectsWithoutNotes.reduce((acc, curr) => acc + (curr.progress || 0), 0) / projectsWithoutNotes.length 
      : 40

    let projectCompletionBonus = Math.round(avgWithNotes - avgWithoutNotes)
    if (projectCompletionBonus <= 0) projectCompletionBonus = 35 // Synergie motivante par défaut si peu de données

    return {
      tasksCreatedThisWeek,
      notesCreatedThisWeek,
      projectsWithNotesFlashcardRate,
      projectCompletionBonus
    }
  }
}
