<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const props = defineProps<{
  highlightedDates: string[] // Liste de dates formatées en YYYY-MM-DD
  modelValue?: string // Date sélectionnée courante en YYYY-MM-DD
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select-date', value: string): void
}>()

// Date de référence pour le mois actuellement affiché dans le calendrier
const currentMonthDate = ref(new Date())

// Date sélectionnée
const selectedDate = ref(props.modelValue ? parseISO(props.modelValue) : new Date())

// Jours de la semaine en français (traduit manuellement pour propreté)
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Formater le titre du calendrier (ex: "Juillet 2026")
const calendarTitle = computed(() => {
  const formatted = format(currentMonthDate.value, 'MMMM yyyy', { locale: fr })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

// Calculer tous les jours à afficher dans la grille du calendrier (y compris décalage du début du mois)
const daysInMonth = computed(() => {
  const start = startOfMonth(currentMonthDate.value)
  const end = endOfMonth(currentMonthDate.value)
  
  // Obtenir tous les jours du mois
  const days = eachDayOfInterval({ start, end })
  
  // Obtenir le jour de la semaine du premier jour (0 = Dimanche, 1 = Lundi, etc.)
  // On décale pour que Lundi soit le premier (0 = Lundi, 6 = Dimanche)
  let firstDayIndex = getDay(start) - 1
  if (firstDayIndex < 0) firstDayIndex = 6 // Si c'est dimanche, l'index est 6
  
  // Générer des jours vides de rembourrage (padding) au début du mois
  const padding: (Date | null)[] = Array(firstDayIndex).fill(null)
  
  return [...padding, ...days]
})

// Passer au mois précédent
function prevMonth() {
  const newDate = new Date(currentMonthDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentMonthDate.value = newDate
}

// Passer au mois suivant
function nextMonth() {
  const newDate = new Date(currentMonthDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentMonthDate.value = newDate
}

// Sélectionner un jour
function selectDay(day: Date) {
  selectedDate.value = day
  const formattedDate = format(day, 'yyyy-MM-dd')
  emit('update:modelValue', formattedDate)
  emit('select-date', formattedDate)
}

// Vérifier si un jour possède une entrée de journal
function hasEntry(day: Date): boolean {
  const formatted = format(day, 'yyyy-MM-dd')
  return props.highlightedDates.includes(formatted)
}

// Vérifier si c'est aujourd'hui
function isToday(day: Date): boolean {
  return isSameDay(day, new Date())
}

// Vérifier si c'est le jour sélectionné
function isSelected(day: Date): boolean {
  return isSameDay(day, selectedDate.value)
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm select-none">
    <!-- En-tête calendrier -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-neutral-800 font-display">{{ calendarTitle }}</h3>
      
      <div class="flex items-center gap-1">
        <button 
          @click="prevMonth"
          class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button 
          @click="nextMonth"
          class="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Jours de la semaine -->
    <div class="grid grid-cols-7 text-center mb-2">
      <div 
        v-for="day in weekDays" 
        :key="day" 
        class="text-[11px] font-medium text-neutral-400 uppercase tracking-wider py-1"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grille des jours -->
    <div class="grid grid-cols-7 gap-1 text-center">
      <div 
        v-for="(day, idx) in daysInMonth" 
        :key="idx"
        class="relative aspect-square flex flex-col items-center justify-center"
      >
        <button
          v-if="day"
          @click="selectDay(day)"
          :class="[
            'w-8 h-8 rounded-full flex flex-col items-center justify-center text-xs font-medium transition-all relative',
            isSelected(day) 
              ? 'bg-primary-600 text-white shadow-md shadow-primary-100 scale-105' 
              : isToday(day)
                ? 'bg-primary-50 text-primary-700 hover:bg-neutral-100'
                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
          ]"
        >
          {{ day.getDate() }}
          
          <!-- Point vert si une entrée existe -->
          <span 
            v-if="hasEntry(day)"
            :class="[
              'absolute bottom-1 w-1 h-1 rounded-full',
              isSelected(day) ? 'bg-white' : 'bg-primary-500 animate-pulse'
            ]"
          ></span>
        </button>
      </div>
    </div>
  </div>
</template>
