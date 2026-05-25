<script setup lang="ts">
import { computed } from 'vue'
import { format, subDays, eachDayOfInterval, isSameMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const props = defineProps<{
  data: Record<string, number>
}>()

const days = computed(() => {
  const end = new Date()
  const start = subDays(end, 179) // 180 jours
  return eachDayOfInterval({ start, end })
})

const getLevel = (count: number) => {
  if (!count) return 'bg-neutral-50'
  if (count <= 2) return 'bg-green-100'
  if (count <= 5) return 'bg-green-300'
  return 'bg-green-600'
}

// Group days by month for labels
const monthLabels = computed(() => {
  const labels: { name: string, colSpan: number }[] = []
  let currentMonth = -1
  
  days.value.forEach(day => {
    const month = day.getMonth()
    if (month !== currentMonth) {
      labels.push({ name: format(day, 'MMM', { locale: fr }), colSpan: 1 })
      currentMonth = month
    } else {
      labels[labels.length - 1].colSpan++
    }
  })
  
  return labels
})
</script>

<template>
  <div class="w-full overflow-x-auto pb-4 no-scrollbar">
    <div class="min-w-[700px] space-y-4">
      <!-- Month Labels -->
      <div class="flex gap-[2px] text-[10px] font-bold text-neutral-400 uppercase">
        <div v-for="(label, i) in monthLabels" :key="i" :style="{ flex: label.colSpan }" class="pl-1">
          {{ label.name }}
        </div>
      </div>

      <!-- Grid -->
      <div class="flex flex-wrap gap-1">
        <TooltipProvider v-for="day in days" :key="day.toISOString()">
          <Tooltip :delay-duration="0">
            <TooltipTrigger as-child>
              <div 
                class="w-3.5 h-3.5 rounded-[2px] transition-colors hover:ring-2 hover:ring-primary-500/20"
                :class="getLevel(data[format(day, 'yyyy-MM-dd')])"
              ></div>
            </TooltipTrigger>
            <TooltipContent>
              <p class="text-xs font-bold">
                {{ data[format(day, 'yyyy-MM-dd')] || 0 }} tâches le {{ format(day, 'd MMMM yyyy', { locale: fr }) }}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <!-- Legend -->
      <div class="flex items-center gap-4 pt-2">
        <span class="text-[10px] font-bold text-neutral-400 uppercase">Moins</span>
        <div class="flex gap-1">
          <div class="w-3 h-3 bg-neutral-50 rounded-[2px]"></div>
          <div class="w-3 h-3 bg-green-100 rounded-[2px]"></div>
          <div class="w-3 h-3 bg-green-300 rounded-[2px]"></div>
          <div class="w-3 h-3 bg-green-600 rounded-[2px]"></div>
        </div>
        <span class="text-[10px] font-bold text-neutral-400 uppercase">Plus</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
