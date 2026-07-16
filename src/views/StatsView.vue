<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { statsService } from '@/services/stats.service'
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subDays,
  startOfDay,
  endOfDay
} from 'date-fns'

// Chart Components
import CompletionChart from '@/components/stats/CompletionChart.vue'
import CategoryChart from '@/components/stats/CategoryChart.vue'
import MoodChart from '@/components/stats/MoodChart.vue'
import HeatmapCalendar from '@/components/stats/HeatmapCalendar.vue'
import BrainStats from '@/components/brain/stats/BrainStats.vue'
import DashboardDateRangePicker from '@/components/dashboard/DashboardDateRangePicker.vue'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { Brain } from 'lucide-vue-next'

import { useExport } from '@/composables/useExport'
import { useToast } from '@/components/ui/toast/use-toast'

const authStore = useAuthStore()
const { toast } = useToast()
const { exportToPDF } = useExport()
const loading = ref(true)
const activeTab = ref<'tasks' | 'brain'>('tasks')

// Date Range State (Last 30 days by default)
const dateRange = ref({
  start: today(getLocalTimeZone()).subtract({ days: 30 }),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>

const stats = ref({
  completionData: [] as any[],
  categoryData: [] as any[],
  moodData: [] as any[],
  heatmapData: {} as Record<string, number>,
  totalTime: 0,
  createdCount: 0,
  completedCount: 0,
  rate: 0
})

const dateInterval = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return null
  return {
    from: startOfDay(dateRange.value.start.toDate(getLocalTimeZone())),
    to: endOfDay(dateRange.value.end.toDate(getLocalTimeZone()))
  }
})

