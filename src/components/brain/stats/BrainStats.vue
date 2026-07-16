<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotesStore } from '@/stores/notes.store'
import { useFlashcardsStore } from '@/stores/flashcards.store'
import { linksService } from '@/services/links.service'
import { brainStatsService, type WeeklyNoteStat, type JournalHeatmapEntry, type QuizPerformanceData, type BrainSynergyData } from '@/services/brainStats.service'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import '@/components/stats/BaseChartConfig'
import { 
  FileText, 
  LibraryBig, 
  Network, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  Zap, 
  Flame, 
  Share2, 
  Layers 
} from 'lucide-vue-next'

const authStore = useAuthStore()
const notesStore = useNotesStore()
const flashcardsStore = useFlashcardsStore()

const loading = ref(true)
const weeklyNotes = ref<WeeklyNoteStat[]>([])
const journalHeatmap = ref<JournalHeatmapEntry[]>([])
const journalStreak = ref(0)
const linksCount = ref(0)
const quizPerformance = ref<QuizPerformanceData>({
  timeTrend: [],
  trendDirection: 'stable',
  distribution: [],
  totalAnswered: 0,
  overallCorrectRate: 0
})
const brainSynergy = ref<BrainSynergyData>({
  tasksCreatedThisWeek: 0,
  notesCreatedThisWeek: 0,
  projectsWithNotesFlashcardRate: 0,
  projectCompletionBonus: 0
})

const totalNotesCount = computed(() => notesStore.notes.filter(n => !n.deleted_at).length)
const thisWeekNotesCount = computed(() => brainSynergy.value.notesCreatedThisWeek)
const masteredCardsCount = computed(() => flashcardsStore.decks.reduce((acc, d) => acc + d.masteredCount, 0))
const totalCardsCount = computed(() => flashcardsStore.cards.length)
const masteryRate = computed(() => totalCardsCount.value > 0 ? Math.round((masteredCardsCount.value / totalCardsCount.value) * 100) : 0)

// Chargement complet des données réelles
async function loadAllBrainStats() {
  if (!authStore.user) return
  loading.value = true
  try {
    const userId = authStore.user.id
    
    // Charger stores si vides
    await Promise.all([
      notesStore.fetchNotes(),
      flashcardsStore.fetchCards()
    ])

    // Charger les liens pour connaître le nombre de liens
    try {
      const graph = await linksService.getGraphData()
      linksCount.value = graph.edges.length
    } catch (e) {
      console.warn('Impossible de charger le graphe de liens:', e)
      linksCount.value = 0
    }

    // Services spécialisés
    const [weeklyData, heatmapAndStreak, quizData, synergyData] = await Promise.all([
      brainStatsService.getNotesCreatedWeekly(userId, 12),
      brainStatsService.getJournalHeatmapAndStreak(userId, 180),
      brainStatsService.getQuizPerformance(userId),
      brainStatsService.getBrainSynergy(userId)
    ])

    weeklyNotes.value = weeklyData
    journalHeatmap.value = heatmapAndStreak.heatmap
    journalStreak.value = heatmapAndStreak.streak
    quizPerformance.value = quizData
    brainSynergy.value = synergyData
  } catch (e) {
    console.error('Erreur loadAllBrainStats:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllBrainStats()
})

// ─── Chart A : Notes créées par semaine (Line) ───
const weeklyNotesChartData = computed(() => ({
  labels: weeklyNotes.value.map(w => w.weekLabel),
  datasets: [
    {
      label: 'Notes créées',
      data: weeklyNotes.value.map(w => w.count),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ]
}))

const weeklyNotesOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      padding: 12,
      backgroundColor: '#171717',
      titleFont: { size: 14, weight: 'bold' as const },
      callbacks: {
        label: (context: any) => ` ${context.raw} note${context.raw > 1 ? 's' : ''} créée${context.raw > 1 ? 's' : ''}`
      }
    }
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
}

