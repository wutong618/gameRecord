import { readAllGames, writeAllGames, createNewGame, recalcTotalScores, generateId } from '~/server/utils/db'
import type { Game } from '~/types'

// POST /api/games
//   - 不带 body：创建一局空白新游戏
//   - 带 body：导入一局游戏（使用 body 中的 players 和 rounds，重置 id/createdAt/总分）
export default defineEventHandler(async (event) => {
  const games = await readAllGames()
  const body = await readBody<Game | undefined>(event).catch(() => undefined)

  let game: Game
  if (body && Array.isArray(body.players) && Array.isArray(body.rounds)) {
    // 导入：保留原数据，重置 id/时间/总分
    game = {
      id: generateId(),
      name: body.name || new Date().toISOString(),
      createdAt: Date.now(),
      players: body.players.map((p, idx) => ({
        id: p.id ?? idx,
        name: p.name,
        color: p.color,
        totalScore: 0
      })),
      rounds: body.rounds.map((round, idx) => ({
        roundNumber: idx + 1,
        scores: round.scores,
        createdAt: round.createdAt ?? Date.now()
      }))
    }
    recalcTotalScores(game)
  } else {
    // 新建空白游戏
    game = createNewGame()
  }

  games.unshift(game)
  await writeAllGames(games)
  return game
})
