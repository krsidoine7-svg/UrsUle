<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  title: string
  subtitle?: string
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
    fill?: boolean
  }[]
}>()

const chartData = {
  labels: props.labels,
  datasets: props.datasets.map(ds => ({
    label: ds.label,
    data: ds.data,
    borderColor: ds.color,
    backgroundColor: ds.fill ? `${ds.color}11` : 'transparent',
    fill: ds.fill,
    tension: 0.4,
    borderWidth: 3,
    pointRadius: 0,
    pointHoverRadius: 6,
    pointBackgroundColor: ds.color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
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
      titleFont: { family: 'Sora', size: 12, weight: 'bold' as const },
      bodyFont: { family: 'Inter', size: 12 },
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
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
