<template>
  <div class="w-full h-64">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import type { Game } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  game: Game
}>()

const chartData = computed(() => {
  const players = props.game.players
  return {
    labels: players.map(p => p.name),
    datasets: [{
      label: '总分',
      data: players.map(p => p.totalScore),
      backgroundColor: players.map(p => PLAYER_COLORS[p.color as keyof typeof PLAYER_COLORS].neon + '80'),
      borderColor: players.map(p => PLAYER_COLORS[p.color as keyof typeof PLAYER_COLORS].neon),
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 40
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
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
      grid: {
        display: false
      },
      ticks: {
        color: '#f8fafc',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      }
    },
    y: {
      grid: {
        color: '#334155'
      },
      ticks: {
        color: '#94a3b8'
      }
    }
  }
}
</script>