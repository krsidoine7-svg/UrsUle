import { supabase } from '@/services/supabase'
import { 
  startOfDay, 
  endOfDay, 
  subDays, 
  format,
  eachDayOfInterval,
  isSameDay
} from 'date-fns'

export const statsService = {
  // Tâches du jour
  async getTodayStats(userId: string) {
    const today = new Date()
    const start = startOfDay(today).toISOString()
    const end = endOfDay(today).toISOString()

    const { data: created, error: e1 } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)

    if (e1) console.error('getTodayStats created error:', e1)

    const { data: completed, error: e2 } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', start)
      .lte('completed_at', end)

    if (e2) console.error('getTodayStats completed error:', e2)

    return {
      created: created?.length || 0,
      completed: completed?.length || 0
    }
  },

  // Données par jour pour un intervalle (Line Chart)
  async getIntervalStats(userId: string, from: Date, to: Date) {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, created_at, completed_at, status')
      .eq('user_id', userId)
      .or(`created_at.gte.${from.toISOString()},completed_at.gte.${from.toISOString()}`)

    if (error) {
      console.error('getIntervalStats error:', error)
      return []
    }

    const days = eachDayOfInterval({ start: from, end: to })
    
    return days.map(day => {
      const created = tasks?.filter((t: any) => isSameDay(new Date(t.created_at), day)).length || 0
      const completed = tasks?.filter((t: any) => t.completed_at && isSameDay(new Date(t.completed_at), day)).length || 0
      return {
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'dd MMM'),
        created,
        completed
      }
    })
  },

  // Répartition par catégorie (Doughnut Chart)
  async getCategoryDistribution(userId: string, from: Date, to: Date) {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('category_id, categories(name, color)')
      .eq('user_id', userId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())

    if (error) {
      console.error('getCategoryDistribution error:', error)
      return []
    }

    const distribution: Record<string, { count: number, name: string, color: string }> = {}
    
    tasks?.forEach((t: any) => {
      const catId = t.category_id || 'none'
      const cat = t.categories
      if (!distribution[catId]) {
        distribution[catId] = { count: 0, name: cat?.name || 'Sans catégorie', color: cat?.color || '#cbd5e1' }
      }
      distribution[catId].count++
    })

    return Object.values(distribution)
  },

  // Répartition des humeurs (Mood Chart)
  async getMoodDistribution(userId: string, from: Date, to: Date) {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('appreciation')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', from.toISOString())
      .lte('completed_at', to.toISOString())
      .not('appreciation', 'is', null)

    if (error) {
      console.error('getMoodDistribution error:', error)
    }

    const moods = [
      { id: 'happy', label: 'Content', count: 0 },
      { id: 'super_productive', label: 'Productif', count: 0 },
      { id: 'enriching', label: 'Enrichissant', count: 0 },
      { id: 'neutral', label: 'Neutre', count: 0 },
      { id: 'too_hard', label: 'Difficile', count: 0 },
      { id: 'stressful', label: 'Stressant', count: 0 },
      { id: 'boring', label: 'Ennuyeux', count: 0 },
      { id: 'nothing_learned', label: 'Rien appris', count: 0 },
    ]

    tasks?.forEach((t: any) => {
      const mood = moods.find(m => m.id === t.appreciation)
      if (mood) mood.count++
    })

    return moods
  },

  // Heatmap Data (180 derniers jours)
  async getHeatmapData(userId: string) {
    const to = endOfDay(new Date())
    const from = startOfDay(subDays(to, 180))

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', from.toISOString())
      .lte('completed_at', to.toISOString())

    if (error) {
      console.error('getHeatmapData error:', error)
      return {}
    }

    const counts: Record<string, number> = {}
    tasks?.forEach((t: any) => {
      const date = format(new Date(t.completed_at!), 'yyyy-MM-dd')
      counts[date] = (counts[date] || 0) + 1
    })

    return counts
  },

  // Temps total travaillé
  async getTotalTime(userId: string, from: Date, to: Date) {
    const { data: sessions, error } = await supabase
      .from('time_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())

    if (error) {
      console.error('getTotalTime error:', error)
      return 0
    }

    const totalMinutes = sessions?.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0) || 0
    return Math.round(totalMinutes / 60 * 10) / 10 // en heures
  }
}
