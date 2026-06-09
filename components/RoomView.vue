<template>
  <div class="min-h-screen bg-slate-900 pb-28">
    <!-- 顶部 -->
    <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div class="p-4">
        <div class="flex items-center justify-between mb-4 gap-2">
          <button
            class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white shrink-0"
            @click="$emit('leave')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex-1 flex justify-center gap-2">
            <CopyLinkButton size="sm" />
            <button
              class="px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-800 text-neon-pink border border-neon-pink/30 hover:bg-slate-700 transition-all"
              @click="askDeleteRoom = true"
            >
              删除整局
            </button>
          </div>
          <div class="w-9 shrink-0 flex justify-end">
            <div v-if="isLoading" class="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            <div v-else class="w-2 h-2 rounded-full bg-slate-700" />
          </div>
        </div>

        <!-- 座位网格 -->
        <div v-if="currentSession" class="px-1">
          <PlayerGrid
            :session="currentSession"
            :current-user="currentUser"
            :total-scores="totalScores"
            @seat-click="onSeatClick"
          />
        </div>
      </div>

      <!-- Tab 切换 -->
      <div v-if="currentSession" class="flex px-4 gap-2 mb-2">
        <button
          class="flex-1 py-2 rounded-lg font-bold text-sm transition-all"
          :class="activeTab === 'bar' ? 'bg-neon-blue text-slate-900' : 'bg-slate-800 text-slate-400'"
          @click="activeTab = 'bar'"
        >
          总分对比
        </button>
        <button
          class="flex-1 py-2 rounded-lg font-bold text-sm transition-all"
          :class="activeTab === 'line' ? 'bg-neon-blue text-slate-900' : 'bg-slate-800 text-slate-400'"
          @click="activeTab = 'line'"
        >
          趋势图
        </button>
      </div>
    </header>

    <!-- 图表 -->
    <div v-if="currentSession" class="p-4">
      <div class="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
        <ScoreBarChart
          v-if="activeTab === 'bar'"
          :players="seatedPlayers"
          :total-scores="totalScores"
        />
        <ScoreTrendChart
          v-else
          :players="seatedPlayers"
          :rounds="currentSession.gameData.rounds"
        />
      </div>
    </div>

    <!-- 历史轮次 -->
    <div v-if="currentSession" class="px-4">
      <h2 class="text-lg font-bold text-slate-300 mb-3">
        历史记录 ({{ currentSession.gameData.rounds.length }} 轮)
      </h2>

      <div v-if="reversedRounds.length > 0" class="space-y-2">
        <RoundListItem
          v-for="round in reversedRounds"
          :key="round.roundNumber"
          :round="round"
          :players="seatedPlayers"
          @edit="openEditModal"
          @delete="confirmDeleteRound"
        />
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <p>还没有记录</p>
        <p class="text-sm">点击下方按钮开始记录</p>
      </div>
    </div>

    <!-- 加载/失败状态 -->
    <div v-if="!currentSession" class="px-4 pt-8">
      <div v-if="isLoading" class="text-center py-16 text-slate-400">
        <svg class="w-10 h-10 mx-auto mb-3 animate-spin text-neon-blue" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p class="font-bold">加载房间中…</p>
      </div>
      <div v-else class="bg-slate-800/70 rounded-2xl p-6 border border-neon-pink/30 text-center">
        <div class="text-3xl mb-2">⚠️</div>
        <p class="text-white font-bold mb-1">加载失败</p>
        <p class="text-slate-400 text-sm mb-4">{{ loadError || '未知错误' }}</p>
        <button
          class="px-5 py-2.5 rounded-xl bg-neon-blue text-slate-900 font-bold text-sm active:scale-95 transition-all"
          :disabled="isLoading"
          @click="retry"
        >
          重新加载
        </button>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div v-if="currentSession && isCurrentUserSeated" class="fixed bottom-6 left-4 right-4 z-30">
      <button
        class="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-neon-green to-emerald-500 text-slate-900 shadow-lg shadow-neon-green/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        :disabled="isSaving"
        :class="{ 'opacity-70 cursor-not-allowed': isSaving }"
        @click="openAddModal"
      >
        <svg v-if="isSaving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>🎯 {{ isSaving ? '保存中...' : '记录新一轮' }}</span>
      </button>
    </div>

    <!-- 坐下提示（用户未在座位上时） -->
    <div v-if="currentSession && !isCurrentUserSeated && !autoSittingDown" class="fixed bottom-6 left-4 right-4 z-30">
      <div class="bg-slate-800/95 rounded-2xl p-4 border border-neon-blue/30 text-center">
        <p class="text-white text-sm mb-2">点击空位 [+] 坐下</p>
        <button
          class="px-4 py-2 rounded-xl bg-neon-blue text-slate-900 font-bold text-sm"
          @click="autoSit"
        >
          自动坐下
        </button>
      </div>
    </div>

    <!-- 录入弹窗 -->
    <ScoreInputModal
      v-if="currentSession"
      :show="showModal"
      :players="seatedPlayers"
      :is-edit="isEditMode"
      :round-number="editingRoundNumber"
      :initial-scores="editingScores"
      :saving="isSaving"
      @close="closeModal"
      @confirm="handleScoreSubmit"
    />

    <ConfirmDialog
      :show="askDeleteRound"
      title="删除这一轮？"
      message="删除后无法恢复"
      @cancel="askDeleteRound = false"
      @confirm="executeDeleteRound"
    />
    <ConfirmDialog
      :show="askDeleteRoom"
      title="删除整局游戏？"
      message="房间内所有分数将被清除，无法恢复"
      @cancel="askDeleteRoom = false"
      @confirm="executeDeleteRoom"
    />

    <!-- 完善资料 -->
    <ProfileModal
      :show="showProfile"
      :user="currentUser"
      @close="showProfile = false"
      @saved="onProfileSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoom } from '~/composables/useRoom'
