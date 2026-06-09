import { getOrCreateTempUser, seatPlayer } from '~/server/utils/room'

// POST /api/rooms/:id/seat
// body: { clientId, seatIndex? }  —— 不指定 seatIndex 则分配第一个空位
// 返回 { seat, session }
export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'id')
  if (!roomId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 roomId' })
  }
  const body = await readBody<{ clientId?: string; seatIndex?: number }>(event)
  if (!body?.clientId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 clientId' })
  }
  // 确保 user 存在
  const user = await getOrCreateTempUser(body.clientId)
  try {
    return await seatPlayer(roomId, user.id, body.seatIndex)
  } catch (e: any) {
    throw createError({ statusCode: 400, statusMessage: e?.message ?? '坐下失败' })
  }
})
