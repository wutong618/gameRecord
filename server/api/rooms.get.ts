import { listRooms } from '~/server/utils/room'

// GET /api/rooms —— 返回所有房间摘要
export default defineEventHandler(async () => {
  return await listRooms()
})
