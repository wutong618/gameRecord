import Dexie, { type Table } from 'dexie'
import type { Game, Player, Round } from '~/types'

// 数据库类
class GameDatabase extends Dexie {
  games!: Table<Game>

  constructor() {
    super('GameScoreDB')
    this.version(1).stores({
      games: 'id, name, createdAt'
    })
  }
}

// 创建数据库实例（单例）
const db = new GameDatabase()

// 生成UUID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 生成游戏名称
export function generateGameName(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

// 获取所有游戏列表
export async function getAllGames(): Promise<Game[]> {
  return await db.games.orderBy('createdAt').reverse().toArray()
}

// 获取指定游戏
export async function getGame(id: string): Promise<Game | undefined> {
  return await db.games.get(id)
}

// 创建新游戏
export async function createGame(): Promise<Game> {
  const game: Game = {
    id: generateId(),
    name: generateGameName(),
    createdAt: Date.now(),
    players: [
      { id: 0, name: '吴', color: 'fire-red', totalScore: 0 },
      { id: 1, name: '王', color: 'deep-sea-blue', totalScore: 0 },
      { id: 2, name: '来', color: 'emerald-green', totalScore: 0 },
      { id: 3, name: '静', color: 'night-purple', totalScore: 0 }
    ],
    rounds: []
  }
  await db.games.add(game)
  return game
}

// 更新游戏
export async function updateGame(game: Game): Promise<void> {
  await db.games.put(game)
}

// 添加轮次
export async function addRound(gameId: string, scores: number[]): Promise<Game | undefined> {
  const game = await db.games.get(gameId)
  if (!game) return undefined

  const roundNumber = game.rounds.length + 1
  const newRound: Round = {
    roundNumber,
    scores,
    createdAt: Date.now()
  }

  // 更新玩家总分
  game.players.forEach((player, index) => {
    player.totalScore += scores[index]
  })

  game.rounds.push(newRound)
  await db.games.put(game)
  return game
}

// 更新轮次
export async function updateRound(gameId: string, roundIndex: number, newScores: number[]): Promise<Game | undefined> {
  const game = await db.games.get(gameId)
  if (!game || !game.rounds[roundIndex]) return undefined

  const oldScores = game.rounds[roundIndex].scores

  // 重新计算所有玩家总分
  game.players.forEach((player, index) => {
    player.totalScore = 0
    game.rounds.forEach((round, rIndex) => {
      if (rIndex === roundIndex) {
        player.totalScore += newScores[index]
      } else {
        player.totalScore += round.scores[index]
      }
    })
  })

  game.rounds[roundIndex].scores = newScores
  await db.games.put(game)
  return game
}

// 删除轮次
export async function deleteRound(gameId: string, roundIndex: number): Promise<Game | undefined> {
  const game = await db.games.get(gameId)
  if (!game || !game.rounds[roundIndex]) return undefined

  // 移除该轮次
  game.rounds.splice(roundIndex, 1)

  // 重新计算轮次编号和总分
  game.rounds.forEach((round, index) => {
    round.roundNumber = index + 1
  })

  game.players.forEach(player => {
    player.totalScore = game.rounds.reduce((sum, round) => sum + round.scores[player.id], 0)
  })

  await db.games.put(game)
  return game
}

// 删除游戏
export async function deleteGame(id: string): Promise<void> {
  await db.games.delete(id)
}

// 导出游戏数据为JSON
export async function exportGame(gameId: string): Promise<string | undefined> {
  const game = await db.games.get(gameId)
  if (!game) return undefined
  return JSON.stringify(game, null, 2)
}

// 导入游戏数据
export async function importGame(jsonString: string): Promise<Game | undefined> {
  try {
    const game = JSON.parse(jsonString) as Game
    // 生成新ID和时间戳，确保不冲突
    game.id = generateId()
    game.createdAt = Date.now()
    // 重新初始化玩家分数
    game.players.forEach(p => p.totalScore = 0)
    game.rounds.forEach((round, index) => {
      round.roundNumber = index + 1
      game.players.forEach((player, pIndex) => {
        player.totalScore += round.scores[pIndex]
      })
    })
    await db.games.add(game)
    return game
  } catch (e) {
    console.error('Import failed:', e)
    return undefined
  }
}

export { db }