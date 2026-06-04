import { getRoom } from '~/server/utils/room'

// GET /api/room?id=xxx
// 查询房间；不存在返回 404（前端需要时自己 POST 一次创建）
export default defineEventHandler(async (event) => {
  const id = getQuery(event).id
  if (typeof id !== 'string' || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: '缺少 id 参数' })
  }
  const session = await getRoom(id.trim())
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: '房间不存在' })
  }
  return session
})
