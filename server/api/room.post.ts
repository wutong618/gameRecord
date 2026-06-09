import { updateRoomGameData } from '~/server/utils/room'
import type { GameData } from '~/types'

// POST /api/room?id=xxx —— v3.0：覆盖 gameData
// v3.0 新增校验：每轮 scores 长度必须等于该房间 max_players
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
