import { readAllGames, writeAllGames } from '~/server/utils/db'

// DELETE /api/games/:id - 删除游戏
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '缺少游戏 id' })
  }
  const games = await readAllGames()
  const index = games.findIndex((g) => g.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: '游戏不存在' })
  }
  const [removed] = games.splice(index, 1)
  await writeAllGames(games)
  return { success: true, id: removed.id }
})
