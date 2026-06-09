import { leaveSeat } from '~/server/utils/room'

// DELETE /api/rooms/:id/seat?seatIndex=N
// 离座（v3.0 可选功能；目前保留供将来退场用）
export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'id')
  if (!roomId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 roomId' })
  }
  const q = getQuery(event)
  const seatIndex = Number(q.seatIndex)
  if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex > 9) {
    throw createError({ statusCode: 400, statusMessage: 'seatIndex 必须是 0-9' })
  }
  await leaveSeat(roomId, seatIndex)
  return { success: true }
})
