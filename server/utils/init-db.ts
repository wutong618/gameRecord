import { sql } from './postgres'

// v3.0 schema：
//   users            —— 玩家档案（临时/正式统一）
//   game_sessions    —— 房间（带 max_players）
//   session_players  —— 座位映射（哪个用户坐在哪个房间的哪个位置）
//
// v2.x 的 `players` 表（4 行固定玩家）已删除。旧 game_sessions 数据清空。
export async function initDb(): Promise<void> {
  // 先清掉 v2.x 的 players 表（幂等）
  await sql`DROP TABLE IF EXISTS players CASCADE`

  // users —— 玩家档案
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT UNIQUE NOT NULL,
      openid TEXT UNIQUE,
      unionid TEXT,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      avatar_color TEXT,
      is_temporary BOOLEAN NOT NULL DEFAULT TRUE,
      is_vip BOOLEAN NOT NULL DEFAULT FALSE,
      created_at BIGINT NOT NULL
    )
  `
  // openid 上的部分唯一索引（仅当 openid 非空时强制唯一）
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_openid
    ON users(openid) WHERE openid IS NOT NULL
  `

  // game_sessions —— 房间（带 max_players，CHECK 2-10）
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      room_id TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 10),
      game_data JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
    )
  `

  // 兼容旧 v2.x 表：补充 max_players 列（如果已存在则跳过）
  await sql`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS max_players INTEGER NOT NULL DEFAULT 4
  `

  // 兼容 v3.0 早期版本：补充 name 列
  await sql`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS name TEXT
  `

  // session_players —— 座位映射
  await sql`
    CREATE TABLE IF NOT EXISTS session_players (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES game_sessions(room_id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seat_index INTEGER NOT NULL CHECK (seat_index >= 0 AND seat_index <= 9),
      joined_at BIGINT NOT NULL,
      UNIQUE(room_id, seat_index)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_sp_room ON session_players(room_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sp_user ON session_players(user_id)`
}
