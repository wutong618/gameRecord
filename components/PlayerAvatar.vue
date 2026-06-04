<template>
  <div class="flex flex-col items-center">
    <div
      class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2"
      :style="avatarStyle"
    >
      {{ player.name }}
    </div>
    <span class="mt-2 text-sm text-slate-300">{{ player.name }}</span>
    <span
      class="text-lg font-bold"
      :class="scoreColor"
    >
      {{ score >= 0 ? '+' : '' }}{{ score }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  player: Player
  score?: number
}>()

const colors = PLAYER_COLORS[props.player.color as keyof typeof PLAYER_COLORS]

const avatarStyle = {
  background: colors.bg,
  borderColor: colors.neon,
  boxShadow: `0 0 15px ${colors.neon}40, 0 0 5px ${colors.neon}`
}

const scoreColor = props.player.totalScore >= 0 ? 'text-neon-green' : 'text-neon-pink'
</script>