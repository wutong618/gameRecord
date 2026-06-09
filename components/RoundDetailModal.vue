<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="close" />

        <div
          class="relative w-full max-w-md bg-slate-800 rounded-t-2xl sm:rounded-2xl p-6 border-t sm:border border-slate-700 max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-white">R{{ roundIndex + 1 }} 详情</h3>
            <button
              class="text-slate-400 hover:text-white p-1"
              @click="close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 本轮每位玩家得分 -->
          <div class="space-y-2 mb-4">
            <div
              v-for="(entry, idx) in entries"
              :key="idx"
              class="flex items-center gap-3 bg-slate-700/40 rounded-lg p-3"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0"
                :style="avatarStyle(entry.user?.avatarColor)"
              >
                <img v-if="entry.user?.avatarUrl" :src="entry.user.avatarUrl" class="w-full h-full object-cover" />
                <span v-else>{{ (entry.user?.nickname || '?').slice(0, 1) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-bold truncate">{{ entry.user?.nickname || `座位 ${entry.seatIndex + 1}` }}</div>
                <div v-if="entry.user?.isTemporary" class="text-[10px] text-amber-400">临时身份</div>
              </div>
              <div
                class="text-lg font-bold"
                :class="(entry.score ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-pink'"
              >
                {{ (entry.score ?? 0) >= 0 ? '+' : '' }}{{ entry.score ?? 0 }}
              </div>
            </div>
          </div>

          <!-- 追溯信息 -->
          <div class="bg-slate-900/60 rounded-lg p-3 border border-slate-700 mb-4">
            <div v-if="round" class="text-xs text-slate-400 space-y-1">
              <div>
                <span class="text-slate-500">记录：</span>
                <span class="text-slate-200 font-bold">{{ recordedByName }}</span>
                <span class="ml-2 text-slate-500">{{ formatTime(round.recordedAt) }}</span>
              </div>
              <div v-if="round.updatedBy && round.updatedAt">
                <span class="text-slate-500">最后修改：</span>
                <span class="text-slate-200 font-bold">{{ updatedByName }}</span>
                <span class="ml-2 text-slate-500">{{ formatTime(round.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2">
            <button
              class="flex-1 py-3 rounded-xl font-bold bg-neon-blue text-slate-900 active:scale-95 transition-all"
              @click="onEdit"
            >
              修改本轮
            </button>
            <button
              class="px-4 py-3 rounded-xl font-bold bg-slate-700 text-slate-300 active:scale-95 transition-all"
              @click="close"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Round, User } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  show: boolean
  round: Round | null
  roundIndex: number
  /** 所有当前 seats 里的 user（按 seatIndex 顺序）—— 用于把 recordedBy/updatedBy id 解析成昵称 */
  usersBySeat: (User | null)[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', index: number): void
}>()

// 本轮每位玩家的展示项（按 seatIndex 顺序）
const entries = computed(() => {
  if (!props.round) return []
  return props.round.scores.map((score, seatIndex) => ({
    seatIndex,
    score,
    user: props.usersBySeat[seatIndex] ?? null
  }))
})

const recordedByName = computed(() => {
  if (!props.round) return ''
  const u = props.usersBySeat.find(u => u?.id === props.round!.recordedBy)
  return u?.nickname || `用户#${props.round.recordedBy}`
})

const updatedByName = computed(() => {
  if (!props.round?.updatedBy) return ''
  const u = props.usersBySeat.find(u => u?.id === props.round!.updatedBy)
  return u?.nickname || `用户#${props.round.updatedBy}`
})

function formatTime(ts: number | null | undefined): string {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function avatarStyle(colorKey: string | null | undefined) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  const c = PLAYER_COLORS[key] || PLAYER_COLORS['fire-red']
  return {
    background: c.bg,
    boxShadow: `0 0 8px ${c.neon}50`
  }
}

function close() {
  emit('close')
}

function onEdit() {
  emit('edit', props.roundIndex)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
