import { deleteAllRooms } from '~/server/utils/room'

// DELETE /api/rooms?clientId=xxx
// 清空 clientId 关联用户参与过的所有房间
// 不传 clientId 时，**不允许**清空全部（生产环境应加 admin 鉴权）
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const clientId = typeof q.clientId === 'string' && q.clientId.trim() ? q.clientId.trim() : ''
  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少 clientId（出于安全，不允许清空全部房间）'
    })
  }
  const count = await deleteAllRooms(clientId)
  return { success: true, deleted: count }
})