import { useUser } from '~/composables/useUser'
import { usePolling } from '~/composables/usePolling'
import { getRoom as fetchRoomApi } from '~/composables/useDb'
import { useRouter } from 'vue-router'
import type { User } from '~/types'

const props = defineProps<{ roomId: string }>()
defineEmits<{ (e: 'leave'): void }>()

const { currentUser, init: initUser, refresh: refreshUser } = useUser()
const router = useRouter()
const {
  currentSession, isLoading, isSaving, loadError,
  totalScores, reversedRounds, cumulativeScores,
  loadRoom, sitDown, addRound, updateRound, deleteRound, deleteWholeRoom
} = useRoom()

const activeTab = ref<'bar' | 'line'>('bar')
const showModal = ref(false)
const isEditMode = ref(false)
const editingRoundIndex = ref(0)
const editingRoundNumber = ref(0)
const editingScores = ref<number[]>([])
const askDeleteRound = ref(false)
const roundToDelete = ref<number | null>(null)
const askDeleteRoom = ref(false)
const autoSittingDown = ref(false)
const showProfile = ref(false)

const isCurrentUserSeated = computed(() => {
  if (!currentSession.value || !currentUser.value) return false
  return currentSession.value.seats.some(s => s.user?.id === currentUser.value!.id)
})

// 给图表用的 players 列表（按座位顺序，未占位的过滤掉）
const seatedPlayers = computed(() => {
  if (!currentSession.value) return []
  return currentSession.value.seats
    .map(s => s.user)
    .filter((u): u is User => u !== null)
})

onMounted(async () => {
  await initUser()
  // 主动重试：刚加入的链接可能 server 端刚 init 还没缓存，多试几次避免 8s 轮询期间的失败页
  let session = null
  for (let i = 0; i < 4; i++) {
    session = await loadRoom(props.roomId)
    if (session) break
    await new Promise(r => setTimeout(r, 800 * (i + 1)))  // 800ms, 1.6s, 2.4s
  }
  if (session && currentUser.value && !isCurrentUserSeated.value) {
    await autoSit()
  }
})

