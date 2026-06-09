<template>
  <div class="flex flex-col items-center select-none">
    <!-- 头像 / 空位圆 -->
    <div
      class="relative rounded-full flex items-center justify-center text-white font-bold overflow-hidden cursor-pointer transition-all duration-200"
      :class="[
        sizeClass,
        isEmpty
          ? 'border-2 border-dashed border-slate-600 hover:border-neon-blue/70 hover:bg-slate-800/30 hover:rotate-90'
          : 'border-2',
        isSelf ? 'ring-2 ring-offset-2 active:scale-95' : '',
        isEmpty ? 'animate-spin-slow' : ''
      ]"
      :style="!isEmpty ? {
        background: colors.bg,
        borderColor: colors.neon,
        boxShadow: `0 0 16px ${colors.neon}80, inset 0 0 0 1px ${colors.neon}`,
        '--tw-ring-color': colors.neon,
        '--tw-ring-offset-color': '#0a0f1e'
      } : {}"
      @click="handleClick"
    >
      <template v-if="isEmpty">
        <Plus class="w-1/2 h-1/2 text-slate-500 group-hover:text-neon-blue transition-colors" :stroke-width="2.5" />
      </template>
      <template v-else>
        <img
          v-if="user!.avatarUrl"
          :src="user!.avatarUrl"
          :alt="user!.nickname"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ (user!.nickname || '?').slice(0, 1) }}</span>
      </template>

      <!-- 自己徽章 -->
      <div
        v-if="isSelf"
        class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-neon-blue text-cyber-bg flex items-center justify-center text-[9px] font-black border-2 border-cyber-bg font-pingfang"
        style="box-shadow: 0 0 8px rgba(0, 255, 255, 0.7);"
      >
        我
      </div>
    </div>

    <!-- 昵称 -->
    <div
      class="mt-1.5 text-[11px] truncate max-w-[80px] font-pingfang transition-colors"
      :class="isEmpty ? 'text-slate-600' : isSelf ? 'text-slate-100 font-bold' : 'text-slate-300'"
    >
      {{ isEmpty ? '空位' : user!.nickname }}
    </div>

    <!-- 分数（仅已坐玩家） -->
    <div
      v-if="!isEmpty && score !== undefined"
      class="font-score text-base leading-tight mt-0.5"
      :class="(score ?? 0) >= 0 ? 'text-glow-green' : 'text-glow-pink'"
    >
      {{ (score ?? 0) >= 0 ? '+' : '' }}{{ score }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '~/types'
import { PLAYER_COLORS } from '~/types'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  user: User | null
  size?: 'sm' | 'md' | 'lg'
  isSelf?: boolean
  score?: number
  uploading?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', payload: { user: User | null }): void
  (e: 'upload', file: File): void
}>()

const isEmpty = computed(() => !props.user)
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-10 h-10 text-sm'
    case 'lg': return 'w-20 h-20 text-3xl'
    default: return 'w-16 h-16 text-xl'
  }
})

const colors = computed(() => {
  const key = (props.user?.avatarColor || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]
})

function handleClick() {
  emit('click', { user: props.user })
}
</script>
