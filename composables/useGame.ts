import { ref, computed, watch } from 'vue'
import type { Game, Player, Round } from '~/types'
import { DEFAULT_PLAYERS } from '~/types'
import * as db from '~/composables/useDb'

// 全局游戏列表
const games = ref<Game[]>([])
const currentGame = ref<Game | null>(null)
const isLoading = ref(false)

// 加载所有游戏
export function useGames() {
  const loadGames = async () => {
    isLoading.value = true
    try {
      games.value = await db.getAllGames()
    } finally {
      isLoading.value = false
    }
  }

  const createNewGame = async (): Promise<Game> => {
    const game = await db.createGame()
    games.value.unshift(game)
    return game
  }

  const removeGame = async (id: string) => {
    await db.deleteGame(id)
    games.value = games.value.filter(g => g.id !== id)
    if (currentGame.value?.id === id) {
      currentGame.value = null
    }
  }

  const importGameData = async (jsonString: string): Promise<Game | undefined> => {
    const game = await db.importGame(jsonString)
    if (game) {
      games.value.unshift(game)
    }
    return game
  }

  const exportGameData = async (gameId: string): Promise<string | undefined> => {
    return await db.exportGame(gameId)
  }

  return {
    games,
    isLoading,
    loadGames,
    createNewGame,
    removeGame,
    importGameData,
    exportGameData
  }
}

// 当前游戏管理
export function useCurrentGame() {
  const setCurrentGame = (game: Game | null) => {
    currentGame.value = game
  }

  const loadGame = async (id: string): Promise<Game | undefined> => {
    isLoading.value = true
    try {
      const game = await db.getGame(id)
      if (game) {
        currentGame.value = game
      }
      return game
    } finally {
      isLoading.value = false
    }
  }

  // 添加轮次
  const addRound = async (scores: number[]) => {
    if (!currentGame.value) return
    const updated = await db.addRound(currentGame.value.id, scores)
    if (updated) {
      currentGame.value = updated
    }
  }

  // 更新轮次
  const updateRound = async (roundIndex: number, newScores: number[]) => {
    if (!currentGame.value) return
    const updated = await db.updateRound(currentGame.value.id, roundIndex, newScores)
    if (updated) {
      currentGame.value = updated
    }
  }

  // 删除轮次
  const deleteRound = async (roundIndex: number) => {
    if (!currentGame.value) return
    const updated = await db.deleteRound(currentGame.value.id, roundIndex)
    if (updated) {
      currentGame.value = updated
    }
  }

  // 计算累计分数（用于折线图）
  const cumulativeScores = computed(() => {
    if (!currentGame.value) return { wu: [], wang: [], lai: [], jing: [] }

    const result = { wu: [0], wang: [0], lai: [0], jing: [0] }
    currentGame.value.rounds.forEach(round => {
      const lastWu = result.wu[result.wu.length - 1]
      const lastWang = result.wang[result.wang.length - 1]
      const lastLai = result.lai[result.lai.length - 1]
      const lastJing = result.jing[result.jing.length - 1]
      result.wu.push(lastWu + round.scores[0])
      result.wang.push(lastWang + round.scores[1])
      result.lai.push(lastLai + round.scores[2])
      result.jing.push(lastJing + round.scores[3])
    })
    return result
  })

  // 轮次列表（倒序）
  const reversedRounds = computed(() => {
    if (!currentGame.value) return []
    return [...currentGame.value.rounds].reverse()
  })

  return {
    currentGame,
    isLoading,
    setCurrentGame,
    loadGame,
    addRound,
    updateRound,
    deleteRound,
    cumulativeScores,
    reversedRounds
  }
}