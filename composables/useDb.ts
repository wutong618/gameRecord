import type { GameData, GameSession, User } from '~/types'

// v3.0 API 封装

// 短时 in-flight 去重：相同 GET 在 2s 内复用同一个 Promise
const inflightGet = new Map<string, Promise<any>>()
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

// ====================
// Users
// ====================

// POST /api/users/temp —— 用 clientId 创建/获取临时用户
export async function ensureTempUser(clientId: string): Promise<User> {
  return await $fetch<User>('/api/users/temp', { method: 'POST', body: { clientId } })
}

// GET /api/users/me?clientId=xxx —— 查用户
export async function getUser(clientId: string): Promise<User | null> {
  gcInflight()
  const key = `user:${clientId}`
  const cached = inflightGet.get(key)
  if (cached) return cached
  const p = $fetch<User | null>('/api/users/me', { query: { clientId } })
    .catch((e) => { if (e?.statusCode === 404) return null; throw e })
    .finally(() => {
      setTimeout(() => {
        inflightGet.delete(key)
        inflightExpiry.delete(key)
      }, 2000)
    })
  inflightGet.set(key, p)
  inflightExpiry.set(key, Date.now() + 2000)
  return p
}

// PUT /api/users/me —— 改昵称/头像
export async function updateUser(
  clientId: string,
  patch: { nickname?: string; avatarUrl?: string | null; avatarColor?: string | null }
): Promise<User> {
  return await $fetch<User>('/api/users/me', { method: 'PUT', body: { clientId, ...patch } })
}

// POST /api/users/bind-wechat (mock)
export async function bindWechat(
  clientId: string,
  openid: string,
  nickname: string,
  avatarUrl: string
): Promise<User> {
  return await $fetch<User>('/api/users/bind-wechat', {
    method: 'POST',
    body: { clientId, openid, nickname, avatarUrl }
  })
}

// ====================
// Rooms
// ====================

// 房间摘要
export interface RoomSummary {
  roomId: string
  name: string | null
  createdAt: number
  maxPlayers: number
  seatedCount: number
  roundsCount: number
  lastActivityAt: number
}

// GET /api/room?id=xxx —— 查询
export async function getRoom(id: string): Promise<GameSession | null> {
  try {
    return await $fetch<GameSession>('/api/room', { query: { id } })
  } catch (e: any) {
    if (e?.statusCode === 404) return null
    throw e
  }
}

// POST /api/room?id=xxx —— 覆盖 gameData
export async function updateRoom(id: string, gameData: GameData): Promise<void> {
  await $fetch('/api/room', { method: 'POST', query: { id }, body: { gameData } })
}

// POST /api/rooms —— 创建房间（房主自动坐 seat 0）
export async function createRoomApi(
  maxPlayers: number,
  creatorClientId: string,
  name?: string
): Promise<GameSession> {
  return await $fetch<GameSession>('/api/rooms', {
    method: 'POST',
    body: { maxPlayers, creatorClientId, name }
  })
}

// POST /api/rooms/:id/seat —— 坐下（已坐会换座位）
export async function sitDown(
  roomId: string,
  clientId: string,
  seatIndex?: number
): Promise<{ seat: any; session: GameSession; switched: boolean }> {
  return await $fetch<{ seat: any; session: GameSession; switched: boolean }>(`/api/rooms/${roomId}/seat`, {
    method: 'POST',
    body: { clientId, seatIndex }
  })
}

// DELETE /api/room?id=xxx —— 删除整局
export async function deleteRoom(id: string): Promise<void> {
  await $fetch('/api/room', { method: 'DELETE', query: { id } })
}

// GET /api/rooms —— 列出所有房间
let listCache: { value: RoomSummary[]; expiresAt: number } | null = null
export async function listRooms(): Promise<RoomSummary[]> {
  if (listCache && listCache.expiresAt > Date.now()) return listCache.value
  const value = await $fetch<RoomSummary[]>('/api/rooms')
  listCache = { value, expiresAt: Date.now() + 1500 }
  return value
}

// DELETE /api/rooms —— 清空所有房间
export async function deleteAllRooms(): Promise<{ deleted: number }> {
  const res = await $fetch<{ success: boolean; deleted: number }>('/api/rooms', { method: 'DELETE' })
  inflightGet.clear()
  inflightExpiry.clear()
  listCache = null
  return res
}
