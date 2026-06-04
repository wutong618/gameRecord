<template>
  <div class="min-h-screen bg-slate-900 pb-28">
    <!-- 顶部玩家信息 -->
    <header class="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div class="p-4">
        <!-- 返回按钮和标题 -->
        <div class="flex items-center justify-between mb-4">
          <button
            class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            @click="goHome"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-white font-bold">{{ currentGame?.name || '加载中...' }}</h1>
          <div class="w-9" />
        </div>

        <!-- 玩家头像和总分 -->
        <div v-if="currentGame" class="flex justify-around items-start">
          <PlayerAvatar
            v-for="player in currentGame.players"
            :key="player.id"
            :player="player"
            :score="player.totalScore"
          />
        </div>
      </div>

      <!-- Tab 切换 -->
      <div v-if="currentGame" class="flex px-4 gap-2 mb-2">
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

    <!-- 图表展示 -->
    <div v-if="currentGame" class="p-4">
      <div class="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
        <ScoreBarChart v-if="activeTab === 'bar'" :game="currentGame" />
        <ScoreTrendChart v-else :game="currentGame" />
      </div>
    </div>

    <!-- 历史轮次列表 -->
    <div v-if="currentGame" class="px-4">
      <h2 class="text-lg font-bold text-slate-300 mb-3">
        历史记录 ({{ currentGame.rounds.length }} 轮)
      </h2>

      <div v-if="reversedRounds.length > 0" class="space-y-2">
        <RoundListItem
          v-for="round in reversedRounds"
          :key="round.roundNumber"
          :round="round"
          @edit="openEditModal"
          @delete="confirmDeleteRound"
        />
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <p>还没有记录</p>
        <p class="text-sm">点击下方按钮开始记录</p>
      </div>
    </div>

    <!-- 底部悬浮按钮 -->
    <div class="fixed bottom-6 left-4 right-4 z-30">
      <button
        class="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-neon-green to-emerald-500 text-slate-900 shadow-lg shadow-neon-green/30 active:scale-95 transition-all"
        @click="openAddModal"
      >
        🎯 记录新一轮
      </button>
    </div>

    <!-- 录入弹窗 -->
    <ScoreInputModal
      v-if="currentGame"
      :show="showModal"
      :players="currentGame.players"
      :is-edit="isEditMode"
      :round-number="editingRoundNumber"
      :initial-scores="editingScores"
      @close="closeModal"
      @confirm="handleScoreSubmit"
    />

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showDeleteConfirm = false"
        >
          <div class="absolute inset-0 bg-black/70" />
          <div class="relative bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h3 class="text-xl font-bold text-white mb-2">确认删除</h3>
            <p class="text-slate-400 mb-6">确定要删除这一轮记录吗？</p>
            <div class="flex gap-3">
              <button
                class="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold"
                @click="showDeleteConfirm = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-3 rounded-xl bg-neon-pink text-white font-bold"
                @click="executeDeleteRound"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useCurrentGame } from '~/composables/useGame'
import { useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { currentGame, loadGame, addRound, updateRound, deleteRound, reversedRounds } = useCurrentGame()

const activeTab = ref<'bar' | 'line'>('bar')
const showModal = ref(false)
const showDeleteConfirm = ref(false)

// 编辑模式相关
const isEditMode = ref(false)
const editingRoundIndex = ref(0)
const editingRoundNumber = ref(0)
const editingScores = ref<number[]>([])
const roundToDelete = ref<number | null>(null)

// 加载游戏
const gameId = computed(() => route.params.id as string)

onMounted(async () => {
  await loadGame(gameId.value)
})

function goHome() {
  router.push('/')
}

function openAddModal() {
  isEditMode.value = false
  editingScores.value = []
  showModal.value = true
}

function openEditModal(index: number) {
  isEditMode.value = true
  editingRoundIndex.value = index
  editingRoundNumber.value = index + 1
  editingScores.value = [...currentGame.value!.rounds[index].scores]
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
}

function confirmDeleteRound(index: number) {
  roundToDelete.value = index
  showDeleteConfirm.value = true
}

async function executeDeleteRound() {
  if (roundToDelete.value !== null) {
    await deleteRound(roundToDelete.value)
    showDeleteConfirm.value = false
    roundToDelete.value = null
  }
}
</script>