async function loadStats() {
  if (!authStore.user) {
    loading.value = false
    return
  }
  
  loading.value = true
  try {
    const interval = dateInterval.value
    if (!interval) return
    const { from, to } = interval
    const userId = authStore.user.id

    const [completion, categories, moods, heatmap, time] = await Promise.all([
      statsService.getIntervalStats(userId, from, to),
      statsService.getCategoryDistribution(userId, from, to),
      statsService.getMoodDistribution(userId, from, to),
      statsService.getHeatmapData(userId),
      statsService.getTotalTime(userId, from, to)
    ])

    const created = completion.reduce((acc, d) => acc + d.created, 0)
    const completed = completion.reduce((acc, d) => acc + d.completed, 0)

    stats.value = {
      completionData: completion,
      categoryData: categories,
      moodData: moods,
      heatmapData: heatmap,
      totalTime: time,
      createdCount: created,
      completedCount: completed,
      rate: created > 0 ? Math.round((completed / created) * 100) : 0
    }
  } catch (e: any) {
    console.error('Failed to load stats:', e)
    toast({ 
      title: 'Erreur de chargement', 
      description: 'Certaines statistiques n\'ont pas pu être récupérées.',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  toast({ title: 'Génération du rapport...', description: 'Merci de patienter quelques secondes.' })
  try {
    await exportToPDF('stats-content', 'ursule-statistiques')
    toast({ title: 'Export réussi ✅' })
  } catch (e: any) {
    toast({ title: 'Erreur d\'export', description: e.message, variant: 'destructive' })
  }
}

watch(() => authStore.user, (newUser) => {
  if (newUser) loadStats()
}, { immediate: true })

watch(dateRange, () => {
  if (dateRange.value.start && dateRange.value.end) {
    loadStats()
  }
}, { deep: true })
</script>

<template>
  <div id="stats-content" class="space-y-10 pb-20 animate-fade-in bg-neutral-50/30 p-8 rounded-[1.25rem]">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-display font-black text-neutral-900 tracking-tight">Statistiques</h1>
        <p class="text-neutral-500 font-medium">Analyse tes performances et ton humeur.</p>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3">
        <DashboardDateRangePicker v-model="dateRange" class="w-full sm:w-auto" />
        <Button 
          variant="outline" 
          class="h-12 rounded-2xl font-bold border-neutral-100 bg-white"
          @click="handleExport"
        >
          <Download class="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>
    </div>

    <!-- Sélecteur d'onglets (Tâches & Productivité vs UrsUle Brain) -->
    <div class="flex items-center gap-2 p-1.5 bg-neutral-200/60 rounded-2xl w-fit">
      <button 
        @click="activeTab = 'tasks'"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all',
          activeTab === 'tasks' 
            ? 'bg-white text-neutral-900 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-900'
        ]"
      >
        <Activity class="w-4 h-4 text-blue-600" />
        Tâches & Productivité
      </button>
      <button 
        @click="activeTab = 'brain'"
        :class="[
          'flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all',
          activeTab === 'brain' 
            ? 'bg-white text-neutral-900 shadow-sm' 
            : 'text-neutral-500 hover:text-neutral-900'
        ]"
      >
        <Brain class="w-4 h-4 text-emerald-600" />
        UrsUle Brain (PKM)
      </button>
    </div>

    <!-- Contenu Tâches & Productivité -->
    <div v-if="activeTab === 'tasks'" class="space-y-10">
      <!-- Summary Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <!-- Tâches créées -->
      <div class="bg-white p-5 md:p-8 rounded-3xl border border-neutral-100 shadow-sm flex items-center md:flex-col md:items-start gap-4 md:gap-0">
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 md:mb-6 shrink-0">
          <Activity class="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <p class="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-none mb-1">{{ stats.createdCount }}</p>
          <p class="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Tâches créées</p>
        </div>
      </div>

      <!-- Tâches terminées -->
      <div class="bg-white p-5 md:p-8 rounded-3xl border border-neutral-100 shadow-sm flex items-center md:flex-col md:items-start gap-4 md:gap-0">
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 md:mb-6 shrink-0">
          <CheckCircle2 class="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <p class="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-none mb-1">{{ stats.completedCount }}</p>
          <p class="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Tâches terminées</p>
        </div>
      </div>

      <!-- Taux de réussite -->
      <div class="bg-white p-5 md:p-8 rounded-3xl border border-neutral-100 shadow-sm flex items-center md:flex-col md:items-start gap-4 md:gap-0">
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 md:mb-6 shrink-0">
          <TrendingUp class="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <p class="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-none mb-1">{{ stats.rate }}%</p>
          <p class="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Taux de réussite</p>
        </div>
      </div>

      <!-- Temps total -->
      <div class="bg-white p-5 md:p-8 rounded-3xl border border-neutral-100 shadow-sm flex items-center md:flex-col md:items-start gap-4 md:gap-0">
        <div class="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 md:mb-6 shrink-0">
          <Clock class="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <p class="text-3xl md:text-5xl font-display font-black text-neutral-900 leading-none mb-1">{{ stats.totalTime }}h</p>
          <p class="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-widest">Temps total</p>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Loader2 class="h-10 w-10 text-primary-600 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Completion Chart -->
      <div class="bg-white p-8 rounded-[1.25rem] border border-neutral-100 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <LineChart class="h-5 w-5 text-primary-500" />
          <h3 class="text-xl font-display font-bold">Tâches par jour</h3>
        </div>
        <CompletionChart :data="stats.completionData" />
      </div>

      <!-- Category Chart -->
      <div class="bg-white p-8 rounded-[1.25rem] border border-neutral-100 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <PieChart class="h-5 w-5 text-indigo-500" />
          <h3 class="text-xl font-display font-bold">Répartition par catégorie</h3>
        </div>
        <CategoryChart :data="stats.categoryData" />
      </div>

      <!-- Mood Chart -->
      <div class="bg-white p-8 rounded-[1.25rem] border border-neutral-100 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <Activity class="h-5 w-5 text-orange-500" />
          <h3 class="text-xl font-display font-bold">Ton humeur post-tâche</h3>
        </div>
        <MoodChart :data="stats.moodData" />
      </div>

      <!-- Heatmap -->
      <div class="bg-white p-8 rounded-[1.25rem] border border-neutral-100 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <Calendar class="h-5 w-5 text-green-500" />
          <h3 class="text-xl font-display font-bold">Ta régularité (180j)</h3>
        </div>
        <HeatmapCalendar :data="stats.heatmapData" />
      </div>
    </div>
    </div>

    <!-- Contenu UrsUle Brain (PKM) -->
    <BrainStats v-else />
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
