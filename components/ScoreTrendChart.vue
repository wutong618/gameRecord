<template>
  <div class="w-full h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import type { PlayerProfile, Round } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  players: PlayerProfile[]
  rounds: Round[]
}>()

function getColor(key: string) {
  return PLAYER_COLORS[key as keyof typeof PLAYER_COLORS]?.neon || '#fff'
}

const chartData = computed(() => {
  const labels = ['开始', ...props.rounds.map((_, i) => `R${i + 1}`)]

  // 累计分数：按 players 顺序
  const cumulative: number[][] = props.players.map(() => [0])
  for (const round of props.rounds) {
    props.players.forEach((p, i) => {
      const last = cumulative[i][cumulative[i].length - 1] ?? 0
      cumulative[i].push(last + (round.scores[i] ?? 0))
    })
  }

  return {
    labels,
    datasets: props.players.map((p, i) => {
      const c = getColor(p.color)
      return {
        label: p.name,
        data: cumulative[i],
        borderColor: c,
        backgroundColor: c + '30',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    })
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' as const },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#94a3b8', usePointStyle: true, padding: 20 }
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
    x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
  }
}
</script>
