<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
)

const props = defineProps<{
  title: string
  value: string | number
  trend: number
  color: string
  chartData: number[]
}>()

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  },
  scales: {
    x: { display: false },
    y: { display: false }
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 2,
      borderColor: props.color,
    },
    point: { radius: 0 }
  }
}

const data = computed(() => ({
  labels: props.chartData.map((_, i) => i),
  datasets: [{
    data: props.chartData,
    fill: true,
    backgroundColor: (context: any) => {
      const chart = context.chart
      const { ctx, chartArea } = chart
      if (!chartArea) return null
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      gradient.addColorStop(0, `${props.color}33`)
      gradient.addColorStop(1, 'transparent')
      return gradient
    },
    borderColor: props.color,
  }]
}))
</script>

<template>
  <div class="bg-white p-8 rounded-xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div class="flex justify-between items-start mb-2">
      <div>
        <p class="text-xs font-bold text-neutral-400 tracking-wide mb-1">{{ title }}</p>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-display font-black text-neutral-900 group-hover:text-primary-600 transition-colors">
            {{ value }}
          </span>
          <span 
            class="text-xs font-bold px-2 py-0.5 rounded-full"
            :class="trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'"
          >
            {{ trend >= 0 ? '+' : '' }}{{ trend }}%
          </span>
        </div>
      </div>
      <div class="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-neutral-300"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </div>
    </div>
    
    <div class="h-20 w-full mt-4">
      <Line :data="data" :options="chartOptions" />
    </div>
  </div>
</template>
