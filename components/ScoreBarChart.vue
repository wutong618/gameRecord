<template>
  <div class="w-full h-64">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { User } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  players: User[]
  totalScores: number[]
}>()

const chartData = computed(() => ({
  labels: props.players.map(p => p.nickname || '?'),
  datasets: [{
    label: '总分',
    data: props.totalScores,
    backgroundColor: props.players.map(p => {
      const c = PLAYER_COLORS[(p.avatarColor || 'fire-red') as keyof typeof PLAYER_COLORS]
      return c ? c.neon + '80' : '#ffffff80'
    }),
    borderColor: props.players.map(p => {
      const c = PLAYER_COLORS[(p.avatarColor || 'fire-red') as keyof typeof PLAYER_COLORS]
      return c ? c.neon : '#ffffff'
    }),
    borderWidth: 2,
    borderRadius: 8,
    barThickness: 40
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      borderColor: '#475569',
      borderWidth: 1,
      padding: 12,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#f8fafc', font: { size: 14, weight: 'bold' as const } }
    },
    y: {
      grid: { color: '#334155' },
      ticks: { color: '#94a3b8' }
    }
  }
}
</script>
