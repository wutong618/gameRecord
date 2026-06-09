<template>
  <div
    class="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:border-neon-blue/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] group"
    @click="onDetail"
  >
    <!-- 轮次号与时间 -->
    <div class="flex flex-col items-center justify-center min-w-[44px] shrink-0">
      <span
        class="font-heading text-neon-blue font-bold text-sm leading-tight tracking-[0.05em]"
        style="text-shadow: 0 0 8px rgba(0, 255, 255, 0.5);"
      >
        R{{ round.roundNumber }}
      </span>
      <span class="text-slate-500 text-[10px] leading-tight font-num mt-0.5">
        {{ formatTime(round.recordedAt) }}
      </span>
    </div>

    <!-- 玩家横向展示：头像 + 姓名 + 分数（按座位顺序） -->
    <div class="flex-1 grid grid-cols-4 gap-2">
      <div
        v-for="(score, index) in round.scores"
        :key="index"
        class="flex items-center gap-1.5 min-w-0"
      >
        <span
          v-if="playerAt(index)"
          class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden ring-1"
          :style="{
            background: getPlayerBg(playerAt(index)!.avatarColor),
            boxShadow: `0 0 6px ${getPlayerGlow(playerAt(index)!.avatarColor)}`,
            '--tw-ring-color': getPlayerGlow(playerAt(index)!.avatarColor)
          }"
        >
          <img
            v-if="playerAt(index)!.avatarUrl"
            :src="playerAt(index)!.avatarUrl!"
            class="w-full h-full object-cover"
            :alt="playerAt(index)!.nickname"
          />
          <span v-else>{{ (playerAt(index)!.nickname || '?').slice(0, 1) }}</span>
        </span>
        <span
          v-else
          class="w-6 h-6 rounded-full border border-dashed border-slate-700 shrink-0"
          aria-hidden="true"
        />
        <div class="flex items-baseline gap-0.5 min-w-0 overflow-hidden">
          <span class="text-slate-400 text-[11px] truncate font-pingfang">
            {{ playerAt(index)?.nickname || '空位' }}
          </span>
          <span
            class="font-score text-[12px] whitespace-nowrap"
            :class="score >= 0 ? 'text-glow-green' : 'text-glow-pink'"
          >
            {{ score >= 0 ? '+' : '' }}{{ score }}
          </span>
        </div>
      </div>
    </div>

    <!-- 操作按钮（lucide 图标 + btn-cyber-ghost 微调） -->
    <div class="flex gap-1 shrink-0">
      <button
        class="btn-cyber-ghost w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-neon-blue"
        @click.stop="$emit('edit', round.roundNumber - 1)"
        title="修改本轮"
      >
        <Pencil class="w-3.5 h-3.5" :stroke-width="2.5" />
      </button>
      <button
        class="btn-cyber-ghost w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-neon-pink"
        @click.stop="$emit('delete', round.roundNumber - 1)"
        title="删除本轮"
      >
        <Trash2 class="w-3.5 h-3.5" :stroke-width="2.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User, Round } from '~/types'
import { PLAYER_COLORS } from '~/types'
import { Pencil, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  round: Round
  players: User[]
}>()

const emit = defineEmits<{
  (e: 'edit', index: number): void
  (e: 'delete', index: number): void
  (e: 'detail', index: number): void
}>()

function playerAt(i: number): User | undefined {
  return props.players[i]
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function getPlayerBg(colorKey: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.bg || PLAYER_COLORS['fire-red'].bg
}
function getPlayerGlow(colorKey: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.neon || PLAYER_COLORS['fire-red'].neon
}

function onDetail() {
  emit('detail', props.round.roundNumber - 1)
}
</script>
