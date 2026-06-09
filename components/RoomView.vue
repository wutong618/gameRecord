<template>
  <div class="min-h-screen pb-28 safe-area-bottom">
    <!-- 顶部 -->
    <header
      v-if="currentSession"
      class="sticky top-0 z-40 glass-card-elevated border-b border-slate-700/50 scan-line-band"
    >
      <div class="p-4">
        <!-- 顶部按钮行 -->
        <div class="flex items-center justify-between mb-4 gap-2">
          <button
            class="btn-cyber-ghost w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            @click="$emit('leave')"
          >
            <ArrowLeft class="w-4 h-4" :stroke-width="2.5" />
          </button>

          <!-- 房间信息：名称 + 座位状态 -->
          <div class="flex-1 flex flex-col items-center min-w-0 px-2">
            <div
              class="font-pingfang text-[17px] text-white truncate max-w-full tracking-[0.05em]"
            >
              {{ currentSession.name || '未命名房间' }}
            </div>
            <div class="flex items-center gap-2 mt-0.5 font-num">
              <span class="text-[10px] tracking-wider text-slate-500 font-bold">
                {{ seatedCount }} / {{ currentSession.maxPlayers }} 座
              </span>
              <span class="text-slate-700">·</span>
              <span class="text-[10px] tracking-wider text-slate-500 font-bold">
                {{ currentSession.gameData.rounds.length }} 轮
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <CopyLinkButton size="sm" />
            <button
              class="btn-cyber-ghost w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-neon-pink"
              @click="askDeleteRoom = true"
              title="删除整局"
            >
              <Trash2 class="w-4 h-4" :stroke-width="2.5" />
            </button>
          </div>
        </div>

        <!-- 座位网格（每个玩家带分数 + 发光） -->
        <div class="px-1">
          <PlayerGrid
            :session="currentSession"
            :current-user="currentUser"
            :total-scores="totalScores"
            @seat-click="onSeatClick"
          />
        </div>
      </div>

      <!-- Tab 切换：滑块版 -->
      <div class="relative flex px-4 gap-0 mb-3">
        <!-- 滑块底层（带圆角矩形） -->
        <div
          class="absolute top-1 bottom-1 w-[calc(50%-0.5rem)] rounded-lg pointer-events-none transition-transform duration-300 ease-out"
          :class="activeTab === 'bar' ? 'translate-x-0' : 'translate-x-full'"
          :style="{
            background: activeTab === 'bar'
              ? 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(57, 255, 20, 0.15))'
              : 'linear-gradient(135deg, rgba(255, 0, 255, 0.2), rgba(57, 255, 20, 0.15))',
            boxShadow: '0 0 12px rgba(0, 255, 255, 0.25), inset 0 0 0 1px rgba(0, 255, 255, 0.3)'
          }"
        />
        <button
          class="relative flex-1 py-2 rounded-lg font-heading text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 z-10"
          :class="activeTab === 'bar' ? 'text-glow-cyan' : 'text-slate-500'"
          @click="activeTab = 'bar'"
        >
          <BarChart3 class="w-3.5 h-3.5" :stroke-width="2.5" />
          总分对比
        </button>
        <button
          class="relative flex-1 py-2 rounded-lg font-heading text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 flex items-center justify-center gap-1.5 z-10"
          :class="activeTab === 'line' ? 'text-glow-pink' : 'text-slate-500'"
          @click="activeTab = 'line'"
        >
          <LineChart class="w-3.5 h-3.5" :stroke-width="2.5" />
          趋势图
        </button>
      </div>
    </header>

    <!-- 图表 -->
    <Transition name="fade-swap" mode="out-in">
      <div v-if="currentSession && activeTab === 'bar'" key="bar" class="p-4">
        <div class="glass-card rounded-2xl p-4">
          <ScoreBarChart
            :players="seatedPlayers"
            :total-scores="totalScores"
          />
        </div>
      </div>
      <div v-else-if="currentSession && activeTab === 'line'" key="line" class="p-4">
        <div class="glass-card rounded-2xl p-4">
          <ScoreTrendChart
            :players="seatedPlayers"
            :rounds="currentSession.gameData.rounds"
          />
        </div>
      </div>
    </Transition>

    <!-- 历史轮次 -->
    <div v-if="currentSession" class="px-4">
      <h2 class="font-heading text-[11px] font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-[0.25em]">
        <History class="w-3.5 h-3.5 text-neon-blue" :stroke-width="2.5" />
        历史记录
        <span class="text-slate-600 tracking-normal font-num">({{ currentSession.gameData.rounds.length }})</span>
      </h2>

      <TransitionGroup
        v-if="reversedRounds.length > 0"
        name="round-list"
        tag="div"
        class="space-y-2"
      >
        <div
          v-for="round in reversedRounds"
          :key="round.roundNumber"
          :class="[
            'rounded-xl',
            lastInsertedRound === round.roundNumber ? 'animate-flash-green' : ''
          ]"
        >
          <RoundListItem
            :round="round"
            :players="seatedPlayers"
            @edit="openEditModal"
            @delete="confirmDeleteRound"
            @detail="openDetail"
          />
        </div>
      </TransitionGroup>

      <div v-else class="glass-card rounded-2xl p-10 text-center">
        <div class="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-3">
          <Inbox class="w-7 h-7 text-slate-600" :stroke-width="1.5" />
        </div>
        <p class="text-slate-500 text-sm">还没有记录</p>
        <p class="text-slate-600 text-xs mt-1">点击下方按钮开始记录</p>
      </div>
    </div>

    <!-- 加载/失败状态 -->
    <div v-if="!currentSession" class="px-4 pt-8">
      <!-- 加载中：单次拉取 或 重试中 -->
      <div
        v-if="isLoading || isRetrying"
        class="glass-card rounded-2xl p-10 text-center"
      >
        <div class="relative w-16 h-16 mx-auto mb-4">
          <div class="absolute inset-0 rounded-full border-2 border-neon-blue/20" />
          <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-blue animate-spin" />
          <LoaderCircle class="absolute inset-0 m-auto w-7 h-7 text-neon-blue/60" :stroke-width="2" />
        </div>
        <p class="font-bold text-glow-cyan text-base">正在进入房间…</p>
        <p v-if="isRetrying" class="text-[11px] text-slate-500 mt-1.5 font-mono">
          首次连接可能稍慢（5-10s），重试中 {{ retryAttempt }}/4
        </p>
      </div>
      <!-- 真正失败：4 次都失败 -->
      <div v-else class="glass-card rounded-2xl p-6 border-glow-pink text-center">
        <div class="w-12 h-12 rounded-xl bg-neon-pink/10 border border-neon-pink/30 flex items-center justify-center mx-auto mb-3">
          <AlertCircle class="w-7 h-7 text-neon-pink" :stroke-width="2" />
        </div>
        <p class="text-white font-bold mb-1">加载失败</p>
        <p class="text-slate-400 text-sm mb-4">{{ loadError || '未知错误' }}</p>
        <button
          class="btn-cyber-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 mx-auto"
          :disabled="isLoading"
          @click="retry"
        >
          <RefreshCw class="w-4 h-4" :stroke-width="2.5" />
          重新加载
        </button>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div v-if="currentSession && isCurrentUserSeated" class="fixed bottom-6 left-4 right-4 z-30 safe-area-bottom">
      <button
        class="btn-cyber-primary w-full py-5 rounded-2xl text-xl flex items-center justify-center gap-2.5 relative overflow-hidden"
        :disabled="isSaving"
        @click="openAddModal"
      >
        <span v-if="isSaving" class="flex items-center gap-2">
          <LoaderCircle class="w-5 h-5 animate-spin" :stroke-width="2.5" />
          保存中…
        </span>
        <span v-else class="flex items-center gap-2">
          <Target class="w-5 h-5" :stroke-width="2.5" />
          记录新一轮
        </span>
      </button>
    </div>

    <!-- 坐下提示（用户未在座位上时） -->
    <div
      v-if="currentSession && !isCurrentUserSeated && !autoSittingDown"
      class="fixed bottom-6 left-4 right-4 z-30"
    >
      <div class="glass-card-elevated rounded-2xl p-4 border-glow-blue text-center">
        <p class="text-slate-200 text-sm mb-3 flex items-center justify-center gap-1.5">
          <MousePointerClick class="w-4 h-4 text-neon-blue" :stroke-width="2.5" />
          点击空位 [+] 坐下
        </p>
        <button
          class="btn-cyber-ghost px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto"
          @click="autoSit"
        >
          <Sparkles class="w-4 h-4" :stroke-width="2.5" />
          自动坐下
        </button>
      </div>
    </div>

    <!-- 录入弹窗：v-if="modalReady" 让 Modal 永久挂载（首次 mount 后 DOM 一直存在），避免每次打开都重建 -->
    <ScoreInputModal
      v-if="modalReady"
      :show="showModal"
      :seats="currentSession?.seats ?? []"
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

    <!-- 轮次详情 -->
    <RoundDetailModal
      v-if="detailRound"
      :show="showDetail"
      :round="detailRound"
      :round-index="detailIndex"
      :users-by-seat="usersBySeat"
      @close="showDetail = false"
      @edit="onDetailEdit"
    />

    <!-- 文案裁决系统：记分成功后弹出 -->
    <RoastModal :round-number="roastRoundNumber" />
  </div>
