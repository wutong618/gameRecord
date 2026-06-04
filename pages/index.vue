<template>
  <div class="min-h-screen bg-slate-900 pb-24">
    <!-- 顶部标题 -->
    <header class="p-6 text-center border-b border-slate-800">
      <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-pink">
        游戏记分器
      </h1>
      <p class="text-slate-400 text-sm mt-1">记录每一局的精彩瞬间</p>
    </header>

    <!-- 主要内容 -->
    <main class="p-4">
      <!-- 操作按钮组 -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <button
          class="py-4 rounded-xl font-bold text-lg bg-gradient-to-br from-neon-green to-emerald-500 text-slate-900 shadow-lg shadow-neon-green/20 active:scale-95 transition-all"
          @click="startNewGame"
        >
          + 开启新局
        </button>
        <div class="flex gap-2">
          <button
            class="flex-1 py-4 rounded-xl font-bold bg-slate-800 text-neon-blue border border-neon-blue/30 hover:bg-slate-700 transition-all text-sm"
            @click="triggerImport"
          >
            导入
          </button>
          <button
            class="flex-1 py-4 rounded-xl font-bold bg-slate-800 text-neon-pink border border-neon-pink/30 hover:bg-slate-700 transition-all text-sm"
            @click="exportCurrentGame"
            :disabled="!currentGame"
            :class="{ 'opacity-50 cursor-not-allowed': !currentGame }"
          >
            导出
          </button>
        </div>
      </div>

      <!-- 当前进行中的游戏提示 -->
      <div v-if="currentGame" class="mb-4 p-4 rounded-xl bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/30">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-neon-blue font-bold">当前进行中</p>
            <p class="text-slate-400 text-sm">{{ currentGame.name }}</p>
          </div>
          <button
            class="px-4 py-2 rounded-lg bg-neon-blue text-slate-900 font-bold text-sm"
            @click="continueGame"
          >
            继续
          </button>
        </div>
      </div>

      <!-- 历史游戏列表 -->
      <div v-if="games.length > 0">
        <h2 class="text-lg font-bold text-slate-300 mb-3">历史记录</h2>
        <div class="space-y-3">
          <GameHistoryCard
            v-for="game in games"
            :key="game.id"
            :game="game"
            @play="enterGame"
            @delete="confirmDelete"
          />
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">🎮</div>
        <p class="text-slate-400">还没有游戏记录</p>
        <p class="text-slate-500 text-sm">点击"开启新局"开始第一局</p>
      </div>
    </main>

    <!-- 隐藏文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleImport"
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
            <p class="text-slate-400 mb-6">此操作无法撤销，确定要删除这局游戏吗？</p>
            <div class="flex gap-3">
              <button
                class="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold"
                @click="showDeleteConfirm = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-3 rounded-xl bg-neon-pink text-white font-bold"
                @click="executeDelete"
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
import type { Game } from '~/types'
import { useGames, useCurrentGame } from '~/composables/useGame'
import { useRouter } from 'vue-router'

const router = useRouter()
const { games, loadGames, createNewGame, removeGame, importGameData, exportGameData } = useGames()
const { currentGame, setCurrentGame } = useCurrentGame()

const fileInput = ref<HTMLInputElement | null>(null)
const showDeleteConfirm = ref(false)
const gameToDelete = ref<string | null>(null)

// 加载游戏列表
onMounted(async () => {
  await loadGames()
  // 恢复当前游戏（最新的那局）
  if (games.value.length > 0) {
    const latestGame = games.value[0]
    if (latestGame.rounds.length > 0) {
      setCurrentGame(latestGame)
    }
  }
})

async function startNewGame() {
  const game = await createNewGame()
  setCurrentGame(game)
  router.push(`/game/${game.id}`)
}

function continueGame() {
  if (currentGame.value) {
    router.push(`/game/${currentGame.value.id}`)
  }
}

function enterGame(game: Game) {
  setCurrentGame(game)
  router.push(`/game/${game.id}`)
}

function confirmDelete(id: string) {
  gameToDelete.value = id
  showDeleteConfirm.value = true
}

async function executeDelete() {
  if (gameToDelete.value) {
    await removeGame(gameToDelete.value)
    showDeleteConfirm.value = false
    gameToDelete.value = null
  }
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const game = await importGameData(text)
    if (game) {
      setCurrentGame(game)
      router.push(`/game/${game.id}`)
    } else {
      alert('导入失败，请检查文件格式')
    }
  } catch (err) {
    alert('导入失败')
  }

  target.value = ''
}

async function exportCurrentGame() {
  if (!currentGame.value) return

  const json = await exportGameData(currentGame.value.id)
  if (!json) return

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentGame.value.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}
</script>