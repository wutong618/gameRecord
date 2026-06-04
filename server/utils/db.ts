import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Game } from '~/types'

// 数据文件路径（相对于项目根）
const DATA_DIR = resolve(process.cwd(), 'server/data')
const DATA_FILE = resolve(DATA_DIR, 'games.json')

// 简单的内存锁，避免并发写入
let writeQueue: Promise<unknown> = Promise.resolve()

// 读取所有游戏
export async function readAllGames(): Promise<Game[]> {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf-8')
    const games = JSON.parse(text) as Game[]
    // 按创建时间倒序
    return games.sort((a, b) => b.createdAt - a.createdAt)
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      return []
    }
    throw e
  }
}

// 写入所有游戏（带锁，避免并发覆盖）
export function writeAllGames(games: Game[]): Promise<void> {
  const task = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(games, null, 2), 'utf-8')
  })
  writeQueue = task.catch(() => undefined)
  return task
}

// 生成 UUID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// 生成游戏名称
export function generateGameName(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

// 创建新游戏对象
export function createNewGame(): Game {
  return {
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
}

// 重新计算所有玩家的总分（基于当前 rounds）
export function recalcTotalScores(game: Game): void {
  game.players.forEach((player) => {
    player.totalScore = game.rounds.reduce(
      (sum, round) => sum + (round.scores[player.id] ?? 0),
      0
    )
  })
}
