import { updateRoomGameData } from '~/server/utils/room'
import type { GameData } from '~/types'

// POST /api/room?id=xxx
// 接收 { gameData: { rounds: [...] } }，整体覆盖写入
export default defineEventHandler(async (event) => {
  const id = getQuery(event).id
  if (typeof id !== 'string' || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: '缺少 id 参数' })
  }
  const body = await readBody<{ gameData?: GameData }>(event)
  if (!body || !body.gameData || !Array.isArray(body.gameData.rounds)) {
    throw createError({ statusCode: 400, statusMessage: '请求体需要包含 gameData.rounds 数组' })
  }
  await updateRoomGameData(id.trim(), body.gameData)
  return { success: true }
})