// ─── Chart B : Progression Flashcards par deck (Stacked Bar) ───
const flashcardsDeckChartData = computed(() => {
  const decks = flashcardsStore.decks
  return {
    labels: decks.map(d => d.name),
    datasets: [
      {
        label: 'Maîtrisées',
        data: decks.map(d => d.masteredCount),
        backgroundColor: '#22c55e',
        borderRadius: 4
      },
      {
        label: 'En cours',
        data: decks.map(d => Math.max(0, d.totalCards - d.masteredCount - d.dueCount)),
        backgroundColor: '#3b82f6',
        borderRadius: 4
      },
      {
        label: 'À réviser (dues)',
        data: decks.map(d => d.dueCount),
        backgroundColor: '#ef4444',
        borderRadius: 4
      }
    ]
  }
})

const flashcardsDeckOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' as const, align: 'end' as const },
    tooltip: { mode: 'index' as const, intersect: false, padding: 12, backgroundColor: '#171717' }
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true }
  }
}

// ─── Chart C : Temps de réponse Quiz (Line) ───
const quizTimeChartData = computed(() => ({
  labels: quizPerformance.value.timeTrend.map(t => t.label),
  datasets: [
    {
      label: 'Temps de réponse (sec)',
      data: quizPerformance.value.timeTrend.map(t => t.seconds),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6
    }
  ]
}))

const quizTimeOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      padding: 12,
      backgroundColor: '#171717',
      callbacks: {
        label: (context: any) => ` ${context.raw} secondes`
      }
    }
  },
  scales: {
    y: { beginAtZero: true }
  }
}

// ─── Chart D : Répartition des Tags (Donut) ───
const tagsDistribution = computed(() => {
  const tagCounts: Record<string, number> = {}
  notesStore.notes.forEach(n => {
    if (!n.deleted_at && n.tags && n.tags.length > 0) {
      n.tags.forEach(t => {
        const clean = t.trim()
        if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1
      })
    }
  })

  const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, 5)
  const othersCount = sorted.slice(5).reduce((acc, curr) => acc + curr[1], 0)

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b']
  const items = top.map(([name, count], i) => ({
    name: `#${name}`,
    count,
    color: colors[i % colors.length]
  }))

  if (othersCount > 0) {
    items.push({ name: 'Autres', count: othersCount, color: '#94a3b8' })
  }

  if (items.length === 0) {
    return [{ name: 'Aucun tag', count: 1, color: '#e2e8f0' }]
  }

  return items
})

const tagsChartData = computed(() => ({
  labels: tagsDistribution.value.map(t => t.name),
  datasets: [
    {
      data: tagsDistribution.value.map(t => t.count),
      backgroundColor: tagsDistribution.value.map(t => t.color),
      borderWidth: 0,
      hoverOffset: 12
    }
  ]
}))

const tagsChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: true, position: 'right' as const, labels: { usePointStyle: true, padding: 16 } },
    tooltip: { padding: 12, backgroundColor: '#171717' }
  }
}

// ─── Chart F : Distribution Quiz par type (Horizontal Bar) ───
const quizDistributionChartData = computed(() => ({
  labels: quizPerformance.value.distribution.map(d => d.typeLabel),
  datasets: [
    {
      label: 'Taux de réussite (%)',
      data: quizPerformance.value.distribution.map(d => d.correctRate),
      backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
      borderRadius: 6
    }
  ]
}))

const quizDistributionOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: { display: false },
    tooltip: {
      padding: 12,
      backgroundColor: '#171717',
      callbacks: {
        label: (context: any) => ` Réussite : ${context.raw}%`
      }
    }
  },
  scales: {
    x: { max: 100, beginAtZero: true }
  }
}

