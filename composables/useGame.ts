import { ref, computed } from 'vue'
import type { GameData, GameSession, PlayerProfile, Round } from '~/types'
import * as db from '~/composables/useDb'

// 单局（房间）状态管理
const currentSession = ref<GameSession | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isUploading = ref<number | null>(null) // 正在上传头像的玩家 id
const loadError = ref<string | null>(null) // 最近一次加载错误

export function useCurrentSession() {
  // 重新加载当前房间（轻量 GET，404 表示已被删）
  const reload = async (id: string): Promise<GameSession | null> => {
    isLoading.value = true
    loadError.value = null
    try {
      const session = await db.getRoom(id)
      if (session) {
        currentSession.value = session
      } else {
        currentSession.value = null
        loadError.value = '房间不存在'
      }
      return session
    } catch (e: any) {
      console.error('[reload]', e)
      loadError.value = e?.message || '网络错误，无法连接到服务器'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 首次进入房间：保证房间存在（不存在则创建），然后填入 currentSession
  const ensureAndLoad = async (id: string): Promise<GameSession | null> => {
    isLoading.value = true
    loadError.value = null
    try {
      const session = await db.ensureRoom(id)
      if (session) currentSession.value = session
      else loadError.value = '无法进入房间'
      return session
    } catch (e: any) {
      console.error('[ensureAndLoad]', e)
      loadError.value = e?.message || '网络错误，无法连接到服务器'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 应用服务端返回的最新数据（轮询用）
  const applySession = (session: GameSession | null) => {
    if (session) currentSession.value = session
  }

  // 提交 gameData 到服务端（内部使用：先本地更新再持久化）
  const persist = async (gameData: GameData) => {
    if (!currentSession.value) return
    isSaving.value = true
    try {
      await db.updateRoom(currentSession.value.roomId, gameData)
      // 重新拉取一次，确保拿到服务端时间戳等
      await reload(currentSession.value.roomId)
    } finally {
      isSaving.value = false
    }
  }

  // 添加一轮
  const addRound = async (scores: number[]) => {
    if (!currentSession.value) return
    const next: GameData = {
      rounds: [
        ...currentSession.value.gameData.rounds,
        {
          roundNumber: currentSession.value.gameData.rounds.length + 1,
          scores,
          createdAt: Date.now()
        }
      ]
    }
    await persist(next)
  }

  // 更新某一轮分数
  const updateRound = async (roundIndex: number, newScores: number[]) => {
    if (!currentSession.value) return
    const rounds = currentSession.value.gameData.rounds.map((r, i) =>
      i === roundIndex ? { ...r, scores: newScores } : r
    )
    await persist({ rounds })
  }

  // 删除某一轮
  const deleteRound = async (roundIndex: number) => {
    if (!currentSession.value) return
    const rounds = currentSession.value.gameData.rounds
      .filter((_, i) => i !== roundIndex)
      .map((r, i) => ({ ...r, roundNumber: i + 1 }))
    await persist({ rounds })
  }

  // 删除整局
  const deleteWholeRoom = async (): Promise<boolean> => {
    if (!currentSession.value) return false
    isSaving.value = true
    try {
      await db.deleteRoom(currentSession.value.roomId)
      currentSession.value = null
      return true
    } finally {
      isSaving.value = false
    }
  }

  // 上传头像（更新本地 players + 持久化）
  const uploadAvatar = async (playerId: number, file: File) => {
    isUploading.value = playerId
    try {
      const url = await db.uploadAvatar(playerId, file)
      // 立即在本地更新
      if (currentSession.value) {
        currentSession.value = {
          ...currentSession.value,
          players: currentSession.value.players.map(p =>
            p.id === playerId ? { ...p, avatarUrl: url } : p
          )
        }
      }
      return url
    } finally {
      isUploading.value = null
    }
  }

  // 累计分数
  const totalScores = computed<number[]>(() => {
    if (!currentSession.value) return [0, 0, 0, 0]
    const totals = [0, 0, 0, 0]
    for (const r of currentSession.value.gameData.rounds) {
      r.scores.forEach((s, i) => { totals[i] = (totals[i] ?? 0) + s })
    }
    return totals
  })

  // 倒序轮次
  const reversedRounds = computed<Round[]>(() => {
    if (!currentSession.value) return []
    return [...currentSession.value.gameData.rounds].reverse()
  })

  // 累计折线数据
  const cumulativeScores = computed(() => {
    const result: Record<string, number[]> = { wu: [0], wang: [0], lai: [0], jing: [0] }
    if (!currentSession.value) return result
    currentSession.value.gameData.rounds.forEach((round) => {
      result.wu.push((result.wu.at(-1) ?? 0) + round.scores[0])
      result.wang.push((result.wang.at(-1) ?? 0) + round.scores[1])
      result.lai.push((result.lai.at(-1) ?? 0) + round.scores[2])
      result.jing.push((result.jing.at(-1) ?? 0) + round.scores[3])
    })
    return result
  })

  return {
    currentSession,
    isLoading,
    isSaving,
    isUploading,
    totalScores,
    reversedRounds,
    cumulativeScores,
    reload,
    ensureAndLoad,
    applySession,
    addRound,
    updateRound,
    deleteRound,
    deleteWholeRoom,
    uploadAvatar,
    loadError
  }
}

// 工具：生成 room_id
export function generateRoomId(): string {
  // 8 字符短 ID，便于口头/链接分享
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
