<script setup lang="ts">
import { computed } from 'vue'
import { subDays, startOfWeek, addDays, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{
  entriesDates: string[] // Liste de dates formatées en YYYY-MM-DD
}>()

// Nombre de jours à afficher (environ 1 an = 53 semaines * 7 jours = 371 jours)
const DAYS_TO_SHOW = 371

// Générer la grille d'activité
const activityGrid = computed(() => {
  const grid: { date: Date; dateStr: string; count: number; level: number }[] = []
  
  // Date de fin (aujourd'hui)
  const endDate = new Date()
  
  // Aller en arrière jusqu'au début de la semaine correspondante il y a 1 an
  const startDate = startOfWeek(subDays(endDate, DAYS_TO_SHOW), { weekStartsOn: 1 })
  
  // Parcourir tous les jours de l'intervalle
  let currentDate = startDate
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const hasWritten = props.entriesDates.includes(dateStr)
    
    // Déterminer le niveau de contribution (0 = aucun, 1 = écrit)
    const count = hasWritten ? 1 : 0
    const level = hasWritten ? 3 : 0 // on peut enrichir si on a plus d'indicateurs (ex: nombre de mots)

    grid.push({
      date: new Date(currentDate),
      dateStr,
      count,
      level
    })
    
    currentDate = addDays(currentDate, 1)
  }
  
  return grid
})

// Découper la grille en semaines de 7 jours pour l'affichage en colonnes
const weeks = computed(() => {
  const result: typeof activityGrid.value[] = []
  const days = activityGrid.value
  
  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7))
  }
  
  return result
})

// Month labels (pour l'affichage en haut de la heatmap)
const monthLabels = computed(() => {
  const labels: { text: string; colIndex: number }[] = []
  let lastMonth = -1
  
  weeks.value.forEach((week, colIdx) => {
    // Regarder le premier jour valide de la semaine
    const firstDay = week.find(d => d !== undefined)
    if (firstDay) {
      const month = firstDay.date.getMonth()
      if (month !== lastMonth) {
        labels.push({
          text: format(firstDay.date, 'MMM', { locale: fr }),
          colIndex: colIdx
        })
        lastMonth = month
      }
    }
  })
  
  return labels
})

// Classes CSS pour chaque niveau de contribution
const levelClasses = [
  'bg-neutral-100 hover:bg-neutral-200 border-transparent', // Level 0
  'bg-primary-100 hover:bg-primary-200 border-primary-200', // Level 1 (unused)
  'bg-primary-300 hover:bg-primary-400 border-primary-400', // Level 2 (unused)
  'bg-primary-500 hover:bg-primary-600 border-primary-600 shadow-sm shadow-primary-100', // Level 3 (Écrit)
]
</script>

<template>
  <div class="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm overflow-hidden select-none">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-400">Heatmap d'Activité annuelle</h4>
      <span class="text-[11px] text-neutral-400 font-medium">Légende : </span>
      <div class="flex items-center gap-1">
        <span class="text-[10px] text-neutral-400 mr-1">Vide</span>
        <span class="w-2.5 h-2.5 rounded bg-neutral-100 border border-neutral-200"></span>
        <span class="w-2.5 h-2.5 rounded bg-primary-500 border border-primary-600"></span>
        <span class="text-[10px] text-neutral-400 ml-1">Écrit</span>
      </div>
    </div>

    <!-- Container horizontal scrollable si l'écran est petit -->
    <div class="overflow-x-auto pb-2 scrollbar-none">
      <div class="flex flex-col min-w-[620px]">
        <!-- Mois en-tête -->
        <div class="h-5 relative text-[10px] text-neutral-400 font-medium ml-8">
          <span 
            v-for="(label, idx) in monthLabels" 
            :key="idx"
            class="absolute capitalize"
            :style="{ left: `${label.colIndex * 12}px` }"
          >
            {{ label.text }}
          </span>
        </div>

        <div class="flex gap-1.5">
          <!-- Jours étiquettes (gauche) -->
          <div class="flex flex-col justify-between text-[9px] text-neutral-400 font-bold w-6 h-[86px] pt-1">
            <span>Lun</span>
            <span>Mer</span>
            <span>Ven</span>
            <span>Dim</span>
          </div>

          <!-- Grille Heatmap -->
          <div class="flex gap-1">
            <div 
              v-for="(week, weekIdx) in weeks" 
              :key="weekIdx"
              class="flex flex-col gap-1"
            >
              <div 
                v-for="day in week" 
                :key="day.dateStr"
                :class="[
                  'w-2.5 h-2.5 rounded border transition-all duration-150',
                  levelClasses[day.level]
                ]"
                :title="`${format(day.date, 'd MMMM yyyy', { locale: fr })} : ${day.count > 0 ? 'Entrée rédigée' : 'Aucune entrée'}`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Masquer les barres de défilement */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
