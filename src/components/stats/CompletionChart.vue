<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import './BaseChartConfig'

const props = defineProps<{
  data: { label: string, created: number, completed: number }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.label),
  datasets: [
    {
      label: 'Créées',
      data: props.data.map(d => d.created),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    {
      label: 'Complétées',
      data: props.data.map(d => d.completed),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }
  ]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        boxWidth: 6,
        padding: 20,
        font: {
          weight: 'bold' as const,
          size: 11
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      padding: 12,
      backgroundColor: '#171717',
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13 },
      cornerRadius: 12
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: 'rgba(0,0,0,0.03)'
      },
      ticks: {
        stepSize: 1,
        font: { weight: 'bold' as const }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: { weight: 'bold' as const }
      }
    }
  }
}
</script>

<template>
  <div class="h-[300px]">
    <Line :data="chartData" :options="options" />
  </div>
</template>
