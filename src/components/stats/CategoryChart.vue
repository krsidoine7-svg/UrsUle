<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import './BaseChartConfig'

const props = defineProps<{
  data: { count: number, name: string, color: string }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.name),
  datasets: [
    {
      data: props.data.map(d => d.count),
      backgroundColor: props.data.map(d => d.color),
      borderWidth: 0,
      hoverOffset: 20
    }
  ]
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: { weight: 'bold' as const, size: 12 }
      }
    },
    tooltip: {
      padding: 12,
      backgroundColor: '#171717',
      cornerRadius: 12,
      callbacks: {
        label: (context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const value = context.raw
          const percentage = Math.round((value / total) * 100)
          return ` ${context.label}: ${value} (${percentage}%)`
        }
      }
    }
  }
}
</script>

<template>
  <div class="h-[350px]">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>
