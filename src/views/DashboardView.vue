<template>
  <div v-if="loading" class="min-h-[60vh] flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <Loader2 class="h-12 w-12 text-primary-600 animate-spin" />
      <p class="text-sm font-display font-bold text-neutral-400 animate-pulse lowercase tracking-[0.2em]">initialisation des systèmes...</p>
    </div>
  </div>

  <div v-else id="dashboard-analytics" class="space-y-8 pb-24 animate-fade-in">
    <!-- Top Bar / Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
      <div>
        <h1 class="text-2xl md:text-3xl font-display font-black text-neutral-900 tracking-tight leading-none mb-2 lowercase">analytics dashboard</h1>
        <p class="text-xs md:text-sm text-neutral-400 font-medium">
          Analyse tes performances et optimise ton flux de travail.
        </p>
      </div>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <DashboardDateRangePicker v-model="dateRange" class="w-full sm:w-auto" />
        
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            @click="handleExportExcel"
            variant="outline"
            class="flex-1 sm:flex-none rounded-xl border-neutral-200 font-bold h-11 px-4 text-xs"
          >
            Excel
          </Button>
          <Button 
            @click="handleExportPDF"
            class="flex-1 sm:flex-none bg-neutral-900 hover:bg-black text-white h-11 px-6 rounded-xl font-bold shadow-lg transition-all"
          >
            <TrendingUp class="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
    </div>

    <!-- Row 1: Key Performance Indicators -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AnalyticalKpiCard 
        title="Tâches Complétées" 
        :value="completedInPeriod" 
        :trend="12" 
        color="#2563eb" 
        :chart-data="completedTasksTrend" 
      />
      <AnalyticalKpiCard 
        title="Temps Productif (h)" 
        :value="totalHoursInPeriod" 
        :trend="-5" 
        color="#7c3aed" 
        :chart-data="hoursTrend" 
      />
      <AnalyticalKpiCard 
        title="Taux de Succès" 
        :value="successRateInPeriod + '%'" 
        :trend="8" 
        color="#059669" 
        :chart-data="successRateTrend" 
      />
    </div>

    <!-- Row 2: Main Analytical Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <AnalyticalBarChart 
        title="Direct vs Indirect" 
        subtitle="Répartition de l'effort par type de tâche"
        :labels="directIndirectData.labels"
        :datasets="[
          { label: 'Direct', data: directIndirectData.direct, color: '#3b82f6' },
          { label: 'Indirect', data: directIndirectData.indirect, color: '#93c5fd' }
        ]"
      />
      <AnalyticalLineChart 
        title="Valeur Produite" 
        subtitle="Moyenne de progression par session"
        :labels="valueProducedData.labels"
        :datasets="[
          { label: 'Actuel', data: valueProducedData.current, color: '#7c3aed', fill: true },
          { label: 'Précédent', data: valueProducedData.previous, color: '#ddd' }
        ]"
      />
    </div>

    <!-- Row 3: Distribution & Top Projects -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm">
        <div class="mb-8">
          <h3 class="text-xl font-display font-black text-neutral-900">Distribution</h3>
          <p class="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Par catégories</p>
        </div>
        <div class="relative flex flex-col items-center">
          <!-- Real Donut approximation with border colors -->
          <div 
            class="w-48 h-48 rounded-full border-[16px] flex items-center justify-center"
            :style="{ borderColor: categoriesDistribution[0]?.color || '#f5f5f5' }"
          >
            <div class="text-center">
              <span class="block text-2xl font-display font-black text-neutral-900">{{ categoriesDistribution[0]?.percentage || 0 }}%</span>
              <span class="text-[8px] font-black text-neutral-400 lowercase">{{ categoriesDistribution[0]?.name || 'n/a' }}</span>
            </div>
          </div>
          <div class="mt-8 space-y-3 w-full px-4">
            <div v-for="(cat, i) in categoriesDistribution" :key="i" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: cat.color }"></div>
                <span class="text-xs font-bold text-neutral-600">{{ cat.name }}</span>
              </div>
              <span class="text-xs font-black text-neutral-900">{{ cat.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-xl font-display font-black text-neutral-900">Top Projets</h3>
            <p class="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Activité par équipe</p>
          </div>
          <router-link to="/projects">
            <Button variant="ghost" size="sm" class="text-xs font-bold text-primary-600">View All</Button>
          </router-link>
        </div>
        <div class="space-y-6">
          <div v-for="project in topProjectsList" :key="project.id" class="flex items-center gap-4 group cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center font-black text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
              {{ project.initials }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-sm font-bold text-neutral-900">{{ project.name }}</span>
                <span class="text-xs font-black text-emerald-600">+{{ project.points }}h</span>
              </div>
              <div class="w-full h-1.5 bg-neutral-50 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500 transition-all duration-1000" 
                  :style="{ width: `${project.progress}%` }"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="topProjectsList.length === 0" class="flex flex-col items-center justify-center py-12 text-neutral-400">
            <p class="text-xs font-bold lowercase tracking-widest">aucun projet actif</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Row 4: Trends Over Time -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <AnalyticalLineChart 
        title="Progression des Tâches" 
        subtitle="Historique sur 14 jours"
        :labels="progressionData.labels"
        :datasets="[
          { label: 'Fait', data: progressionData.done, color: '#2563eb' },
          { label: 'Attente', data: progressionData.waiting, color: '#94a3b8' }
        ]"
      />
      <AnalyticalBarChart 
        title="Temps vs Valeur" 
        subtitle="Optimisation des ressources"
        :labels="timeVsValueData.labels"
        :datasets="[
          { label: 'Heures', data: timeVsValueData.hours, color: '#7c3aed' },
          { label: 'Production', data: timeVsValueData.production, color: '#c4b5fd' }
        ]"
      />
    </div>

    <!-- Row 5: Recent Activity & Time Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RecentActivityWidget :tasks="tasksStore.tasks" :time-sessions="tasksStore.timeSessions" />
      <div class="bg-white p-8 rounded-[3rem] border border-neutral-100 shadow-sm">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-display font-black text-neutral-900">Journaux de Temps</h3>
          <Button variant="outline" size="sm" class="rounded-xl font-bold text-[10px] lowercase tracking-widest h-8 px-4">filtrer</Button>
        </div>
        <div class="space-y-4">
          <div v-for="session in tasksStore.timeSessions" :key="session.id" class="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 hover:bg-white hover:shadow-xl hover:shadow-neutral-100 transition-all group cursor-pointer border border-transparent hover:border-neutral-100">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                <Clock class="h-5 w-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-neutral-900">{{ session.task?.title || 'Session de travail' }}</p>
                <p class="text-[10px] font-medium text-neutral-400">
                  {{ session.task?.category?.name || 'Général' }} • {{ formatSessionDuration(session.duration_minutes) }}
                </p>
              </div>
            </div>
            <span class="text-xs font-black text-primary-600">{{ format(new Date(session.started_at), 'HH:mm') }}</span>
          </div>
          <div v-if="tasksStore.timeSessions.length === 0" class="flex flex-col items-center justify-center py-12 text-neutral-400">
            <p class="text-xs font-bold lowercase tracking-widest">aucune session enregistrée</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTasksStore } from '@/stores/tasks.store'
