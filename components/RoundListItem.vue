<template>
  <div class="bg-slate-800/60 rounded-xl px-3 py-2 border border-slate-700 flex items-center gap-3">
    <!-- 轮次号与时间 -->
    <div class="flex flex-col items-center justify-center min-w-[44px] shrink-0">
      <span class="text-neon-blue font-bold leading-tight">R{{ round.roundNumber }}</span>
      <span class="text-slate-500 text-[10px] leading-tight">{{ formatTime(round.createdAt) }}</span>
    </div>

    <!-- 4 个玩家横向展示：姓名 + 分数 -->
    <div class="flex-1 grid grid-cols-4 gap-2">
      <div
        v-for="(score, index) in round.scores"
        :key="index"
        class="flex items-center gap-1.5 min-w-0"
      >
        <span
          class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          :style="getPlayerStyle(index)"
        >
          {{ playerNames[index] }}
        </span>
        <div class="flex items-baseline gap-0.5 min-w-0 overflow-hidden">
          <span class="text-slate-300 text-xs truncate">{{ playerNames[index] }}</span>
          <span
            class="font-bold text-xs whitespace-nowrap"
            :class="score >= 0 ? 'text-neon-green' : 'text-neon-pink'"
          >
            {{ score >= 0 ? '+' : '' }}{{ score }}
          </span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-0.5 shrink-0">
      <button
        class="text-slate-400 hover:text-neon-blue p-1 transition-colors"
        @click="$emit('edit', round.roundNumber - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        class="text-slate-400 hover:text-neon-pink p-1 transition-colors"
        @click="$emit('delete', round.roundNumber - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Round } from '~/types'
import { PLAYER_COLORS } from '~/types'

defineProps<{
  round: Round
}>()

const playerNames = ['吴', '王', '来', '静']

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPlayerStyle(index: number) {
  const colors = [
    PLAYER_COLORS['fire-red'],
    PLAYER_COLORS['deep-sea-blue'],
    PLAYER_COLORS['emerald-green'],
    PLAYER_COLORS['night-purple']
  ][index]
  return {
    background: colors.bg,
    border: `1px solid ${colors.neon}`
  }
}

defineEmits<{
  (e: 'edit', index: number): void
  (e: 'delete', index: number): void
}>()
</script>
