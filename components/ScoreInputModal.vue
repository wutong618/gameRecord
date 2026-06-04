<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end justify-center"
        @click.self="close"
      >
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <!-- 弹窗内容 -->
        <Transition name="slide-up">
          <div
            v-if="show"
            class="relative w-full max-w-lg bg-slate-800 rounded-t-3xl p-6 shadow-2xl border-t border-slate-700"
          >
            <!-- 标题 -->
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white">
                {{ isEdit ? `修改 R${roundNumber} 轮分数` : '记录新一轮' }}
              </h3>
              <p class="text-slate-400 text-sm mt-1">
                输入本轮得分（支持负数）
              </p>
            </div>

            <!-- 输入框网格 -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div
                v-for="player in players"
                :key="player.id"
                class="flex flex-col items-center"
              >
                <div
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2"
                  :style="getAvatarStyle(player.color)"
                >
                  {{ player.name }}
                </div>
                <input
                  v-model.number="scores[player.id]"
                  type="number"
                  inputmode="numeric"
                  class="w-full bg-slate-700 text-center text-xl font-bold text-white py-3 px-2 rounded-xl border-2 focus:border-neon-blue outline-none transition-all"
                  :class="(scores[player.id] ?? 0) >= 0 ? 'border-slate-600 focus:border-neon-green' : 'border-slate-600 focus:border-neon-pink'"
                  placeholder="0"
                />
                <button
                  type="button"
                  class="mt-1.5 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition-colors"
                  :class="(scores[player.id] ?? 0) < 0 ? 'text-neon-pink border-neon-pink/40' : ''"
                  @click="toggleSign(player.id)"
                >
                  ± 切换正负
                </button>
              </div>
            </div>

            <!-- 按钮组 -->
            <div class="flex gap-4">
              <button
                class="flex-1 py-4 rounded-xl text-lg font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all disabled:opacity-50"
                :disabled="saving"
                @click="close"
              >
                取消
              </button>
              <button
                class="flex-1 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-neon-green to-emerald-500 text-slate-900 hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                :disabled="saving"
                @click="confirm"
              >
                <svg v-if="saving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>{{ saving ? '保存中...' : (isEdit ? '保存修改' : '确认记录') }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { PlayerProfile } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  show: boolean
  players: PlayerProfile[]
  isEdit?: boolean
  roundNumber?: number
  initialScores?: number[]
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', scores: number[]): void
}>()

const scores = ref<number[]>([0, 0, 0, 0])

// 监听弹窗显示状态
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.initialScores) {
      scores.value = [...props.initialScores]
    } else {
      scores.value = [0, 0, 0, 0]
    }
  }
})

function getAvatarStyle(color: string) {
  const colors = PLAYER_COLORS[color as keyof typeof PLAYER_COLORS]
  return {
    background: colors.bg,
    border: `2px solid ${colors.neon}`,
    boxShadow: `0 0 10px ${colors.neon}40`
  }
}

function close() {
  if (props.saving) return
  emit('close')
}

function toggleSign(playerId: number) {
  const cur = scores.value[playerId] ?? 0
  scores.value[playerId] = -cur
}

function confirm() {
  if (props.saving) return
  emit('confirm', [...scores.value])
  // 不在这里 close，由父组件在保存完成后关闭
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>