import { useProjectsStore } from '@/stores/projects.store'
import { useUIStore } from '@/stores/ui.store'
import { 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  Flame, 
  Target,
  Plus,
  Loader2,
  TrendingUp,
  Layout,
  Clock,
  ArrowUpRight,
  Filter
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  isToday, 
  isThisWeek, 
  startOfMonth, 
  subDays,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { DateRange } from 'reka-ui'

// Analytical Widgets
import AnalyticalKpiCard from '@/components/dashboard/widgets/AnalyticalKpiCard.vue'
import AnalyticalLineChart from '@/components/dashboard/widgets/AnalyticalLineChart.vue'
import AnalyticalBarChart from '@/components/dashboard/widgets/AnalyticalBarChart.vue'
import RecentActivityWidget from '@/components/dashboard/widgets/RecentActivityWidget.vue'
import DashboardDateRangePicker from '@/components/dashboard/DashboardDateRangePicker.vue'
import { exportToExcel, exportToPDF, formatTasksForExport } from '@/services/export.service'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()
const uiStore = useUIStore()

const loading = ref(true)

// Date Range State
const dateRange = ref({
  start: today(getLocalTimeZone()).subtract({ days: 30 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>

const dateInterval = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return null
  return {
    start: startOfDay(dateRange.value.start.toDate(getLocalTimeZone())),
    end: endOfDay(dateRange.value.end.toDate(getLocalTimeZone()))
  }
})

const handleExportExcel = () => {
  const data = formatTasksForExport(tasksStore.tasks)
  exportToExcel(data, 'UrsUle_Analytics')
}

const handleExportPDF = async () => {
  await exportToPDF('dashboard-analytics', 'UrsUle_Analytics_Report')
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      tasksStore.fetchTasks(),
      projectsStore.fetchProjects(),
      tasksStore.fetchTimeSessions(10)
    ])
  } finally {
    loading.value = false
  }
}

