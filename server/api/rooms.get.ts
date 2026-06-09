import { listRooms } from '~/server/utils/room'

// GET /api/rooms?clientId=xxx
// 返回房间摘要；如果给 clientId，只返回该 user 参与过的房间
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const clientId = typeof q.clientId === 'string' && q.clientId.trim() ? q.clientId.trim() : undefined
  return await listRooms(clientId)
})
