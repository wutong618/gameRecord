import { getRoomWithSeats } from '~/server/utils/room'

// GET /api/room?id=xxx —— v3.0：返回 session（含 seats 和 max_players）
export default defineEventHandler(async (event) => {
  const id = getQuery(event).id
  if (typeof id !== 'string' || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: '缺少 id 参数' })
  }
  const session = await getRoomWithSeats(id.trim())
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: '房间不存在' })
  }
  return session
})