// 8s 轮询
usePolling(async () => {
  if (!props.roomId) return
  try {
    const fresh = await fetchRoomApi(props.roomId)
    if (fresh) {
      currentSession.value = fresh
      loadError.value = null
    }
  } catch (e) {
    // 静默
  }
}, 8000)

// 座位点击
async function onSeatClick({ seatIndex, user, isSelf }: { seatIndex: number; user: User | null; isSelf: boolean }) {
  if (!currentUser.value) return
  if (user === null) {
    // 空位：坐下 / 换座位
    await doSitDown(seatIndex)
  } else if (isSelf) {
    // 自己：弹 ProfileModal
    showProfile.value = true
  } else {
    // 他人：暂不响应
  }
}

function onProfileSaved(updated: User) {
  currentUser.value = updated
  // 同步更新 currentSession.seats 里的自己，避免等 8s 轮询
  if (currentSession.value) {
    currentSession.value = {
      ...currentSession.value,
      seats: currentSession.value.seats.map(s =>
        s.user?.id === updated.id ? { ...s, user: updated } : s
      )
    }
  }
}

async function autoSit() {
  if (autoSittingDown.value || !currentUser.value || !currentSession.value) return
  await doSitDown(undefined)
}

async function doSitDown(seatIndex?: number) {
  if (!currentUser.value || !currentSession.value) return
  autoSittingDown.value = true
  try {
    await sitDown(currentSession.value.roomId, currentUser.value.clientId, seatIndex)
  } catch (e: any) {
    alert('坐下失败：' + (e?.message || e))
  } finally {
    autoSittingDown.value = false
  }
}

// 录入：实时拉一次 session，避免轮询延迟导致误判未坐满
async function openAddModal() {
  // 先拉一次最新 session
  const fresh = await fetchRoomApi(props.roomId)
  if (fresh) currentSession.value = fresh
  if (!currentSession.value) return
  const seated = currentSession.value.seats.filter(s => s.user).length
  const max = currentSession.value.maxPlayers
  if (seated < max) {
    alert(`还差 ${max - seated} 人未坐下，坐满 ${max} 人后才能开始记分`)
    return
  }
  isEditMode.value = false
  editingScores.value = []
  editingRoundIndex.value = 0
  showModal.value = true
}
function openEditModal(index: number) {
  isEditMode.value = true
  editingRoundIndex.value = index
  editingRoundNumber.value = index + 1
  editingScores.value = [...(currentSession.value?.gameData.rounds[index]?.scores ?? [])]
  showModal.value = true
}
function closeModal() { showModal.value = false }
async function handleScoreSubmit(scores: number[]) {
  if (!currentUser.value) return
  if (isEditMode.value) {
    await updateRound(editingRoundIndex.value, scores, currentUser.value)
  } else {
    await addRound(scores, currentUser.value)
  }
  closeModal()
}

// 删除单轮
function confirmDeleteRound(index: number) {
  roundToDelete.value = index
  askDeleteRound.value = true
}
async function executeDeleteRound() {
  if (roundToDelete.value !== null) {
    await deleteRound(roundToDelete.value)
    roundToDelete.value = null
  }
  askDeleteRound.value = false
}

// 删除整局
async function executeDeleteRoom() {
  const ok = await deleteWholeRoom()
  askDeleteRoom.value = false
  if (ok) {
    // 直接 router.replace，不绕 emit；alert 延后到 HomeView 已经渲染后
    router.replace({ path: '/' })
    setTimeout(() => alert('已删除整局'), 80)
  }
}

// 重新加载
async function retry() {
  await loadRoom(props.roomId)
}
</script>
