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

// 头像上传：使用 Vercel Blob 官方推荐的 handleUpload 客户端模式
// 1. 浏览器调 /api/upload-avatar 拿一次性 token
// 2. 浏览器拿 token 直传 Vercel Blob CDN（不经 server，无 4.5MB 限制）
// 3. 上传完成后 Vercel Blob 回调 /api/upload-avatar 的 onUploadCompleted 写回 players
//
// 上传前先压缩到 200KB（maxSizeMB=0.2），节省 Vercel Blob 存储与流量
export async function uploadAvatar(playerId: number, file: File): Promise<string> {
  const { upload } = await import('@vercel/blob/client')
  const imageCompression = (await import('browser-image-compression')).default

  // 校验原始文件类型与 2MB 限制
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
  if (file.type && !allowed.includes(file.type)) {
    throw new Error('仅支持 png/jpg/webp/gif')
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('文件大小不能超过 2MB')
  }

  // 压缩到 ~200KB（web worker 不阻塞 UI；maxWidthOrHeight 限制最大尺寸 1024px）
  // 微信/手机相册的照片通常是 4032×3024，1024 已经远超头像所需
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    // 保留 EXIF 旋转信息（避免压缩后图变横/竖）
    exifOrientation: 1
  })
  console.log(`[upload] compressed ${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`)

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const pathname = `avatars/${playerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`

  const blob = await upload(pathname, compressed, {
    access: 'public',
    handleUploadUrl: '/api/upload-avatar',
    clientPayload: JSON.stringify({ playerId }),
    contentType: compressed.type || 'image/jpeg'
  })
  return blob.url
}
