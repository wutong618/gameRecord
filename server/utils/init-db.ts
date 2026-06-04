import { sql } from './postgres'
import { DEFAULT_PLAYERS } from '~/types'

// 启动时调用：确保表结构与默认玩家存在
// 全部使用 IF NOT EXISTS / ON CONFLICT DO NOTHING，幂等
export async function initDb(): Promise<void> {
  // players 玩家档案表
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_url TEXT,
      color TEXT NOT NULL
    )
  `

  // game_sessions 房间表：room_id 为文本主键，game_data 为 JSONB
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      room_id TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      game_data JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
    )
  `

  // 初始化 4 位默认玩家（已存在则忽略）
  for (const p of DEFAULT_PLAYERS) {
    await sql`
      INSERT INTO players (id, name, color)
      VALUES (${p.id}, ${p.name}, ${p.color})
      ON CONFLICT (id) DO NOTHING
    `
  }
}
