import type { GameData, GameSession } from '~/types'

// 后端 API 调用封装（@vercel/postgres + @vercel/blob）

// 短时 in-flight 去重：相同 GET /api/room?id=x 在 2s 内复用同一个 Promise
// 应对 React 18 风格的多次订阅、轮询与写入后立即 reload 撞车
const inflightGet = new Map<string, Promise<GameSession | null>>()
const INFlight_TTL_MS = 2000
const inflightExpiry = new Map<string, number>()

function gcInflight() {
  const now = Date.now()
  for (const [k, exp] of inflightExpiry) {
    if (exp < now) {
      inflightGet.delete(k)
      inflightExpiry.delete(k)
    }
  }
}

// GET /api/room?id=xxx —— 查询；不存在返回 null
export async function getRoom(id: string): Promise<GameSession | null> {
  gcInflight()
  const key = `room:${id}`
  const cached = inflightGet.get(key)
  if (cached) return cached
  const p = (async () => {
    try {
      return await $fetch<GameSession>('/api/room', { query: { id } })
    } catch (e: any) {
      if (e?.statusCode === 404) return null
      throw e
    } finally {
      // 2s 后清掉，让后续请求能拿到最新数据
      setTimeout(() => {
        inflightGet.delete(key)
        inflightExpiry.delete(key)
      }, INFlight_TTL_MS)
    }
  })()
  inflightGet.set(key, p)
  inflightExpiry.set(key, Date.now() + INFlight_TTL_MS)
  return p
}

// POST /api/room?id=xxx —— 创建空房间
export async function createRoomApi(id: string): Promise<GameSession> {
  return await $fetch<GameSession>('/api/room', {
    method: 'POST',
    query: { id },
    body: { gameData: { rounds: [] } }
  })
}

// 客户端进入一个房间：先 GET，不存在则 POST 创建
export async function ensureRoom(id: string): Promise<GameSession | null> {
  let s = await getRoom(id)
  if (!s) {
    try {
      s = await createRoomApi(id)
    } catch {
      return null
    }
  }
  return s
}

// 房间摘要（用于首页列表）
export interface RoomSummary {
  roomId: string
  createdAt: number
  roundsCount: number
  lastActivityAt: number
}

// GET /api/rooms —— 列出所有房间（1.5s 短时缓存，避免和首页轮询撞车）
let listCache: { value: RoomSummary[]; expiresAt: number } | null = null
export async function listRooms(): Promise<RoomSummary[]> {
  if (listCache && listCache.expiresAt > Date.now()) return listCache.value
  const value = await $fetch<RoomSummary[]>('/api/rooms')
  listCache = { value, expiresAt: Date.now() + 1500 }
  return value
}

// POST /api/room?id=xxx —— 覆盖写入 gameData
export async function updateRoom(id: string, gameData: GameData): Promise<void> {
  await $fetch('/api/room', {
    method: 'POST',
    query: { id },
    body: { gameData }
  })
  // 写入后清掉自己房间的 in-flight，让轮询下次拿到新数据
  inflightGet.delete(`room:${id}`)
  inflightExpiry.delete(`room:${id}`)
  listCache = null
}

// DELETE /api/room?id=xxx —— 删除整局
export async function deleteRoom(id: string): Promise<void> {
  await $fetch('/api/room', { method: 'DELETE', query: { id } })
  inflightGet.delete(`room:${id}`)
  inflightExpiry.delete(`room:${id}`)
  listCache = null
}

// DELETE /api/rooms —— 清空所有房间
export async function deleteAllRooms(): Promise<{ deleted: number }> {
  const res = await $fetch<{ success: boolean; deleted: number }>('/api/rooms', { method: 'DELETE' })
  inflightGet.clear()
  inflightExpiry.clear()
  listCache = null
  return res
}

// POST /api/upload-avatar —— 上传头像到 Vercel Blob 并写入 players 表
export async function uploadAvatar(playerId: number, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('playerId', String(playerId))
  const res = await $fetch<{ success: boolean; url: string }>('/api/upload-avatar', {
    method: 'POST',
    body: form
  })
  return res.url
}
