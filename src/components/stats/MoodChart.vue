<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import './BaseChartConfig'

const props = defineProps<{
  data: { id: string, label: string, count: number }[]
}>()

const moodConfigs: Record<string, { color: string, emoji: string }> = {
  happy: { color: '#22c55e', emoji: '😊' },
  super_productive: { color: '#3b82f6', emoji: '🚀' },
  enriching: { color: '#f59e0b', emoji: '💡' },
  neutral: { color: '#94a3b8', emoji: '😐' },
  too_hard: { color: '#f97316', emoji: '😤' },
  stressful: { color: '#ef4444', emoji: '😰' },
  boring: { color: '#6366f1', emoji: '😴' },
  nothing_learned: { color: '#8b5cf6', emoji: '🤔' }
}

const chartData = computed(() => ({
  labels: props.data.map(d => `${moodConfigs[d.id]?.emoji || ''} ${d.label}`),
  datasets: [
    {
      data: props.data.map(d => d.count),
      backgroundColor: props.data.map(d => moodConfigs[d.id]?.color || '#cbd5e1'),
      borderRadius: 8,
      barThickness: 24,
    }
  ]
}))

const options = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#171717',
      cornerRadius: 12,
      padding: 12
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { display: false },
      ticks: { stepSize: 1, font: { weight: 'bold' as const } }
    },
    y: {
      grid: { display: false },
      ticks: { font: { weight: 'bold' as const, size: 13 } }
    }
  }
}
</script>

<template>
  <div class="h-[400px]">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
