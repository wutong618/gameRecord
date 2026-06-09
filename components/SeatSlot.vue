<template>
  <div class="flex flex-col items-center select-none">
    <!--
      头像"舞台"：固定高度 h-20 (80px) + 横向 padding-y 4px，
      让 scale(1.35) 后的 86.4px 视觉头像能完整展示而不挤压周围元素。
      width: 100% 让 stage 占满 grid 单元，水平居中保持。
      relative 定位是为了第一名粒子特效层能 absolute 到 stage 范围内。
    -->
    <div class="relative flex items-center justify-center w-full h-20 py-1">
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
          <!--
            v3.1.1 修复：之前父容器 overflow-hidden 被改成 overflow-visible
            （为了 scale 1.35 的 glow 不被裁）后，img 失去了圆形裁切 → 头像变方块。
            解决：给 img 自身加 rounded-full，让图片自己裁自己。
          -->
          <img
            v-if="user!.avatarUrl"
            :src="user!.avatarUrl"
            :alt="user!.nickname"
            class="w-full h-full object-cover rounded-full"
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

      <!--
        v3.1.1 第一名粒子特效：荣誉感强化
        - 仅当 isFirst = true（自己的分数 === 全场 max，且 max > min，不是平局）才显示
        - 6 个上升粒子 + 1 个脉冲光晕环
        - 颜色采用玩家本人的 neon 色（与头像 glow 一致）
        - pointer-events-none 不挡头像点击
        - transition-opacity 让换人时柔和淡入淡出
      -->
      <div
        v-if="isFirst"
        class="absolute inset-0 pointer-events-none transition-opacity duration-700"
        :style="{ '--c': colors.neon }"
        aria-hidden="true"
      >
        <!-- 6 个上升粒子（错开 delay / duration 形成有机感） -->
        <span
          v-for="p in FIRST_PARTICLES"
          :key="p.id"
          class="first-particle"
          :style="particleStyle(p)"
        />

        <!-- 脉冲光晕环（从头像边缘向外扩散 2 次，错开 0.9s） -->
        <span
          v-for="r in [0, 1]"
          :key="`halo-${r}`"
          class="first-halo"
          :style="{ animationDelay: `${r * 0.9}s` }"
        />
      </div>
    </div>

    <!-- 昵称 -->
    <div
      class="mt-1.5 text-[11px] truncate max-w-[80px] font-pingfang transition-colors"
      :class="[
        isEmpty ? 'text-slate-600' : isSelf ? 'text-slate-100 font-bold' : 'text-slate-300',
        // 第一名昵称也微微提亮
        isFirst ? 'first-name' : ''
      ]"
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
    case 'sm': return 'w-full h-full text-sm'
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

// v3.1.1 第一名判定：自己分数 === 全场 max，且 max > min（平局不算第一）
// 多个人并列第一时所有人都触发（共享 max 没问题）。
const isFirst = computed(() => {
  if (isEmpty.value) return false
  const scores = props.totalScores
  if (!scores || scores.length === 0) return false
  let max = -Infinity
  let min = Infinity
  let validCount = 0
  for (const s of scores) {
    if (typeof s !== 'number' || Number.isNaN(s)) continue
    if (s > max) max = s
    if (s < min) min = s
    validCount++
  }
  if (validCount === 0) return false
  if (max === min) return false  // 全平局，谁都不是"第一"
  const my = scores[props.seatIndex ?? 0]
  if (typeof my !== 'number' || Number.isNaN(my)) return false
  return my === max
})

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

// v3.1.1 第一名粒子定义（6 个，错开 delay / duration / 水平漂移 dx）
// x 是粒子起始的水平位置（% of stage 宽度），dx 是上升过程中的水平漂移
const FIRST_PARTICLES = [
  { id: 0, x: 25, dx: -8,  size: 4, dur: 2.0, dly: 0.0 },
  { id: 1, x: 45, dx:  4,  size: 3, dur: 2.4, dly: 0.5 },
  { id: 2, x: 65, dx: -3,  size: 4, dur: 1.8, dly: 1.0 },
  { id: 3, x: 35, dx: 10,  size: 3, dur: 2.2, dly: 0.3 },
  { id: 4, x: 75, dx: -10, size: 4, dur: 1.9, dly: 1.4 },
  { id: 5, x: 55, dx:  2,  size: 3, dur: 2.3, dly: 0.8 }
] as const

// 把每个粒子的运行时样式包成对象返回（含 left、--dx、--dur、--d、自定义 size）
function particleStyle(p: typeof FIRST_PARTICLES[number]) {
  return {
    left: `${p.x}%`,
    width: `${p.size}px`,
    height: `${p.size}px`,
    '--dx': `${p.dx}px`,
    '--dur': `${p.dur}s`,
    '--d': `${p.dly}s`
  } as Record<string, string>
}

function handleClick() {
  emit('click', { user: props.user })
}
</script>

<style scoped>
/*
 * v3.1.1 第一名粒子 + 光晕动画
 * - first-particle: 从 stage 底部 15% 位置上升，translate + scale + opacity 同步
 * - first-halo: 头像边缘环脉冲外扩 2 次
 * - 都用 will-change 提示 GPU 合成，transform/opacity 走合成层
 */

.first-particle {
  position: absolute;
  bottom: 15%;
  border-radius: 9999px;
  background: var(--c, #00ffff);
  box-shadow:
    0 0 4px var(--c, #00ffff),
    0 0 10px var(--c, #00ffff),
    0 0 18px color-mix(in srgb, var(--c, #00ffff) 50%, transparent);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 0) scale(0.3);
  animation: first-rise var(--dur, 2s) ease-out infinite;
  animation-delay: var(--d, 0s);
  will-change: transform, opacity;
}

@keyframes first-rise {
  0% {
    transform: translate(-50%, 0) scale(0.3);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  70% {
    opacity: 0.7;
  }
  100% {
    /* 上升 55px 同时水平漂移 dx；用 calc 把 -50% 居中补偿和 dx 漂移合并 */
    transform: translate(calc(-50% + var(--dx, 0px)), -55px) scale(1.3);
    opacity: 0;
  }
}

.first-halo {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  border: 1.5px solid var(--c, #00ffff);
  box-shadow: 0 0 8px var(--c, #00ffff);
  opacity: 0;
  pointer-events: none;
  animation: first-halo-pulse 1.8s ease-out infinite;
  will-change: transform, opacity;
}

@keyframes first-halo-pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.75;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.first-name {
  text-shadow: 0 0 6px var(--c, #00ffff);
}
</style>