watch(() => authStore.user, (user) => {
  if (user) loadData()
}, { immediate: true })

onMounted(() => {
  if (authStore.user) loadData()
})

// --- Data Calculations ---

// Filtered tasks by date range
const filteredTasks = computed(() => {
  if (!dateInterval.value) return tasksStore.tasks
  return tasksStore.tasks.filter(t => {
    // On utilise soit created_at soit completed_at selon le contexte, 
    // mais pour le filtrage global on se base souvent sur la création ou l'activité
    const date = new Date(t.created_at)
    return isWithinInterval(date, dateInterval.value!)
  })
})

// Helper for dynamic date ranges based on selection
const selectedPeriodDays = computed(() => {
  if (!dateInterval.value) return []
  const days = differenceInDays(dateInterval.value.end, dateInterval.value.start) + 1
  return Array.from({ length: days }, (_, i) => addDays(dateInterval.value!.start, i))
})

const periodLabels = computed(() => {
  if (selectedPeriodDays.value.length > 15) {
    // Si trop de jours, on affiche un label tous les N jours
    return selectedPeriodDays.value.map((d, i) => i % Math.ceil(selectedPeriodDays.value.length / 7) === 0 ? format(d, 'dd/MM') : '')
  }
  return selectedPeriodDays.value.map(d => format(d, 'dd/MM'))
})

// KPI Calculations (Filtered by selected period)
const completedInPeriod = computed(() => {
  if (!dateInterval.value) return 0
  return tasksStore.tasks.filter(t => 
    t.status === 'done' && 
    t.completed_at && 
    isWithinInterval(new Date(t.completed_at), dateInterval.value!)
  ).length
})

const totalHoursInPeriod = computed(() => {
  if (!dateInterval.value) return 0
  const minutes = tasksStore.tasks
    .filter(t => t.completed_at && isWithinInterval(new Date(t.completed_at), dateInterval.value!))
    .reduce((acc, t) => acc + (t.actual_duration_minutes || 0), 0)
  return Math.round(minutes / 60)
})

const successRateInPeriod = computed(() => {
  if (!dateInterval.value) return 0
  const created = filteredTasks.value.length
  const completed = tasksStore.tasks.filter(t => 
    t.status === 'done' && 
    t.completed_at && 
    isWithinInterval(new Date(t.completed_at), dateInterval.value!)
  ).length
  
  if (created === 0) return 0
  return Math.round((completed / created) * 100)
})

// KPI Charts (Based on selected period)
const completedTasksTrend = computed(() => {
  return selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr).length
  })
})

const hoursTrend = computed(() => {
  return selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    const mins = tasksStore.tasks
      .filter(t => t.completed_at && new Date(t.completed_at).toDateString() === dayStr)
      .reduce((acc, t) => acc + (t.actual_duration_minutes || 0), 0)
    return Math.round(mins / 60)
  })
})

