import { readAllGames } from '~/server/utils/db'

// GET /api/games - 获取所有游戏（按创建时间倒序）
export default defineEventHandler(async () => {
  const games = await readAllGames()
  return games
})
