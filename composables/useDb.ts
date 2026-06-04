import type { Game, Round } from '~/types'

// 注意：数据持久化已迁移到服务端（server/api/games/*），
// 所有用户访问同一份 server/data/games.json。

// 获取所有游戏
export async function getAllGames(): Promise<Game[]> {
  return await $fetch<Game[]>('/api/games')
}

// 获取指定游戏
export async function getGame(id: string): Promise<Game | undefined> {
  try {
    return await $fetch<Game>(`/api/games/${id}`)
  } catch (e: any) {
    if (e?.statusCode === 404) return undefined
    throw e
  }
}

// 创建新游戏
export async function createGame(): Promise<Game> {
  return await $fetch<Game>('/api/games', { method: 'POST' })
}

// 更新游戏（整体替换）
export async function updateGame(game: Game): Promise<void> {
  await $fetch(`/api/games/${game.id}`, {
    method: 'PUT',
    body: game
  })
}

// 添加轮次
export async function addRound(gameId: string, scores: number[]): Promise<Game | undefined> {
  const game = await getGame(gameId)
  if (!game) return undefined

  const newRound: Round = {
    roundNumber: game.rounds.length + 1,
    scores,
    createdAt: Date.now()
  }

  game.rounds.push(newRound)
  // 重新计算玩家总分
  game.players.forEach((player, index) => {
    player.totalScore += scores[index]
  })

  await updateGame(game)
  return game
}

// 更新轮次
export async function updateRound(gameId: string, roundIndex: number, newScores: number[]): Promise<Game | undefined> {
  const game = await getGame(gameId)
  if (!game || !game.rounds[roundIndex]) return undefined

  game.rounds[roundIndex].scores = newScores
  // 重新计算所有玩家总分
  game.players.forEach((player, index) => {
    player.totalScore = game.rounds.reduce(
      (sum, round) => sum + round.scores[index],
      0
    )
  })

  await updateGame(game)
  return game
}

// 删除轮次
export async function deleteRound(gameId: string, roundIndex: number): Promise<Game | undefined> {
  const game = await getGame(gameId)
  if (!game || !game.rounds[roundIndex]) return undefined

  game.rounds.splice(roundIndex, 1)
  // 重新计算轮次编号
  game.rounds.forEach((round, index) => {
    round.roundNumber = index + 1
  })
  // 重新计算所有玩家总分
  game.players.forEach((player) => {
    player.totalScore = game.rounds.reduce(
      (sum, round) => sum + round.scores[player.id],
      0
    )
  })

  await updateGame(game)
  return game
}

// 删除游戏
export async function deleteGame(id: string): Promise<void> {
  await $fetch(`/api/games/${id}`, { method: 'DELETE' })
}

// 导出游戏数据为JSON
export async function exportGame(gameId: string): Promise<string | undefined> {
  const game = await getGame(gameId)
  if (!game) return undefined
  return JSON.stringify(game, null, 2)
}

// 导入游戏数据：客户端解析校验后由服务端创建
export async function importGame(jsonString: string): Promise<Game | undefined> {
  try {
    const parsed = JSON.parse(jsonString) as Game
    if (!parsed || !Array.isArray(parsed.players) || !Array.isArray(parsed.rounds)) {
      return undefined
    }
    // 服务端会重新生成 id 和 createdAt 并重算总分
    return await $fetch<Game>('/api/games', {
      method: 'POST',
      body: parsed
    })
  } catch (e) {
    console.error('Import failed:', e)
    return undefined
  }
}
