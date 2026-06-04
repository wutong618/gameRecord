import { deleteAllRooms, invalidateRoomCache } from '~/server/utils/room'

// DELETE /api/rooms —— 清空所有房间
export default defineEventHandler(async () => {
  const count = await deleteAllRooms()
  invalidateRoomCache()
  return { success: true, deleted: count }
})
