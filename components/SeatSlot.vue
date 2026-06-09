<template>
  <div class="flex flex-col items-center select-none">
    <!--
      头像"舞台"：固定高度 h-20 (80px) + 横向 padding-y 4px，
      让 scale(1.35) 后的 86.4px 视觉头像能完整展示而不挤压周围元素。
      width: 100% 让 stage 占满 grid 单元，水平居中保持。
    -->
    <div class="flex items-center justify-center w-full h-20 py-1">
      <div
        class="relative w-16 h-16 rounded-full flex items-center justify-center text-white font-bold cursor-pointer overflow-visible border-2 origin-center will-change-transform"
        :class="[
          isEmpty
            ? 'border-2 border-dashed border-slate-600 hover:border-neon-blue/70 hover:bg-slate-800/30 hover:rotate-90'
            : 'border-2',
          isSelf ? 'ring-2 ring-offset-2 active:scale-95' : '',
          isEmpty ? 'animate-spin-slow' : '',
          // v3.1 动态头像视觉压迫：分数→scale 映射，500ms ease-spring 丝滑过渡
          // 仅对已坐玩家生效，空位不缩放
          !isEmpty ? 'transition-transform duration-500 ease-spring' : 'transition-all duration-200'
        ]"
        :style="avatarStyle"
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
      class="font-score text-base leading-tight mt-0.5 transition-colors duration-500"
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
import { useScoreScale } from '~/composables/useScoreScale'
import { Plus } from 'lucide-vue-next'

const props = defineProps<{
  user: User | null
  size?: 'sm' | 'md' | 'lg'
  isSelf?: boolean
  score?: number
  uploading?: boolean
  // v3.1 动态头像缩放：所有玩家总分数数组，组件用其在 [0.75, 1.35] 区间线性映射
  totalScores?: readonly number[]
  // 当前座位在总分数数组中的索引（PlayerGrid 透传）
  seatIndex?: number
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

// v3.1 头像缩放：useScoreScale 接收响应式 totalScores
// 用 toRef 把 props.totalScores 转成 Ref，确保 props 变化时 computed 重算
const totalScoresRef = computed(() => props.totalScores ?? [])
const avatarScale = useScoreScale(totalScoresRef, props.seatIndex ?? 0)

const avatarStyle = computed(() => {
  if (isEmpty.value) {
    return {} // 空位不缩放，不发光
  }
  return {
    background: colors.value.bg,
    borderColor: colors.value.neon,
    boxShadow: `0 0 16px ${colors.value.neon}80, inset 0 0 0 1px ${colors.value.neon}`,
    '--tw-ring-color': colors.value.neon,
    '--tw-ring-offset-color': '#0a0f1e',
    // 关键：transform: scale() 替代 width/height 调整，零重排
    transform: `scale(${avatarScale.value.toFixed(3)})`
  }
})

function handleClick() {
  emit('click', { user: props.user })
}
</script>