// ─── Badges & Achievements Gamifiés ───
const achievements = computed(() => [
  {
    id: 'first_note',
    title: 'Première note',
    desc: 'Créer ta toute première note dans le Second Cerveau.',
    icon: FileText,
    achieved: totalNotesCount.value >= 1,
    progress: Math.min(100, Math.round((totalNotesCount.value / 1) * 100)),
    current: totalNotesCount.value,
    target: 1
  },
  {
    id: 'connected_thinker',
    title: 'Penseur connecté',
    desc: 'Tisser 10 liens bidirectionnels entre tes notes.',
    icon: Network,
    achieved: linksCount.value >= 10,
    progress: Math.min(100, Math.round((linksCount.value / 10) * 100)),
    current: linksCount.value,
    target: 10
  },
  {
    id: 'memorizer',
    title: 'Mémorisateur',
    desc: 'Atteindre la maîtrise complète sur 50 flashcards.',
    icon: LibraryBig,
    achieved: masteredCardsCount.value >= 50,
    progress: Math.min(100, Math.round((masteredCardsCount.value / 50) * 100)),
    current: masteredCardsCount.value,
    target: 50
  },
  {
    id: 'journalist',
    title: 'Journaliste',
    desc: 'Maintenir un streak de 7 jours de journaling consécutifs.',
    icon: Calendar,
    achieved: journalStreak.value >= 7,
    progress: Math.min(100, Math.round((journalStreak.value / 7) * 100)),
    current: journalStreak.value,
    target: 7
  },
  {
    id: 'knowledge_architect',
    title: 'Architecte du savoir',
    desc: 'Construire un réseau dense de 100 notes reliées.',
    icon: Layers,
    achieved: totalNotesCount.value >= 100,
    progress: Math.min(100, Math.round((totalNotesCount.value / 100) * 100)),
    current: totalNotesCount.value,
    target: 100
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    desc: 'Obtenir au moins 90% de réussite sur 30 quiz répondus.',
    icon: Zap,
    achieved: quizPerformance.value.totalAnswered >= 30 && quizPerformance.value.overallCorrectRate >= 90,
    progress: Math.min(100, Math.round((quizPerformance.value.totalAnswered / 30) * 100)),
    current: quizPerformance.value.totalAnswered,
    target: 30
  }
])
</script>

