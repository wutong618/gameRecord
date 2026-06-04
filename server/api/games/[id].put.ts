import { readAllGames, writeAllGames, recalcTotalScores } from '~/server/utils/db'
import type { Game } from '~/types'

// PUT /api/games/:id - 整体替换游戏
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少游戏 id' })
  }
  const body = await readBody<Game>(event)
  if (!body || body.id !== id) {
    throw createError({ statusCode: 400, statusMessage: '请求体无效' })
  }
  const games = await readAllGames()
  const index = games.findIndex((g) => g.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: '游戏不存在' })
  }
  // 重新计算总分，避免脏数据
  recalcTotalScores(body)
  games[index] = body
  await writeAllGames(games)
  return body
})