const successRateTrend = computed(() => {
  return selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    const created = tasksStore.tasks.filter(t => new Date(t.created_at).toDateString() === dayStr).length
    const completed = tasksStore.tasks.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr).length
    return created > 0 ? Math.round((completed / created) * 100) : 0
  })
})

// Main Charts
const directIndirectData = computed(() => {
  const labels = periodLabels.value
  const direct = selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks.filter(t => t.project_id && t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr).length
  })
  const indirect = selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks.filter(t => !t.project_id && t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr).length
  })
  return { labels, direct, indirect }
})

const valueProducedData = computed(() => {
  const priorityWeight = { urgent: 4, high: 3, normal: 2, low: 1 }
  const current = selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks
      .filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr)
      .reduce((acc, t) => acc + (priorityWeight[t.priority] || 1), 0)
  })
  
  // Previous period of same length
  const periodLength = selectedPeriodDays.value.length
  const previous = selectedPeriodDays.value.map(date => {
    const prevDate = subDays(date, periodLength)
    const dayStr = prevDate.toDateString()
    return tasksStore.tasks
      .filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr)
      .reduce((acc, t) => acc + (priorityWeight[t.priority] || 1), 0)
  })
  
  return { labels: periodLabels.value, current, previous }
})

const categoriesDistribution = computed(() => {
  const counts: Record<string, { count: number, color: string }> = {}
  let total = 0
  
  filteredTasks.value.forEach(task => {
    const catName = task.category?.name || 'Sans catégorie'
    const catColor = task.category?.color || '#94a3b8'
    if (!counts[catName]) counts[catName] = { count: 0, color: catColor }
    counts[catName].count++
    total++
  })
  
  if (total === 0) return []
  
  return Object.entries(counts)
    .map(([name, data]) => ({
      name,
      percentage: Math.round((data.count / total) * 100),
      color: data.color
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3)
})

const topProjectsList = computed(() => {
  return projectsStore.projects.map(project => {
    const projectTasks = filteredTasks.value.filter(t => t.project_id === project.id)
    const completedTasks = projectTasks.filter(t => t.status === 'done').length
    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
    const minutes = projectTasks.reduce((acc, t) => acc + (t.actual_duration_minutes || 0), 0)
    
    return {
      id: project.id,
      name: project.name,
      initials: project.name.substring(0, 2).toUpperCase(),
      progress,
      points: (minutes / 60).toFixed(1)
    }
  }).sort((a, b) => parseFloat(b.points) - parseFloat(a.points)).slice(0, 5)
})

const progressionData = computed(() => {
  const done = selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks.filter(t => t.status === 'done' && t.completed_at && new Date(t.completed_at).toDateString() === dayStr).length
  })
  const waiting = selectedPeriodDays.value.map(date => {
    const dayStr = date.toDateString()
    return tasksStore.tasks.filter(t => t.status !== 'done' && new Date(t.created_at).toDateString() === dayStr).length
  })
  return { labels: periodLabels.value, done, waiting }
})

const timeVsValueData = computed(() => {
  const months = Array.from({ length: 6 }, (_, i) => subDays(new Date(), (5 - i) * 30))
  const labels = months.map(m => format(m, 'MMM', { locale: fr }))
  
  const hours = months.map(m => {
    const start = startOfMonth(m)
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0))
    const mins = tasksStore.tasks
      .filter(t => t.completed_at && isWithinInterval(new Date(t.completed_at), { start, end }))
      .reduce((acc, t) => acc + (t.actual_duration_minutes || 0), 0)
    return Math.round(mins / 60)
  })
  
  const production = months.map(m => {
    const start = startOfMonth(m)
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 1, 0))
    return tasksStore.tasks.filter(t => t.status === 'done' && t.completed_at && isWithinInterval(new Date(t.completed_at), { start, end })).length * 10 
  })
  
  return { labels, hours, production }
})

const formatSessionDuration = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scrollbar styling for a cleaner look */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d4d4d4;
}
</style>



<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
