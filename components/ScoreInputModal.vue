<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        @click.self="close"
      >
        <!-- 背景：磨砂黑 + 蓝色辉光 -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          style="background: radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85));"
          @click="close"
        />

        <div
          class="relative w-full max-w-lg glass-card-elevated rounded-t-3xl sm:rounded-2xl p-6 border-t sm:border border-slate-700/60 overflow-hidden"
        >
          <!-- 顶部装饰条（青色辉光） -->
          <div
            class="absolute top-0 inset-x-0 h-px"
            style="background: linear-gradient(90deg, transparent, #00ffff, transparent); box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"
          />

          <!-- 标题 -->
          <div class="text-center mb-6 pt-1">
            <h3
              class="font-pingfang text-2xl text-white tracking-[0.05em]"
              :class="isEdit ? 'text-glow-blue' : 'text-glow-green'"
            >
              {{ isEdit ? `修改 R${roundNumber} 轮分数` : '记录新一轮' }}
            </h3>
            <p class="text-slate-500 text-xs mt-1.5">
              输入本轮得分（输入框可负，"± 切换正负"按钮也可调）
            </p>
          </div>

          <!-- 输入框网格：按座位顺序渲染 -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div
              v-for="seat in seatedSeats"
              :key="seat.seatIndex"
              class="flex flex-col items-center"
            >
              <!-- 头像 -->
              <div
                class="relative w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden mb-2 ring-2 ring-offset-2 ring-offset-slate-800"
                :style="{
                  background: getPlayerBg(seat.user!.avatarColor),
                  boxShadow: `0 0 16px ${getPlayerGlow(seat.user!.avatarColor)}`,
                  '--tw-ring-color': getPlayerGlow(seat.user!.avatarColor)
                }"
              >
                <img
                  v-if="seat.user!.avatarUrl"
                  :src="seat.user!.avatarUrl"
                  class="w-full h-full object-cover"
                  :alt="seat.user!.nickname"
                />
                <span v-else>{{ (seat.user!.nickname || '?').slice(0, 1) }}</span>
              </div>

              <!-- 昵称（小） -->
              <div class="text-[11px] text-slate-300 truncate max-w-full mb-1.5 px-1 text-center">
                {{ seat.user!.nickname }}
              </div>

              <!-- 分数输入框（聚焦霓虹光晕） -->
              <input
                :value="scores[seat.seatIndex] ?? 0"
                @input="onScoreInput(seat.seatIndex, $event)"
                @focus="onFocus(seat.seatIndex)"
                @blur="onBlur(seat.seatIndex)"
                type="number"
                inputmode="numeric"
                class="font-score w-full bg-slate-900/60 text-center text-2xl py-2.5 px-2 rounded-xl border-2 outline-none transition-all duration-200 placeholder:text-slate-700"
                :class="[
                  isFocused(seat.seatIndex)
                    ? (scores[seat.seatIndex] >= 0
                        ? 'border-neon-green/70 shadow-[0_0_16px_rgba(57,255,20,0.4)]'
                        : 'border-neon-pink/70 shadow-[0_0_16px_rgba(255,0,255,0.4)]')
                    : 'border-slate-700/60',
                  (scores[seat.seatIndex] ?? 0) >= 0 ? 'text-glow-green' : 'text-glow-pink'
                ]"
                placeholder="0"
              />

              <!-- ± 按钮 -->
              <button
                type="button"
                class="btn-cyber-ghost mt-2 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-md flex items-center gap-1 active:scale-95"
                @click="toggleSign(seat.seatIndex)"
              >
                <span class="text-base leading-none">±</span>
                <span>切换正负</span>
              </button>
            </div>
          </div>

          <!-- 按钮组 -->
          <div class="flex gap-3">
            <button
              class="btn-cyber-ghost flex-1 py-3.5 rounded-xl font-pingfang text-base"
              :disabled="saving"
              @click="close"
            >
              取消
            </button>
            <button
              class="btn-cyber-primary flex-1 py-3.5 rounded-xl font-pingfang text-base flex items-center justify-center gap-2"
              :disabled="saving"
              @click="confirm"
            >
              <LoaderCircle v-if="saving" class="w-5 h-5 animate-spin" :stroke-width="2.5" />
              <Check v-else class="w-5 h-5" :stroke-width="2.5" />
              {{ saving ? '保存中…' : (isEdit ? '保存修改' : '确认记录') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Seat, User } from '~/types'
import { PLAYER_COLORS } from '~/types'
import { LoaderCircle, Check } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  seats: Seat[]
  isEdit?: boolean
  roundNumber?: number
  initialScores?: number[]
  saving?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', scores: number[]): void
}>()

const seatedSeats = computed<Seat[]>(() => props.seats.filter((s): s is Seat & { user: User } => !!s.user))

const scores = ref<number[]>([])
const focusedIndex = ref<number | null>(null)

watch(() => props.show, (newVal) => {
  if (newVal) {
    const n = props.seats.length || 2
    if (props.initialScores && props.initialScores.length === n) {
      scores.value = [...props.initialScores]
    } else {
      scores.value = new Array(n).fill(0)
    }
  } else {
    focusedIndex.value = null
  }
})

function onScoreInput(seatIndex: number, e: Event) {
  const input = e.target as HTMLInputElement
  const v = input.value === '' ? 0 : Number(input.value)
  if (Number.isFinite(v)) {
    scores.value[seatIndex] = v
  }
}

function onFocus(i: number) { focusedIndex.value = i }
function onBlur(i: number) { if (focusedIndex.value === i) focusedIndex.value = null }
function isFocused(i: number) { return focusedIndex.value === i }

function getPlayerBg(colorKey: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.bg || PLAYER_COLORS['fire-red'].bg
}
function getPlayerGlow(colorKey: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.neon || PLAYER_COLORS['fire-red'].neon
}

function close() {
  if (props.saving) return
  emit('close')
}

function toggleSign(seatIndex: number) {
  if (seatIndex < 0 || seatIndex >= scores.value.length) return
  scores.value[seatIndex] = -(scores.value[seatIndex] ?? 0)
}

function confirm() {
  if (props.saving) return
  emit('confirm', [...scores.value])
}
</script>

<style scoped>
/* 弹窗弹性进场（共用 modal-fade） */
.modal-fade-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-leave-active {
  transition: all 0.15s ease-in;
}
.modal-fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
