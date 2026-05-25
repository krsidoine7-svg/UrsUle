<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  title: string
  subtitle?: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
    secondaryColor?: string
  }[]
}>()

const chartData = {
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    label: ds.label,
    data: ds.data,
    backgroundColor: ds.color,
    borderRadius: 8,
    borderSkipped: false,
    barThickness: 12,
  }))
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        font: { family: 'Inter', weight: 700, size: 10 }
      }
    },
    tooltip: {
      backgroundColor: '#171717',
      padding: 12,
      cornerRadius: 12,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: 600 }, color: '#a3a3a3' }
    },
    y: {
      grid: { color: '#f5f5f5', drawTicks: false },
      border: { display: false },
      ticks: { font: { size: 10, weight: 600 }, color: '#a3a3a3', padding: 10 }
    }
  }
} as const
</script>

<template>
  <div class="bg-white p-8 rounded-[1.8rem] border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full">
    <div class="flex flex-col mb-8">
      <h3 class="text-xl font-display font-black text-neutral-900">{{ title }}</h3>
      <p v-if="subtitle" class="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">{{ subtitle }}</p>
    </div>
    <div class="flex-1 min-h-[300px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