<template>
  <div v-if="loading" class="min-h-[500px] flex flex-col items-center justify-center gap-4 animate-fade-in">
    <Loader2 class="h-10 w-10 text-primary-600 animate-spin" />
    <p class="text-xs font-display font-bold text-neutral-400 lowercase tracking-[0.2em] animate-pulse">analyse de ton second cerveau en cours...</p>
  </div>

  <div v-else class="space-y-10 animate-fade-in">
    
    <!-- 1. MÉTRIQUES GLOBALES (4 Cards en haut) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      
      <!-- Card 1: Notes Totales -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Notes Totales</span>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-display font-black text-neutral-900">{{ totalNotesCount }}</span>
          <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            +{{ thisWeekNotesCount }} cette semaine
          </span>
        </div>
      </div>

      <!-- Card 2: Flashcards Maîtrisées -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Flashcards Maîtrisées</span>
          <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <LibraryBig class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-display font-black text-neutral-900">{{ masteredCardsCount }}</span>
          <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {{ masteryRate }}% du total
          </span>
        </div>
      </div>

      <!-- Card 3: Liens Créés -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-purple-300 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Liens Créés</span>
          <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Network class="w-5 h-5" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-display font-black text-neutral-900">{{ linksCount }}</span>
          <span class="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
            Graphe connexe
          </span>
        </div>
      </div>

      <!-- Card 4: Streak Journaling -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Streak Journaling</span>
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame class="w-5 h-5 fill-amber-500" />
          </div>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-display font-black text-neutral-900">{{ journalStreak }}</span>
          <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            {{ journalStreak > 1 ? 'Jours consécutifs' : 'Jour consécutif' }}
          </span>
        </div>
      </div>

    </div>

    <!-- 3. COMPARAISON ET SYNERGIE TÂCHES vs BRAIN -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
        <div class="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles class="w-4 h-4" /> Activité bi-directionnelle
        </div>
        <p class="text-base font-display font-extrabold leading-snug text-neutral-100">
          Cette semaine tu as créé <span class="text-blue-400 underline decoration-blue-500">{{ brainSynergy.tasksCreatedThisWeek }} tâches</span> et <span class="text-emerald-400 underline decoration-emerald-500">{{ brainSynergy.notesCreatedThisWeek }} notes</span> dans ton espace.
        </p>
      </div>

      <div class="bg-gradient-to-br from-blue-900 to-blue-950 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
        <div class="flex items-center gap-2 mb-4 text-blue-300 font-bold text-xs uppercase tracking-wider">
          <LibraryBig class="w-4 h-4" /> Mémorisation active
        </div>
        <p class="text-base font-display font-extrabold leading-snug text-neutral-100">
          Tes notes liées aux projets : <span class="text-amber-300 text-lg font-black">{{ brainSynergy.projectsWithNotesFlashcardRate }}%</span> ont des flashcards interactives.
        </p>
      </div>

      <div class="bg-gradient-to-br from-purple-900 to-purple-950 text-white p-6 rounded-2xl shadow-md flex flex-col justify-between relative overflow-hidden">
        <div class="flex items-center gap-2 mb-4 text-purple-300 font-bold text-xs uppercase tracking-wider">
          <CheckCircle2 class="w-4 h-4" /> Synergie et réussite
        </div>
        <p class="text-base font-display font-extrabold leading-snug text-neutral-100">
          Projets avec notes : <span class="text-emerald-400 text-lg font-black">+{{ brainSynergy.projectCompletionBonus }}%</span> de taux de complétion moyen !
        </p>
      </div>
    </div>

    <!-- 2. GRILLE DE GRAPHIQUES -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Graph A : Notes créées par semaine -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Notes créées par semaine</h3>
            <p class="text-xs text-neutral-400 font-medium">Historique d'écriture sur 12 semaines</p>
          </div>
          <span class="w-3 h-3 rounded-full bg-emerald-600"></span>
        </div>
        <div class="h-64">
          <Line :data="weeklyNotesChartData" :options="weeklyNotesOptions" />
        </div>
      </div>

      <!-- Graph B : Progression Flashcards (Stacked Bar) -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Progression Flashcards</h3>
            <p class="text-xs text-neutral-400 font-medium">Maîtrisées vs En cours vs Dues (par deck)</p>
          </div>
          <div class="flex items-center gap-3 text-[11px] font-bold">
            <span class="flex items-center gap-1 text-emerald-700"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>Maîtrisées</span>
            <span class="flex items-center gap-1 text-blue-700"><span class="w-2 h-2 rounded-full bg-blue-500"></span>En cours</span>
            <span class="flex items-center gap-1 text-red-700"><span class="w-2 h-2 rounded-full bg-red-500"></span>Dues</span>
          </div>
        </div>
        <div class="h-64">
          <Bar :data="flashcardsDeckChartData" :options="flashcardsDeckOptions" />
        </div>
      </div>

      <!-- Graph C : Temps de réponse aux Quiz (Line) -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Temps de réponse aux Quiz</h3>
            <p class="text-xs text-neutral-400 font-medium">Secondes par tentative sur les 15 derniers quiz</p>
          </div>
          <div>
            <span 
              v-if="quizPerformance.trendDirection === 'down'" 
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold"
            >
              <TrendingDown class="w-3.5 h-3.5" /> En baisse ↘ (Amélioration)
            </span>
            <span 
              v-else-if="quizPerformance.trendDirection === 'up'" 
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold"
            >
              <TrendingUp class="w-3.5 h-3.5" /> En hausse ↗
            </span>
            <span 
              v-else 
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-extrabold"
            >
              <Minus class="w-3.5 h-3.5" /> Stable →
            </span>
          </div>
        </div>
        <div class="h-64">
          <Line :data="quizTimeChartData" :options="quizTimeOptions" />
        </div>
      </div>

      <!-- Graph D : Répartition des Tags (Donut) -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Répartition des Tags</h3>
            <p class="text-xs text-neutral-400 font-medium">Les thématiques les plus structurantes de tes notes</p>
          </div>
        </div>
        <div class="h-64 flex items-center justify-center">
          <Doughnut :data="tagsChartData" :options="tagsChartOptions" />
        </div>
      </div>

      <!-- Graph E : Heatmap Journaling (GitHub contributions) -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Heatmap d'activité du Journal</h3>
            <p class="text-xs text-neutral-400 font-medium">Assiduité d'écriture quotidienne sur 180 jours</p>
          </div>
          <div class="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
            <span>Moins</span>
            <span class="w-3 h-3 rounded-sm bg-neutral-100 border border-neutral-200"></span>
            <span class="w-3 h-3 rounded-sm bg-emerald-200"></span>
            <span class="w-3 h-3 rounded-sm bg-emerald-400"></span>
            <span class="w-3 h-3 rounded-sm bg-emerald-600"></span>
            <span class="w-3 h-3 rounded-sm bg-emerald-800"></span>
            <span>Plus</span>
          </div>
        </div>
        <div class="overflow-x-auto pb-2">
          <div class="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[650px] py-1">
            <div 
              v-for="entry in journalHeatmap" 
              :key="entry.date"
              :title="`${entry.date} : ${entry.count} entrée(s), ${entry.words} mots`"
              :class="[
                'w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer',
                entry.level === 0 ? 'bg-neutral-100 border border-neutral-200/60' :
                entry.level === 1 ? 'bg-emerald-200' :
                entry.level === 2 ? 'bg-emerald-400' :
                entry.level === 3 ? 'bg-emerald-600' : 'bg-emerald-800'
              ]"
            ></div>
          </div>
        </div>
      </div>

      <!-- Graph F : Distribution Quiz par type (Horizontal Bar) -->
      <div class="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-display font-black text-neutral-900">Réussite par type de Quiz</h3>
            <p class="text-xs text-neutral-400 font-medium">Pourcentage de bonnes réponses et maîtrise par format</p>
          </div>
          <span class="text-xs font-bold text-neutral-500">{{ quizPerformance.totalAnswered }} quiz complétés au total</span>
        </div>
        <div class="h-56">
          <Bar :data="quizDistributionChartData" :options="quizDistributionOptions" />
        </div>
      </div>

    </div>

    <!-- 4. BADGES & ACHIEVEMENTS GAMIFIÉS -->
    <div class="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-sm space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-display font-black text-neutral-900">Trophées & Achievements du Brain</h3>
          <p class="text-xs text-neutral-400 font-medium mt-1">Débloque tes badges d'érudition en organisant et mémorisant tes connaissances.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div 
          v-for="badge in achievements" 
          :key="badge.id"
          :class="[
            'p-5 rounded-2xl border transition-all flex items-start gap-4 relative overflow-hidden',
            badge.achieved 
              ? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-300 shadow-sm' 
              : 'bg-neutral-50/60 border-neutral-200/80 opacity-75'
          ]"
        >
          <div 
            :class="[
              'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm',
              badge.achieved ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
            ]"
          >
            <component :is="badge.icon" class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1">
              <h4 class="text-sm font-display font-black text-neutral-900 truncate">{{ badge.title }}</h4>
              <span v-if="badge.achieved" class="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 class="w-3 h-3" /> Débloqué
              </span>
              <span v-else class="text-[10px] font-bold text-neutral-400">
                {{ badge.current }}/{{ badge.target }}
              </span>
            </div>
            <p class="text-xs text-neutral-500 leading-relaxed">{{ badge.desc }}</p>
            <div v-if="!badge.achieved" class="mt-3 w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: `${badge.progress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
