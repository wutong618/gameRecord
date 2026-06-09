import { sql } from './postgres'
import { initDb } from './init-db'
import { cacheGet, cacheSet, cacheInvalidate } from './cache'
import {
  randomNickname,
  PLAYER_COLORS,
  type GameData,
  type GameSession,
  type Round,
  type Seat,
  type User,
  type PlayerColorKey
} from '~/types'

// 缓存键
const PLAYERS_CACHE_KEY = 'players:all' // 保留旧 key 占位
const ROOM_CACHE_KEY = (id: string) => `room:${id}`

export function invalidateRoomCache(roomId?: string) {
  if (roomId) cacheInvalidate(`room:${roomId}`)
  else cacheInvalidate('room:')
}

// ====================
// Users
// ====================

// 颜色池（用于生成纯文字头像的随机色）
const COLOR_KEYS = Object.keys(PLAYER_COLORS) as PlayerColorKey[]
function randomAvatarColor(): string {
  return COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]
}

type UserRow = {
  id: string | number
  client_id: string
  openid: string | null
  unionid: string | null
  nickname: string
  avatar_url: string | null
  avatar_color: string | null
  is_temporary: boolean
  is_vip: boolean
  created_at: string | number
}

function rowToUser(r: UserRow): User {
  return {
    id: Number(r.id),
    clientId: r.client_id,
    openid: r.openid,
    unionid: r.unionid,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    avatarColor: r.avatar_color,
    isTemporary: r.is_temporary,
    isVip: r.is_vip,
    createdAt: typeof r.created_at === 'string' ? Number(r.created_at) : r.created_at
  }
}

// 用 client_id 拿或创建临时用户
export async function getOrCreateTempUser(clientId: string): Promise<User> {
  await initDb()
  // 先查
  const found = await sql<UserRow>`SELECT * FROM users WHERE client_id = ${clientId} LIMIT 1`
  if (found.rows[0]) return rowToUser(found.rows[0])
  // 创建
  const nickname = randomNickname()
  const avatarColor = randomAvatarColor()
  const createdAt = Date.now()
  const inserted = await sql<UserRow>`
    INSERT INTO users (client_id, nickname, avatar_color, is_temporary, is_vip, created_at)
    VALUES (${clientId}, ${nickname}, ${avatarColor}, TRUE, FALSE, ${createdAt})
    RETURNING *
  `
  return rowToUser(inserted.rows[0])
}

