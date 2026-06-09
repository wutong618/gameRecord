import { createRoomWithCreator } from '~/server/utils/room'

// POST /api/rooms
// body: { maxPlayers: 2-10, creatorClientId: string, name?: string }
// 房主自动坐 seat 0，返回完整 session
export default defineEventHandler(async (event) => {
  const body = await readBody<{ maxPlayers?: number; creatorClientId?: string; name?: string }>(event)
  const max = Number(body?.maxPlayers)
  if (!Number.isInteger(max) || max < 2 || max > 10) {
    throw createError({ statusCode: 400, statusMessage: 'maxPlayers 必须是 2-10 的整数' })
  }
  if (!body?.creatorClientId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 creatorClientId' })
  }
  // 确保 creator 临时用户存在
  const { getOrCreateTempUser } = await import('~/server/utils/room')
  const creator = await getOrCreateTempUser(body.creatorClientId)
  // 生成 roomId
  const roomId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const session = await createRoomWithCreator(roomId, max, creator.id, body.name)
  return session
})
