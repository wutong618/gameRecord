import { sql } from './postgres'
import { initDb } from './init-db'
import { cacheGet, cacheSet, cacheInvalidate } from './cache'
import type { GameData, GameSession, PlayerProfile, Round } from '~/types'

// 缓存键前缀
const PLAYERS_CACHE_KEY = 'players:all'
const ROOM_CACHE_KEY = (id: string) => `room:${id}`

export function invalidateRoomCache(roomId?: string) {
  if (roomId) cacheInvalidate(`room:${roomId}`)
  else cacheInvalidate('room:')
}

// 读一行 players
type PlayerRow = {
  id: number
  name: string
  avatar_url: string | null
  color: string
}

function rowToPlayer(row: PlayerRow): PlayerProfile {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    color: row.color
  }
}

// 获取所有玩家档案（按 id 升序，5s 缓存）
export async function getAllPlayers(): Promise<PlayerProfile[]> {
  const cached = cacheGet<PlayerProfile[]>(PLAYERS_CACHE_KEY)
  if (cached) return cached
  const { rows } = await sql<PlayerRow>`SELECT id, name, avatar_url, color FROM players ORDER BY id ASC`
  const players = rows.map(rowToPlayer)
  cacheSet(PLAYERS_CACHE_KEY, players, 5000)
  return players
}

// 单个玩家档案
export async function getPlayer(id: number): Promise<PlayerProfile | null> {
  const { rows } = await sql<PlayerRow>`SELECT id, name, avatar_url, color FROM players WHERE id = ${id} LIMIT 1`
  return rows[0] ? rowToPlayer(rows[0]) : null
}

// 更新玩家头像 URL
export async function setPlayerAvatar(id: number, avatarUrl: string | null): Promise<void> {
  await sql`UPDATE players SET avatar_url = ${avatarUrl} WHERE id = ${id}`
  cacheInvalidate('players:') // 失效 players 缓存，下次 getAllPlayers 重新查
}

// 房间类型
type SessionRow = {
  room_id: string
  created_at: string | number
  game_data: GameData | string
}

function parseGameData(raw: GameData | string): GameData {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as GameData } catch { return { rounds: [] } }
  }
  return raw
}

function rowToSession(row: SessionRow, players: PlayerProfile[]): GameSession {
  return {
    roomId: row.room_id,
    createdAt: typeof row.created_at === 'string' ? Number(row.created_at) : row.created_at,
    gameData: parseGameData(row.game_data),
    players
  }
}

// 查询房间；不存在返回 null（不自动创建，避免删除后被轮询重建）
// 5s 进程内缓存：4s 轮询场景下，第一次 DB 查询，5s 内后续全部命中
export async function getRoom(roomId: string): Promise<GameSession | null> {
  const cached = cacheGet<GameSession | null>(ROOM_CACHE_KEY(roomId))
  if (cached !== null && cached !== undefined) return cached
  await initDb()
  const players = await getAllPlayers()
  const { rows } = await sql<SessionRow>`SELECT room_id, created_at, game_data FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`
  if (!rows[0]) {
    cacheSet(ROOM_CACHE_KEY(roomId), null, 2000) // 短缓存防止 404 风暴
    return null
  }
  const session = rowToSession(rows[0], players)
  cacheSet(ROOM_CACHE_KEY(roomId), session, 5000)
  return session
}

// 显式创建空房间
export async function createEmptyRoom(roomId: string): Promise<GameSession> {
  await initDb()
  const players = await getAllPlayers()
  const createdAt = Date.now()
  // ON CONFLICT DO NOTHING 处理并发：第一个写赢，其他拿到已存在的那行
  await sql`
    INSERT INTO game_sessions (room_id, created_at, game_data)
    VALUES (${roomId}, ${createdAt}, ${JSON.stringify({ rounds: [] })})
    ON CONFLICT (room_id) DO NOTHING
  `
  // 重新读，确保拿到实际落库的那行（可能已有 createdAt 不是本次的）
  const { rows } = await sql<SessionRow>`SELECT room_id, created_at, game_data FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`
  return rowToSession(rows[0], players)
}

// 覆盖写入房间的 game_data（不存在则创建空壳）；写后立即失效缓存
export async function updateRoomGameData(roomId: string, gameData: GameData): Promise<void> {
  await initDb()
  await sql`
    INSERT INTO game_sessions (room_id, created_at, game_data)
    VALUES (${roomId}, ${Date.now()}, ${JSON.stringify(gameData)})
    ON CONFLICT (room_id) DO UPDATE SET game_data = EXCLUDED.game_data
  `
  invalidateRoomCache(roomId)
}

// 删除房间
export async function deleteRoom(roomId: string): Promise<boolean> {
  const result = await sql`DELETE FROM game_sessions WHERE room_id = ${roomId}`
  invalidateRoomCache(roomId)
  return (result.rowCount ?? 0) > 0
}

// 清空所有房间
export async function deleteAllRooms(): Promise<number> {
  const result = await sql`DELETE FROM game_sessions`
  cacheInvalidate('room:')
  return result.rowCount ?? 0
}

// 房间摘要（用于首页历史列表）
export interface RoomSummary {
  roomId: string
  createdAt: number
  roundsCount: number
  lastActivityAt: number
}

// 列出所有房间摘要（按最后活跃时间倒序，2s 缓存）
export async function listRooms(): Promise<RoomSummary[]> {
  const KEY = 'rooms:list'
  const cached = cacheGet<RoomSummary[]>(KEY)
  if (cached) return cached
  const { rows } = await sql<SessionRow>`SELECT room_id, created_at, game_data FROM game_sessions`
  const list = rows
    .map((r) => {
      const gd = parseGameData(r.game_data)
      const createdAt = typeof r.created_at === 'string' ? Number(r.created_at) : r.created_at
      const lastRound = gd.rounds[gd.rounds.length - 1]
      return {
        roomId: r.room_id,
        createdAt,
        roundsCount: gd.rounds.length,
        lastActivityAt: lastRound?.createdAt ?? createdAt
      }
    })
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  cacheSet(KEY, list, 2000)
  return list
}

// 工具：从 round[] 计算各玩家累计分（避免前端重复实现）
export function calcTotalScores(rounds: Round[]): number[] {
  const totals = [0, 0, 0, 0]
  for (const r of rounds) {
    r.scores.forEach((s, i) => { totals[i] = (totals[i] ?? 0) + s })
  }
  return totals
}
