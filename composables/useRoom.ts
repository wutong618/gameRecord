import { ref, computed } from 'vue'
import type { GameSession, Round, User } from '~/types'
import * as db from '~/composables/useDb'

const currentSession = ref<GameSession | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)
const loadError = ref<string | null>(null)

export function useRoom() {
  // 进入/重新加载房间
  const loadRoom = async (roomId: string): Promise<GameSession | null> => {
    isLoading.value = true
    loadError.value = null
    try {
      const session = await db.getRoom(roomId)
      if (session) currentSession.value = session
      else loadError.value = '房间不存在'
      return session
    } catch (e: any) {
      loadError.value = e?.message ?? '网络错误'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 创建房间
  const createRoom = async (maxPlayers: number, creatorClientId: string) => {
    const session = await db.createRoomApi(maxPlayers, creatorClientId)
    currentSession.value = session
    return session
  }

  // 坐下
  const sitDown = async (roomId: string, clientId: string, seatIndex?: number) => {
    const res = await db.sitDown(roomId, clientId, seatIndex)
    currentSession.value = res.session
    return res.seat
  }

  // 添加一轮（server 会写入 recordedBy/recordedAt）
  const addRound = async (scores: number[], recorder: User) => {
    if (!currentSession.value) return
    isSaving.value = true
    try {
      const next: Round[] = [
        ...currentSession.value.gameData.rounds,
        {
          roundNumber: currentSession.value.gameData.rounds.length + 1,
          scores,
          recordedBy: recorder.id,
          recordedAt: Date.now()
        }
      ]
      await db.updateRoom(currentSession.value.roomId, { rounds: next })
      await loadRoom(currentSession.value.roomId)
    } finally {
      isSaving.value = false
    }
  }

  // 修改一轮
  const updateRound = async (roundIndex: number, newScores: number[], editor: User) => {
    if (!currentSession.value) return
    isSaving.value = true
    try {
      const rounds = currentSession.value.gameData.rounds.map((r, i) =>
        i === roundIndex
          ? { ...r, scores: newScores, updatedBy: editor.id, updatedAt: Date.now() }
          : r
      )
      await db.updateRoom(currentSession.value.roomId, { rounds })
      await loadRoom(currentSession.value.roomId)
    } finally {
      isSaving.value = false
    }
  }

  // 删除一轮
  const deleteRound = async (roundIndex: number) => {
    if (!currentSession.value) return
    isSaving.value = true
    try {
      const rounds = currentSession.value.gameData.rounds
        .filter((_, i) => i !== roundIndex)
        .map((r, i) => ({ ...r, roundNumber: i + 1 }))
      await db.updateRoom(currentSession.value.roomId, { rounds })
      await loadRoom(currentSession.value.roomId)
    } finally {
      isSaving.value = false
    }
  }

  // 删除整局
  const deleteWholeRoom = async () => {
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

  // 各玩家累计分
  const totalScores = computed(() => {
    const arr = new Array(currentSession.value?.maxPlayers ?? 0).fill(0)
    if (!currentSession.value) return arr
    for (const r of currentSession.value.gameData.rounds) {
      r.scores.forEach((s, i) => { arr[i] = (arr[i] ?? 0) + s })
    }
    return arr
  })

  // 倒序轮次
  const reversedRounds = computed<Round[]>(() => {
    if (!currentSession.value) return []
    return [...currentSession.value.gameData.rounds].reverse()
  })

  // 累计折线
  const cumulativeScores = computed(() => {
    const n = currentSession.value?.maxPlayers ?? 0
    const result: number[][] = Array.from({ length: n }, () => [0])
    if (!currentSession.value) return result
    for (const round of currentSession.value.gameData.rounds) {
      round.scores.forEach((s, i) => {
        const last = result[i][result[i].length - 1] ?? 0
        result[i].push(last + s)
      })
    }
    return result
  })

  return {
    currentSession,
    isLoading,
    isSaving,
    loadError,
    totalScores,
    reversedRounds,
    cumulativeScores,
    loadRoom,
    createRoom,
    sitDown,
    addRound,
    updateRound,
    deleteRound,
    deleteWholeRoom
  }
}