</template>

<script setup lang="ts">
import { useRoom } from '~/composables/useRoom'
import { useUser } from '~/composables/useUser'
import { usePolling } from '~/composables/usePolling'
import { getRoom as fetchRoomApi } from '~/composables/useDb'
import { useRouter } from 'vue-router'
import { useRoast, judgeAndTriggerRoast } from '~/composables/useRoast'
import {
  ArrowLeft, Trash2, BarChart3, LineChart, History, Inbox,
  LoaderCircle, AlertCircle, RefreshCw, Target, MousePointerClick, Sparkles
} from 'lucide-vue-next'
import type { User } from '~/types'

const props = defineProps<{ roomId: string }>()
defineEmits<{ (e: 'leave'): void }>()

const { currentUser, init: initUser } = useUser()
const router = useRouter()
const {
  currentSession, isLoading, isSaving, loadError,
  totalScores, reversedRounds,
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
const showDetail = ref(false)
const detailIndex = ref(0)
const isRetrying = ref(false)
const retryAttempt = ref(0)
const lastInsertedRound = ref<number | null>(null)
const roastRoundNumber = ref(0)
const modalReady = ref(false)   // ScoreInputModal 永久挂载标志

const isCurrentUserSeated = computed(() => {
  if (!currentSession.value || !currentUser.value) return false
  return currentSession.value.seats.some(s => s.user?.id === currentUser.value!.id)
})

const seatedCount = computed(() => {
  if (!currentSession.value) return 0
  return currentSession.value.seats.filter(s => s.user).length
})

const seatedPlayers = computed(() => {
  if (!currentSession.value) return []
  return currentSession.value.seats
    .map(s => s.user)
    .filter((u): u is User => u !== null)
})

// 监听新轮次插入 → 短暂高亮
watch(() => currentSession.value?.gameData.rounds.length, (newLen, oldLen) => {
  if (typeof newLen === 'number' && typeof oldLen === 'number' && newLen > oldLen && newLen > 0) {
    lastInsertedRound.value = newLen
    setTimeout(() => { lastInsertedRound.value = null }, 1200)
  }
})

onMounted(async () => {
  await initUser()
  isRetrying.value = true
  loadError.value = null
  let session = null
  for (let i = 0; i < 4; i++) {
    retryAttempt.value = i + 1
    session = await loadRoom(props.roomId)
    if (session) break
    await new Promise(r => setTimeout(r, 500 * Math.pow(1.6, i)))
  }
  await new Promise(r => setTimeout(r, 1500))
  isRetrying.value = false
  retryAttempt.value = 0
  // 拿到首个 session 后立即永久挂载 ScoreInputModal（避免首次打开 mount 延迟）
  if (session) modalReady.value = true
  if (session && currentUser.value && !isCurrentUserSeated.value) {
    await autoSit()
  }

  // 房主刚创建完：读 HomeView 写的 sessionStorage 标记，触发"房主宣言"
  if (typeof window !== 'undefined' && session && currentUser.value) {
    const justCreated = sessionStorage.getItem('justCreatedRoomId')
    if (justCreated === props.roomId) {
      sessionStorage.removeItem('justCreatedRoomId')
      // 房主 = 第一个坐下的人（seat 0），确认是自己
      const hostSeat = session.seats[0]
      if (hostSeat?.user?.id === currentUser.value.id) {
        // 延迟一点，等 Modal 弹窗/轮询消化完
        setTimeout(() => triggerRoomCreated(currentUser.value!), 800)
      }
    }
  }
})

usePolling(async () => {
  if (!props.roomId) return
  try {
    const fresh = await fetchRoomApi(props.roomId)
    if (fresh) {
      currentSession.value = fresh
      loadError.value = null
    }
  } catch (e) { /* 静默 */ }
}, 8000)

async function onSeatClick({ seatIndex, user, isSelf }: { seatIndex: number; user: User | null; isSelf: boolean }) {
  if (!currentUser.value) return
  if (user === null) await doSitDown(seatIndex)
  else if (isSelf) showProfile.value = true
}

function onProfileSaved(updated: User) {
  currentUser.value = updated
  if (currentSession.value) {
    currentSession.value = {
      ...currentSession.value,
      seats: currentSession.value.seats.map(s =>
        s.user?.id === updated.id ? { ...s, user: updated } : s
      )
    }
  }
}

const detailRound = computed(() => {
  if (!currentSession.value) return null
  return currentSession.value.gameData.rounds[detailIndex.value] ?? null
})
const usersBySeat = computed<(User | null)[]>(() => {
  if (!currentSession.value) return []
  return currentSession.value.seats.map(s => s.user)
})

function openDetail(index: number) {
  detailIndex.value = index
  showDetail.value = true
}

function onDetailEdit(index: number) {
  showDetail.value = false
  openEditModal(index)
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
    // 触发"新玩家入局"（只有自己坐下/换座时触发，不为他人的轮询触发）
    triggerPlayerJoined(currentUser.value)
  } catch (e: any) {
    alert('坐下失败：' + (e?.message || e))
  } finally {
    autoSittingDown.value = false
  }
}

