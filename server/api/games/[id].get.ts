import { readAllGames } from '~/server/utils/db'

// GET /api/games/:id - 获取单个游戏
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少游戏 id' })
  }
  const games = await readAllGames()
  const game = games.find((g) => g.id === id)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: '游戏不存在' })
  }
  return game
})
