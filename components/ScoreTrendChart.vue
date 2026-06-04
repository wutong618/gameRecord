<template>
  <div class="w-full h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { Game } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  game: Game
}>()

const chartData = computed(() => {
  const rounds = props.game.rounds
  const labels = ['开始', ...rounds.map((_, i) => `R${i + 1}`)]

  const getPlayerColor = (colorKey: string) => {
    return PLAYER_COLORS[colorKey as keyof typeof PLAYER_COLORS]?.neon || '#fff'
  }

  // 计算累计分数
  const cumulative = { 0: [0], 1: [0], 2: [0], 3: [0] }
  rounds.forEach(round => {
    const last = {
      0: cumulative[0][cumulative[0].length - 1],
      1: cumulative[1][cumulative[1].length - 1],
      2: cumulative[2][cumulative[2].length - 1],
      3: cumulative[3][cumulative[3].length - 1]
    }
    cumulative[0].push(last[0] + round.scores[0])
    cumulative[1].push(last[1] + round.scores[1])
    cumulative[2].push(last[2] + round.scores[2])
    cumulative[3].push(last[3] + round.scores[3])
  })

  return {
    labels,
    datasets: [
      {
        label: '吴',
        data: cumulative[0],
        borderColor: getPlayerColor('fire-red'),
        backgroundColor: getPlayerColor('fire-red') + '30',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '王',
        data: cumulative[1],
        borderColor: getPlayerColor('deep-sea-blue'),
        backgroundColor: getPlayerColor('deep-sea-blue') + '30',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '来',
        data: cumulative[2],
        borderColor: getPlayerColor('emerald-green'),
        backgroundColor: getPlayerColor('emerald-green') + '30',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: '静',
        data: cumulative[3],
        borderColor: getPlayerColor('night-purple'),
        backgroundColor: getPlayerColor('night-purple') + '30',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#f8fafc',
      borderColor: '#475569',
      borderWidth: 1,
      padding: 12
    }
  },
  scales: {
    x: {
      grid: {
        color: '#334155'
      },
      ticks: {
        color: '#94a3b8'
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