function openAddModal() {
  // 乐观打开：本地 snapshot 直接判断坐满（轮询 8s 已经在跑，数据新鲜）
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
  // 后台异步拉一次最新 session 兜底（不阻塞 UI；通常轮询数据已是最新）
  fetchRoomApi(props.roomId).then((fresh) => {
    if (fresh) currentSession.value = fresh
  })
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
  isSaving.value = true
  try {
    // 记录"本轮前的累计分"用于裁决系统的"暴击"判断
    const previousTotals = currentSession.value
      ? [...totalScores.value]
      : []

    if (isEditMode.value) {
      await updateRound(editingRoundIndex.value, scores, currentUser.value)
    } else {
      await addRound(scores, currentUser.value)
    }
    closeModal()

    // 触发裁决系统（记分成功 + 随机）
    if (currentSession.value) {
      const players = currentSession.value.seats.map(s => s.user)
      // 等下一帧让 totalScores 重新计算完
      await nextTick()
      const newTotals = [...totalScores.value]
      // 50% 概率触发；不满足条件也走默认（让每次记分都看到一条）
      if (Math.random() < 0.6) {
        const scenario = judgeAndTriggerRoast({
          players,
          totalScores: newTotals,
          roundScores: scores,
          previousTotals,
          isFirstRound: previousTotals.length === 0
        })
        // judgeAndTriggerRoast 没返回 → fallback 强制选一条
        if (!scenario) {
          const fallback = ['king_loser', 'comeback', 'lopsided'][Math.floor(Math.random() * 3)] as any
          useRoast().triggerRoast(fallback, { first: undefined, last: undefined })
        }
        // 标记本轮
        const lastRound = currentSession.value.gameData.rounds[currentSession.value.gameData.rounds.length - 1]
        if (lastRound) roastRoundNumber.value = lastRound.roundNumber
      }
    }
  } catch (e: any) {
    console.error('[handleScoreSubmit]', e)
    alert('保存失败：' + (e?.statusMessage || e?.data?.statusMessage || e?.message || JSON.stringify(e)))
  } finally {
    isSaving.value = false
  }
}

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

async function executeDeleteRoom() {
  const ok = await deleteWholeRoom()
  askDeleteRoom.value = false
  if (ok) {
    router.replace({ path: '/' })
    setTimeout(() => alert('已删除整局'), 80)
  }
}

async function retry() {
  await loadRoom(props.roomId)
}
</script>

<style scoped>
/* 轮次列表插入/移出动效 */
.round-list-enter-active,
.round-list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.round-list-enter-from {
  opacity: 0;
  transform: translateY(-16px) scale(0.96);
}
.round-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.round-list-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Tab 切换淡入淡出 */
.fade-swap-enter-active,
.fade-swap-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
