<template>
  <div
    class="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 hover:border-neon-blue/50 transition-all cursor-pointer"
    @click="$emit('play', game)"
  >
    <div class="flex justify-between items-start mb-3">
      <div>
        <h4 class="text-white font-bold text-lg">{{ game.name }}</h4>
        <p class="text-slate-400 text-sm">{{ formatTime(game.createdAt) }}</p>
      </div>
      <button
        class="text-slate-400 hover:text-neon-pink transition-colors p-2"
        @click.stop="$emit('delete', game.id)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <!-- 玩家分数预览 -->
    <div class="flex justify-between items-center">
      <div class="flex -space-x-2">
        <div
          v-for="player in game.players"
          :key="player.id"
          class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800"
          :style="getAvatarStyle(player.color)"
        >
          {{ player.name }}
        </div>
      </div>
      <div class="text-sm text-slate-400">
        {{ game.rounds.length }} 轮
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Game } from '~/types'
import { PLAYER_COLORS } from '~/types'

defineProps<{
  game: Game
}>()

defineEmits<{
  (e: 'play', game: Game): void
  (e: 'delete', id: string): void
}>()

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getAvatarStyle(color: string) {
  const colors = PLAYER_COLORS[color as keyof typeof PLAYER_COLORS]
  return {
    background: colors.bg,
    borderColor: colors.neon
  }
}
</script>