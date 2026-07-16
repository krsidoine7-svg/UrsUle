<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotesStore } from '@/stores/notes.store'
import MiniCalendar from '@/components/brain/notes/MiniCalendar.vue'
import NoteEditor from '@/components/brain/notes/NoteEditor.vue'
import JournalHeatmap from '@/components/brain/notes/JournalHeatmap.vue'
import { format, subDays, startOfDay, endOfDay, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '@/services/supabase'
import { Calendar, Award, BookOpen, AlertCircle, FileText, CheckCircle } from 'lucide-vue-next'
import { playSuccessChime } from '@/utils/sound'
import { useToast } from '@/components/ui/toast/use-toast'
import { exportToPDF } from '@/services/export.service'

const notesStore = useNotesStore()
const { toast } = useToast()
const router = useRouter()

// Date actuellement sélectionnée (format YYYY-MM-DD)
const selectedDateStr = ref(format(new Date(), 'yyyy-MM-dd'))

// Entrée de journal courante
const activeJournalNote = ref<any>(null)
const editorHtmlContent = ref('')

// Chargement et états
const loadingEntry = ref(false)
const showReminderBanner = ref(false)

// Liste des dates ayant des entrées de journal
const highlightedDates = computed(() => {
  return notesStore.journalEntries
    .map(n => n.journal_date)
    .filter((d): d is string => !!d)
})

// Streak de jours consécutifs d'écriture
const journalStreak = computed(() => {
  const dates = highlightedDates.value
    .map(d => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime()) // Tri descendant (plus récent en premier)

  if (dates.length === 0) return 0

  let streak = 0
  let referenceDate = new Date() // Commencer à aujourd'hui
  
  // Si on n'a pas écrit aujourd'hui, vérifier si on a écrit hier pour maintenir le streak actif
  const todayStr = format(referenceDate, 'yyyy-MM-dd')
  const yesterdayStr = format(subDays(referenceDate, 1), 'yyyy-MM-dd')
  
  const hasWrittenToday = highlightedDates.value.includes(todayStr)
  const hasWrittenYesterday = highlightedDates.value.includes(yesterdayStr)
  
  if (!hasWrittenToday && !hasWrittenYesterday) {
    return 0
  }

  // Utiliser la date du dernier journal écrit comme point de départ
  if (hasWrittenToday) {
    referenceDate = parseISO(todayStr)
  } else {
    referenceDate = parseISO(yesterdayStr)
  }

  let idx = 0
  while (idx < dates.length) {
    const diff = differenceInDays(referenceDate, dates[idx])
    if (diff === 0) {
      streak++
      referenceDate = subDays(referenceDate, 1) // Reculer d'un jour
      idx++
    } else if (diff > 0) {
      // Trou / Interruption dans les jours
      break
    } else {
      // Ignorer les dates dans le futur par rapport à la référence
      idx++
    }
  }

  return streak
})

// Mots écrits cette semaine
const weeklyWordCount = computed(() => {
  const oneWeekAgo = subDays(new Date(), 7)
  return notesStore.journalEntries
    .filter(n => new Date(n.created_at) >= oneWeekAgo)
    .reduce((sum, n) => sum + (n.word_count || 0), 0)
})

// Titre formaté en français pour la note active
const formattedJournalTitle = computed(() => {
  const parsedDate = parseISO(selectedDateStr.value)
  const formatted = format(parsedDate, 'eeee d MMMM yyyy', { locale: fr })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

// ─── Chargement / Création du Journal ────────────────────────────────

async function loadJournalForDate(dateStr: string) {
  loadingEntry.value = true
  activeJournalNote.value = null
  editorHtmlContent.value = ''
  
  try {
    const note = await notesStore.getJournalEntryForDate(dateStr)
    if (note) {
      activeJournalNote.value = note
      editorHtmlContent.value = note.content || ''
    } else {
      // Aucun journal pour cette date, on affiche un écran d'invite ou on le crée
      activeJournalNote.value = null
    }
  } catch (err: any) {
    console.error('Erreur de chargement du journal:', err)
  } finally {
    loadingEntry.value = false
  }
}

// Récupérer les tâches complétées la veille pour les injecter dans le template
async function getYesterdayCompletedTasks(): Promise<string[]> {
  try {
    const yesterday = subDays(new Date(), 1)
    const start = startOfDay(yesterday).toISOString()
    const end = endOfDay(yesterday).toISOString()

    const { data, error } = await supabase
      .from('tasks')
      .select('title')
      .eq('status', 'done')
      .is('deleted_at', null)
      .gte('completed_at', start)
      .lte('completed_at', end)

    if (error) throw error
    return (data || []).map(t => t.title)
  } catch (e) {
    console.error('Failed to fetch completed tasks for journal template:', e)
    return []
  }
}

// Initialiser une nouvelle entrée de journal avec le template statique
async function initJournalForDate(dateStr: string) {
  loadingEntry.value = true
  try {
    const isTodaySelected = dateStr === format(new Date(), 'yyyy-MM-dd')
    let tasksListStr = '<li>Aucune tâche complétée hier.</li>'
    
    if (isTodaySelected) {
      const completedTasks = await getYesterdayCompletedTasks()
      if (completedTasks.length > 0) {
        tasksListStr = completedTasks.map(t => `<li>${t}</li>`).join('')
      }
    }

    const defaultContent = `
      <h3>🌅 Ce que je vais accomplir aujourd'hui</h3>
      <ul>
        <li></li>
      </ul>
      <h3>✅ Ce que j'ai fait</h3>
      <ul>
        ${tasksListStr}
      </ul>
      <h3>💡 Ce que j'ai appris</h3>
      <ul>
        <li></li>
      </ul>
      <h3>😊 Mon humeur du jour</h3>
      <ul>
        <li></li>
      </ul>
      <h3>🎯 Objectif de demain</h3>
      <ul>
        <li></li>
      </ul>
    `

    const parsedDate = parseISO(dateStr)
    const title = format(parsedDate, 'eeee d MMMM yyyy', { locale: fr })
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1)

    const newNote = await notesStore.createJournalEntryForDate(dateStr, defaultContent, capitalizedTitle)
    activeJournalNote.value = newNote
    editorHtmlContent.value = newNote.content || ''
    
    // Jouer une petite sonnerie de succès
    playSuccessChime()
    
    toast({
      title: 'Journal initialisé ! ✍️',
      description: 'Prenez un instant pour réfléchir et planifier votre journée.'
    })
  } catch (err: any) {
    toast({
      title: 'Erreur',
      description: 'Impossible d\'initialiser le journal : ' + err.message,
      variant: 'destructive'
    })
  } finally {
    loadingEntry.value = false
  }
}

// Sauvegarde automatique
async function handleSaveContent() {
  if (!activeJournalNote.value) return
  
  // Calcul du nombre de mots rapide
  const textContent = editorHtmlContent.value.replace(/<[^>]*>/g, ' ').trim()
  const words = textContent ? textContent.split(/\s+/).length : 0

  try {
    await notesStore.updateNote(activeJournalNote.value.id, {
      content: editorHtmlContent.value,
      word_count: words,
      read_time_minutes: Math.ceil(words / 200)
    })
  } catch (err: any) {
    console.error('Erreur d\'autosave du journal:', err)
  }
}

// Vérifier si le journal d'hier est manquant pour lancer l'alerte douce
function checkYesterdayJournalReminder() {
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const hasEntryYesterday = notesStore.journalEntries.some(
    n => n.journal_date === yesterdayStr && !n.deleted_at
  )
  showReminderBanner.value = !hasEntryYesterday
}

// Redirection vers la recherche globale avec filtre journal
function handleSearchJournal() {
  notesStore.searchQuery = 'type:journal '
  router.push('/brain')
}

// Exporter le journal du jour en Markdown
function exportAsMarkdown() {
  if (!activeJournalNote.value) return
  const textContent = editorHtmlContent.value.replace(/<[^>]*>/g, '\n').trim()
  const fileContent = `# ${activeJournalNote.value.title}\n\nDate: ${activeJournalNote.value.journal_date}\n\n${textContent}`
  const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${activeJournalNote.value.journal_date}-journal.md`
  link.click()
  URL.revokeObjectURL(url)
}

// Exporter le journal du jour en PDF
async function exportAsPDF() {
  if (!activeJournalNote.value) return
  toast({
    title: 'Génération du PDF... 📄',
    description: 'Veuillez patienter pendant la création du document.'
  })
  try {
    await exportToPDF('journal-editor-content', `Journal_${activeJournalNote.value.journal_date}`)
  } catch (err: any) {
    toast({
      title: 'Erreur d\'export',
      description: err.message,
      variant: 'destructive'
    })
  }
}

// Écouter les changements de date sélectionnée sur le calendrier
watch(selectedDateStr, (newDate) => {
  loadJournalForDate(newDate)
})

onMounted(async () => {
  await notesStore.fetchNotes()
  await loadJournalForDate(selectedDateStr.value)
  checkYesterdayJournalReminder()
})
</script>

<template>
  <div class="h-full flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
    
    <!-- Colonne Gauche : Mini-Calendrier et Statistiques -->
    <div class="w-full md:w-80 shrink-0 flex flex-col gap-6 overflow-y-auto pr-1">
      
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-neutral-900 leading-none mb-1">Journal</h2>
          <p class="text-xs text-neutral-400 font-medium">Réflexions & Planification</p>
        </div>
      </div>

      <!-- Mini Calendrier -->
      <MiniCalendar 
        v-model="selectedDateStr"
        :highlightedDates="highlightedDates"
      />

      <!-- Statistiques et Streaks -->
      <div class="bg-neutral-50 rounded-2xl border border-neutral-100 p-5 flex flex-col gap-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Statistiques de Réflexion</h4>
        
        <!-- Streak -->
        <div class="flex items-center gap-4">
          <div class="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <Award class="w-5 h-5" />
          </div>
          <div>
            <div class="text-lg font-bold text-neutral-800 leading-none mb-0.5">
              {{ journalStreak }} {{ journalStreak > 1 ? 'jours' : 'jour' }}
            </div>
            <p class="text-xs text-neutral-400 font-medium">Streak d'écriture consécutif</p>
          </div>
        </div>

        <!-- Compteur de mots hebdomadaire -->
        <div class="flex items-center gap-4">
          <div class="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
            <FileText class="w-5 h-5" />
          </div>
          <div>
            <div class="text-lg font-bold text-neutral-800 leading-none mb-0.5">
              {{ weeklyWordCount }} mots
            </div>
            <p class="text-xs text-neutral-400 font-medium">Écrits ces 7 derniers jours</p>
          </div>
        </div>
      </div>

      <!-- Recherche rapide bouton -->
      <button 
        @click="handleSearchJournal"
        class="w-full py-3 px-4 bg-white border border-neutral-200 hover:border-primary-500 text-neutral-600 hover:text-primary-600 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
      >
        Rechercher dans le Journal
      </button>

      <!-- Heatmap d'Activité -->
      <JournalHeatmap :entriesDates="highlightedDates" class="shrink-0" />

    </div>

    <!-- Colonne Droite : Éditeur principal -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-2xl border border-neutral-100 shadow-sm">
      
      <!-- Bannière de rappel d'hier -->
      <div 
        v-if="showReminderBanner" 
        class="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center justify-between gap-4 shrink-0 transition-all duration-300"
      >
        <div class="flex items-center gap-2.5 text-amber-800 text-sm">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>Tu n'as pas écrit d'entrée de journal hier. Veux-tu en rédiger une ?</span>
        </div>
        <div class="flex items-center gap-2">
          <button 
            @click="selectedDateStr = format(subDays(new Date(), 1), 'yyyy-MM-dd'); showReminderBanner = false"
            class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Rédiger hier
          </button>
          <button 
            @click="showReminderBanner = false"
            class="text-amber-500 hover:text-amber-700 text-xs font-medium px-2 py-1"
          >
            Ignorer
          </button>
        </div>
      </div>

      <!-- Barre d'outils En-tête de l'éditeur -->
      <div class="px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h3 class="text-lg font-bold text-neutral-800 leading-tight">{{ formattedJournalTitle }}</h3>
          <p v-if="activeJournalNote" class="text-xs text-neutral-400 font-medium">
            Dernière mise à jour à {{ format(new Date(activeJournalNote.updated_at), 'HH:mm') }}
          </p>
        </div>

        <div class="flex items-center gap-2" v-if="activeJournalNote">
          <button 
            @click="exportAsMarkdown"
            class="px-3 py-1.5 border border-neutral-200 hover:border-primary-500 rounded-xl text-xs font-semibold text-neutral-600 hover:text-primary-600 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            Exporter .md
          </button>
          <button 
            @click="exportAsPDF"
            class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-md shadow-primary-100 hover:shadow-lg"
          >
            Exporter PDF
          </button>
        </div>
      </div>

      <!-- Zone de l'éditeur -->
      <div class="flex-1 overflow-hidden p-6 relative flex flex-col justify-between">
        
        <div v-if="loadingEntry" class="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div class="flex flex-col items-center gap-3">
            <div class="h-9 w-9 rounded-lg bg-primary-600 animate-spin"></div>
            <span class="text-xs text-neutral-400 font-medium">Chargement de l'entrée...</span>
          </div>
        </div>

        <!-- Éditeur actif -->
        <div v-if="activeJournalNote" id="journal-editor-content" class="flex-1 h-full flex flex-col overflow-hidden">
          <NoteEditor 
            v-model="editorHtmlContent"
            @save="handleSaveContent"
            class="flex-1 h-full min-h-0"
          />
        </div>

        <!-- Aucun journal (Invite d'initialisation) -->
        <div 
          v-else 
          class="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto"
        >
          <div class="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 mb-5 shadow-inner">
            <Calendar class="w-7 h-7" />
          </div>
          
          <h4 class="text-base font-bold text-neutral-800 mb-2">
            Pas d'entrée de journal pour ce jour
          </h4>
          <p class="text-sm text-neutral-400 font-medium mb-6 leading-relaxed">
            Réglez vos objectifs, notez vos réflexions et suivez vos accomplissements pour cette journée.
          </p>
          
          <button 
            @click="initJournalForDate(selectedDateStr)"
            class="py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-100 hover:shadow-lg transition-all"
          >
            Créer le Journal de ce jour
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
/* Scrollbar ultra fine pour la liste de gauche */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 4px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #d4d4d4;
}
</style>
