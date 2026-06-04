import { deleteRoom } from '~/server/utils/room'

// DELETE /api/room?id=xxx
// 删除整局房间记录
export default defineEventHandler(async (event) => {
  const id = getQuery(event).id
  if (typeof id !== 'string' || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: '缺少 id 参数' })
  }
  const ok = await deleteRoom(id.trim())
  if (!ok) {
    throw createError({ statusCode: 404, statusMessage: '房间不存在' })
  }
  return { success: true }
})
