<template>
  <div class="min-h-screen bg-slate-900 pb-28">
    <!-- 顶部玩家信息 -->
    <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div class="p-4">
        <!-- 顶部按钮行 -->
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
            <!-- 轮询指示 -->
            <div v-if="isLoading" class="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            <div v-else class="w-2 h-2 rounded-full bg-slate-700" />
          </div>
        </div>

        <!-- 玩家头像 + 总分 -->
        <div v-if="currentSession" class="flex justify-around items-start">
          <PlayerAvatar
            v-for="(player, idx) in currentSession.players"
            :key="player.id"
            :player="player"
            :score="totalScores[idx] ?? 0"
            :uploading="isUploading === player.id"
            @upload="(file) => onUploadAvatar(player.id, file)"
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
          :players="currentSession.players"
          :total-scores="totalScores"
        />
        <ScoreTrendChart
          v-else
          :players="currentSession.players"
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
          :players="currentSession.players"
          @edit="openEditModal"
          @delete="confirmDeleteRound"
        />
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <p>还没有记录</p>
        <p class="text-sm">点击下方按钮开始记录</p>
      </div>
    </div>

    <!-- 加载失败 / 加载中（currentSession 还没就绪时） -->
    <div
      v-if="!currentSession"
      class="px-4 pt-8"
    >
      <div
        v-if="isLoading"
        class="text-center py-16 text-slate-400"
      >
        <svg class="w-10 h-10 mx-auto mb-3 animate-spin text-neon-blue" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p class="font-bold">加载房间中…</p>
        <p class="text-xs text-slate-500 mt-1">第一次连接数据库可能稍慢（5-15s）</p>
      </div>

      <div
        v-else
        class="bg-slate-800/70 rounded-2xl p-6 border border-neon-pink/30 text-center"
      >
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
    <div class="fixed bottom-6 left-4 right-4 z-30">
      <button
        class="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-neon-green to-emerald-500 text-slate-900 shadow-lg shadow-neon-green/30 active:scale-95 transition-all flex items-center justify-center gap-2"
        :disabled="isSaving || !currentSession"
        :class="{ 'opacity-70 cursor-not-allowed': isSaving || !currentSession }"
        @click="openAddModal"
      >
        <svg v-if="isSaving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>🎯 {{ isSaving ? '保存中...' : '记录新一轮' }}</span>
      </button>
    </div>

    <!-- 录入弹窗 -->
    <ScoreInputModal
      v-if="currentSession"
      :show="showModal"
      :players="currentSession.players"
      :is-edit="isEditMode"
      :round-number="editingRoundNumber"
      :initial-scores="editingScores"
      :saving="isSaving"
      @close="closeModal"
      @confirm="handleScoreSubmit"
    />

    <!-- 删除单轮确认 -->
    <ConfirmDialog
      :show="askDeleteRound"
      title="删除这一轮？"
      message="删除后无法恢复"
      @cancel="askDeleteRound = false"
      @confirm="executeDeleteRound"
    />

    <!-- 删除整局确认 -->
    <ConfirmDialog
      :show="askDeleteRoom"
      title="删除整局游戏？"
      message="房间内所有分数将被清除，无法恢复"
      @cancel="askDeleteRoom = false"
      @confirm="executeDeleteRoom"
    />
  </div>
</template>

<script setup lang="ts">
import { useCurrentSession } from '~/composables/useGame'
import { usePolling } from '~/composables/usePolling'
import * as db from '~/composables/useDb'

const props = defineProps<{
  roomId: string
}>()
defineEmits<{
  (e: 'leave'): void
}>()

const {
  currentSession,
  isLoading,
  isSaving,
  isUploading,
  totalScores,
  reversedRounds,
  reload,
  ensureAndLoad,
  addRound,
  updateRound,
  deleteRound,
  deleteWholeRoom,
  uploadAvatar,
  loadError
} = useCurrentSession()

const activeTab = ref<'bar' | 'line'>('bar')

// 录入弹窗状态
const showModal = ref(false)
const isEditMode = ref(false)
const editingRoundIndex = ref(0)
const editingRoundNumber = ref(0)
const editingScores = ref<number[]>([])
const askDeleteRound = ref(false)
const roundToDelete = ref<number | null>(null)
const askDeleteRoom = ref(false)

// 首次挂载加载房间（不存在则创建）
onMounted(async () => {
  await ensureAndLoad(props.roomId)
})

// 8 秒轮询：拉取最新数据（server 端 5s 缓存让大多数请求命中）
const { start: startPolling, stop: stopPolling } = usePolling(async () => {
  if (!props.roomId) return
  try {
    const fresh = await db.getRoom(props.roomId)
    if (fresh) {
      currentSession.value = fresh
      loadError.value = null
    }
  } catch (e) {
    console.error('[polling] failed:', e)
  }
}, 8000)

onBeforeUnmount(() => {
  stopPolling()
})

// 弹窗
function openAddModal() {
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
function closeModal() {
  showModal.value = false
}
async function handleScoreSubmit(scores: number[]) {
  if (isEditMode.value) {
    await updateRound(editingRoundIndex.value, scores)
  } else {
    await addRound(scores)
  }
  closeModal()
  // 写完后立即拉一次（轮询也会在 4s 内再触发一次）
  await reload(props.roomId)
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
    // 离开页面
    emit('leave')
  }
}

// 上传头像
async function onUploadAvatar(playerId: number, file: File) {
  try {
    await uploadAvatar(playerId, file)
  } catch (e: any) {
    alert('头像上传失败：' + (e?.message || e))
  }
}

// 手动重试
async function retry() {
  await reload(props.roomId)
}
</script>
