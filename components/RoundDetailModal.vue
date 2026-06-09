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
          class="relative w-full max-w-md glass-card-elevated rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        >
          <!-- 顶部装饰条（粉色辉光） -->
          <div
            class="absolute top-0 inset-x-0 h-px"
            style="background: linear-gradient(90deg, transparent, #ff00ff, transparent); box-shadow: 0 0 12px rgba(255, 0, 255, 0.6);"
          />

          <div class="flex items-center justify-between mb-5 pt-1">
            <h3 class="font-pingfang text-xl text-white tracking-[0.05em]">
              <span class="text-glow-pink">R{{ roundIndex + 1 }}</span>
              <span class="text-slate-400 ml-1.5">详情</span>
            </h3>
            <button
              class="btn-cyber-ghost w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-neon-pink"
              @click="close"
            >
              <X class="w-4 h-4" :stroke-width="2.5" />
            </button>
          </div>

          <!-- 本轮每位玩家得分 -->
          <div class="space-y-2 mb-4">
            <div
              v-for="(entry, idx) in entries"
              :key="idx"
              class="flex items-center gap-3 bg-slate-900/40 rounded-xl p-2.5 border border-slate-700/40"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 ring-2 ring-offset-2 ring-offset-slate-900"
                :style="{
                  background: getPlayerBg(entry.user?.avatarColor),
                  boxShadow: `0 0 10px ${getPlayerGlow(entry.user?.avatarColor)}`,
                  '--tw-ring-color': getPlayerGlow(entry.user?.avatarColor)
                }"
              >
                <img
                  v-if="entry.user?.avatarUrl"
                  :src="entry.user.avatarUrl"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ (entry.user?.nickname || '?').slice(0, 1) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-bold truncate font-pingfang">
                  {{ entry.user?.nickname || `座位 ${entry.seatIndex + 1}` }}
                </div>
                <div v-if="entry.user?.isTemporary" class="text-[10px] text-amber-400">临时身份</div>
              </div>
              <div
                class="font-score text-2xl tracking-tight"
                :class="(entry.score ?? 0) >= 0 ? 'text-glow-green' : 'text-glow-pink'"
              >
                {{ (entry.score ?? 0) >= 0 ? '+' : '' }}{{ entry.score ?? 0 }}
              </div>
            </div>
          </div>

          <!-- 追溯信息 -->
          <div
            v-if="round"
            class="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 mb-4 relative overflow-hidden"
          >
            <!-- 左侧细光带 -->
            <div
              class="absolute left-0 top-2 bottom-2 w-0.5"
              style="background: linear-gradient(180deg, transparent, #00ffff, transparent); box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);"
            />
            <div class="space-y-1.5 pl-2">
              <div class="flex items-center gap-1.5 text-[11px]">
                <Clock class="w-3 h-3 text-neon-cyan" :stroke-width="2.5" />
                <span class="text-slate-500 font-heading uppercase tracking-[0.2em]">记录</span>
                <span class="text-slate-200 font-bold font-pingfang">{{ recordedByName }}</span>
                <span class="text-slate-500 font-num ml-auto">{{ formatTime(round.recordedAt) }}</span>
              </div>
              <div
                v-if="round.updatedBy && round.updatedAt"
                class="flex items-center gap-1.5 text-[11px]"
              >
                <PencilLine class="w-3 h-3 text-amber-400" :stroke-width="2.5" />
                <span class="text-slate-500 font-heading uppercase tracking-[0.2em]">修改</span>
                <span class="text-slate-200 font-bold font-pingfang">{{ updatedByName }}</span>
                <span class="text-slate-500 font-num ml-auto">{{ formatTime(round.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2">
            <button
              class="btn-cyber-primary flex-1 py-3 rounded-xl font-pingfang text-sm flex items-center justify-center gap-1.5"
              @click="onEdit"
            >
              <Pencil class="w-4 h-4" :stroke-width="2.5" />
              修改本轮
            </button>
            <button
              class="btn-cyber-ghost px-5 py-3 rounded-xl font-pingfang text-sm"
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
import type { Round, User } from '~/types'
import { PLAYER_COLORS } from '~/types'
import { X, Pencil, Clock, PencilLine } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  round: Round | null
  roundIndex: number
  usersBySeat: (User | null)[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', index: number): void
}>()

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

function getPlayerBg(colorKey?: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.bg || PLAYER_COLORS['fire-red'].bg
}
function getPlayerGlow(colorKey?: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.neon || PLAYER_COLORS['fire-red'].neon
}

function close() { emit('close') }
function onEdit() { emit('edit', props.roundIndex) }
</script>

<style scoped>
.modal-fade-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active { transition: all 0.15s ease-in; }
.modal-fade-enter-from { opacity: 0; transform: translateY(20px) scale(0.96); }
.modal-fade-leave-to   { opacity: 0; transform: translateY(8px) scale(0.98); }
</style>