// 按 id 查
export async function getUserById(id: number): Promise<User | null> {
  const { rows } = await sql<UserRow>`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return rows[0] ? rowToUser(rows[0]) : null
}

// 更新用户档案
export async function updateUser(
  id: number,
  patch: { nickname?: string; avatarUrl?: string | null; avatarColor?: string | null }
): Promise<User | null> {
  // 动态 SQL：只更新提供的字段
  const sets: string[] = []
  const values: any[] = []
  let i = 1
  if (patch.nickname !== undefined) {
    sets.push(`nickname = $${i++}`)
    values.push(patch.nickname)
  }
  if (patch.avatarUrl !== undefined) {
    sets.push(`avatar_url = $${i++}`)
    values.push(patch.avatarUrl)
  }
  if (patch.avatarColor !== undefined) {
    sets.push(`avatar_color = $${i++}`)
    values.push(patch.avatarColor)
  }
  if (sets.length === 0) return await getUserById(id)
  values.push(id)
  const { rows } = await sql.query<UserRow>(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  )
  return rows[0] ? rowToUser(rows[0]) : null
}

// 微信绑定（mock）：把 openid 写入 + is_temporary = false
export async function bindWechat(
  clientId: string,
  openid: string,
  nickname: string,
  avatarUrl: string
): Promise<User | null> {
  // 若该 openid 已绑定其他 user，把那个 user 的资料覆盖到当前 clientId 上
  // 简化版：直接更新当前 clientId 对应 user
  const sets: string[] = [
    'openid = $1',
    'is_temporary = FALSE',
    'nickname = $2',
    'avatar_url = $3'
  ]
  const values: any[] = [openid, nickname, avatarUrl]
  // WHERE client_id = $4
  values.push(clientId)
  const { rows } = await sql.query<UserRow>(
    `UPDATE users SET ${sets.join(', ')} WHERE client_id = $${values.length} RETURNING *`,
    values
  )
  return rows[0] ? rowToUser(rows[0]) : null
}

// ====================
// Seats & Rooms
// ====================

// 列出一个房间的所有座位（join users）
async function getRoomSeats(roomId: string): Promise<Seat[]> {
  // 先查房间的 max_players
  const session = await sql<{ max_players: number }>`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `
  const max = session.rows[0]?.max_players ?? 4
  // 再查所有已占座位（带 seat_index）
  const occupied = await sql<{ seat_index: number } & UserRow>`
    SELECT sp.seat_index, u.* FROM session_players sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.room_id = ${roomId}
    ORDER BY sp.seat_index ASC
  `
  const m2 = new Map<number, User>()
  for (const r of occupied.rows) {
    m2.set(r.seat_index, rowToUser(r))
  }
  const seats: Seat[] = []
  for (let i = 0; i < max; i++) {
    seats.push({ seatIndex: i, user: m2.get(i) ?? null })
  }
  return seats
}

// 取房间（含 seats + game_data），5s 缓存
export async function getRoomWithSeats(roomId: string): Promise<GameSession | null> {
  const cached = cacheGet<GameSession | null>(ROOM_CACHE_KEY(roomId))
  if (cached !== null && cached !== undefined) return cached
  await initDb()
  const sessionRes = await sql<{
    room_id: string
    created_at: string | number
    max_players: number
    name: string | null
    game_data: GameData | string
  }>`SELECT room_id, created_at, max_players, name, game_data FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`
  if (!sessionRes.rows[0]) {
    cacheSet(ROOM_CACHE_KEY(roomId), null, 2000)
    return null
  }
  const row = sessionRes.rows[0]
  const gameData = typeof row.game_data === 'string' ? JSON.parse(row.game_data) : row.game_data
  const seats = await getRoomSeats(roomId)
  const session: GameSession = {
    roomId: row.room_id,
    createdAt: typeof row.created_at === 'string' ? Number(row.created_at) : row.created_at,
    maxPlayers: row.max_players,
    name: row.name,
    gameData,
    seats
  }
  cacheSet(ROOM_CACHE_KEY(roomId), session, 10000)
  return session
}

// 创建房间：返回新建 session（含 creator 坐在 seat 0）
export async function createRoomWithCreator(
  roomId: string,
  maxPlayers: number,
  creatorUserId: number,
  name?: string | null
): Promise<GameSession> {
  await initDb()
  // 先确保 user 存在
  const user = await getUserById(creatorUserId)
  if (!user) throw new Error('creator user 不存在')
  // 创建 session + 占座（用事务保证原子性）
  const createdAt = Date.now()
  const safeName = (name || '').trim().slice(0, 30) || null
  await sql`
    INSERT INTO game_sessions (room_id, created_at, max_players, name, game_data)
    VALUES (${roomId}, ${createdAt}, ${maxPlayers}, ${safeName}, ${JSON.stringify({ rounds: [] })})
    ON CONFLICT (room_id) DO NOTHING
  `
  // 坐下 seat 0（ON CONFLICT 兜底）
  await sql`
    INSERT INTO session_players (room_id, user_id, seat_index, joined_at)
    VALUES (${roomId}, ${creatorUserId}, 0, ${createdAt})
    ON CONFLICT (room_id, seat_index) DO NOTHING
  `
  invalidateRoomCache(roomId)
  const session = await getRoomWithSeats(roomId)
  if (!session) throw new Error('创建房间后查询失败')
  return session
}

// 坐下：user_id 坐到 seat_index（不指定则分配第一个空位）
// 如果该 user 已在该 room 内某个座位上，会"换座位"（先 DELETE 旧位置）
export async function seatPlayer(
  roomId: string,
  userId: number,
  seatIndex?: number
): Promise<{ seat: Seat; session: GameSession; switched: boolean }> {
  await initDb()
  // 先校验房间存在
  const sess = await sql<{ max_players: number }>`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `
  if (!sess.rows[0]) throw new Error('房间不存在')
  const max = sess.rows[0].max_players

  // 查 user 当前是否已在该 room
  const existing = await sql<{ seat_index: number }>`
    SELECT seat_index FROM session_players WHERE room_id = ${roomId} AND user_id = ${userId} LIMIT 1
  `
  const currentSeat = existing.rows[0]?.seat_index
  const switched = currentSeat !== undefined

  let targetIndex = seatIndex
  if (targetIndex === undefined) {
    // 找第一个空位
    const occupied = await sql<{ seat_index: number }>`
      SELECT seat_index FROM session_players WHERE room_id = ${roomId}
    `
    const taken = new Set(occupied.rows.map(r => r.seat_index))
    // 如果换座位，原位置也算"空"
    targetIndex = -1
    for (let i = 0; i < max; i++) {
      if (!taken.has(i) || i === currentSeat) { targetIndex = i; break }
    }
    if (targetIndex === -1) throw new Error('房间已满')
  } else {
    if (targetIndex < 0 || targetIndex >= max) throw new Error('seatIndex 越界')
    // 如果目标位置被别人占了，且不是自己
    if (targetIndex !== currentSeat) {
      const exists = await sql`
        SELECT 1 FROM session_players WHERE room_id = ${roomId} AND seat_index = ${targetIndex} LIMIT 1
      `
      if (exists.rows[0]) throw new Error('该位置已被占用')
    }
  }

  // 换座位 / 新坐下：先 DELETE 旧位置（如果存在）
  if (currentSeat !== undefined && currentSeat !== targetIndex) {
    await sql`DELETE FROM session_players WHERE room_id = ${roomId} AND user_id = ${userId}`
  }
  // INSERT 新位置（如果还没占）
  if (currentSeat !== targetIndex) {
    await sql`
      INSERT INTO session_players (room_id, user_id, seat_index, joined_at)
      VALUES (${roomId}, ${userId}, ${targetIndex}, ${Date.now()})
    `
  }
  invalidateRoomCache(roomId)
  const session = await getRoomWithSeats(roomId)
  if (!session) throw new Error('坐下后查询失败')
  return { seat: session.seats[targetIndex], session, switched }
}

// 离座（可选）
export async function leaveSeat(roomId: string, seatIndex: number): Promise<void> {
  await sql`DELETE FROM session_players WHERE room_id = ${roomId} AND seat_index = ${seatIndex}`
  invalidateRoomCache(roomId)
}

// 覆盖写入 game_data；server 端校验 recordedBy 是该房间的 user
export async function updateRoomGameData(
  roomId: string,
  gameData: GameData
): Promise<void> {
  await initDb()
  const exists = await sql`SELECT 1 FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`
  if (!exists.rows[0]) {
    // 隐式创建
    await sql`
      INSERT INTO game_sessions (room_id, created_at, max_players, game_data)
      VALUES (${roomId}, ${Date.now()}, 4, ${JSON.stringify(gameData)})
    `
    return
  }
  // 校验 rounds.scores 长度与 max_players 一致
  const roomMeta = await sql<{ max_players: number }>`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `
  const max = roomMeta.rows[0]?.max_players ?? 4
  for (const r of gameData.rounds) {
    if (r.scores.length !== max) {
      throw new Error(`round ${r.roundNumber} scores 长度 ${r.scores.length} 与 max_players ${max} 不一致`)
    }
  }
  await sql`
    UPDATE game_sessions
    SET game_data = ${JSON.stringify(gameData)}
    WHERE room_id = ${roomId}
  `
  invalidateRoomCache(roomId)
}

// 删除房间
export async function deleteRoom(roomId: string): Promise<boolean> {
  const result = await sql`DELETE FROM game_sessions WHERE room_id = ${roomId}`
  invalidateRoomCache(roomId)
  return (result.rowCount ?? 0) > 0
}

// 清空指定用户参与过的房间（clientId 为空时删全部——admin/调试用）
export async function deleteAllRooms(clientId?: string): Promise<number> {
  let result
  if (clientId) {
    // 找该 user 坐过的所有 room_id，再删
    const userRow = await sql<{ id: number }>`SELECT id FROM users WHERE client_id = ${clientId} LIMIT 1`
    if (!userRow.rows[0]) return 0
    const uid = userRow.rows[0].id
    result = await sql`
      DELETE FROM game_sessions
      WHERE room_id IN (SELECT room_id FROM session_players WHERE user_id = ${uid})
    `
  } else {
    result = await sql`DELETE FROM game_sessions`
  }
  cacheInvalidate('room:')
  cacheInvalidate('rooms:list')  // 也清掉 listRooms 缓存
  return result.rowCount ?? 0
}

// 列出所有房间摘要（可选 clientId：只返回该 user 参与过的房间）
export interface RoomSummary {
  roomId: string
  name: string | null
  createdAt: number
  maxPlayers: number
  seatedCount: number
  roundsCount: number
  lastActivityAt: number
}

export async function listRooms(clientId?: string): Promise<RoomSummary[]> {
  // cache key 包含 clientId，避免不同用户拿错
  const KEY = clientId ? `rooms:list:${clientId}` : 'rooms:list:all'
  const cached = cacheGet<RoomSummary[]>(KEY)
  if (cached) return cached
  await initDb()

  // 解析 userId（如果给了 clientId）
  let userId: number | null = null
  if (clientId) {
    const u = await sql<{ id: number }>`SELECT id FROM users WHERE client_id = ${clientId} LIMIT 1`
    if (!u.rows[0]) {
      // clientId 给了但 user 不存在（无效 clientId）→ 返回空
      cacheSet(KEY, [], 5000)
      return []
    }
    userId = u.rows[0].id
  }

  // 用 sql.query() 动态拼接：tagged template 不能嵌套
  const sessRows = userId
    ? await sql.query<{
        room_id: string
        name: string | null
        created_at: string | number
        max_players: number
        game_data: GameData | string
      }>(
        `SELECT gs.room_id, gs.name, gs.created_at, gs.max_players, gs.game_data
         FROM game_sessions gs
         WHERE EXISTS (
           SELECT 1 FROM session_players sp
           WHERE sp.room_id = gs.room_id AND sp.user_id = $1
         )`,
        [userId]
      )
    : await sql<{
        room_id: string
        name: string | null
        created_at: string | number
        max_players: number
        game_data: GameData | string
      }>`SELECT room_id, name, created_at, max_players, game_data FROM game_sessions`

  const countRows = await sql<{ room_id: string; seated: number }>`
    SELECT room_id, COUNT(*)::int AS seated
    FROM session_players GROUP BY room_id
  `
  const seatMap = new Map(countRows.rows.map(r => [r.room_id, r.seated]))

  const list: RoomSummary[] = sessRows.rows.map(r => {
    const gd = typeof r.game_data === 'string' ? JSON.parse(r.game_data) : r.game_data
    const createdAt = typeof r.created_at === 'string' ? Number(r.created_at) : r.created_at
    const lastRound = gd.rounds[gd.rounds.length - 1]
    return {
      roomId: r.room_id,
      name: r.name,
      createdAt,
      maxPlayers: r.max_players,
      seatedCount: seatMap.get(r.room_id) ?? 0,
      roundsCount: gd.rounds.length,
      lastActivityAt: lastRound?.recordedAt ?? lastRound?.updatedAt ?? createdAt
    }
  })
  list.sort((a, b) => b.lastActivityAt - a.lastActivityAt)
  cacheSet(KEY, list, 5000)
  return list
}
