// 玩家档案（来自 PostgreSQL `players` 表）
export interface PlayerProfile {
  id: number              // 0-3
  name: string            // 姓：吴 / 王 / 来 / 静
  avatarUrl: string | null // Vercel Blob 公开图链
  color: string           // 主题色 key
}

// 单轮分数（存于 `game_sessions.game_data.rounds`）
export interface Round {
  roundNumber: number
  scores: number[]        // 长度 4，按 players.id 顺序：[吴, 王, 来, 静]
  createdAt: number
}

// 单局游戏数据快照（存于 `game_sessions.game_data` JSONB 字段）
export interface GameData {
  rounds: Round[]
}

// 房间记录（GET /api/room 返回结构）
export interface GameSession {
  roomId: string
  createdAt: number
  gameData: GameData
  players: PlayerProfile[] // 由服务端 join players 表后返回
}

// 默认玩家档案（用于初始化 players 表）
export const DEFAULT_PLAYERS: Omit<PlayerProfile, 'avatarUrl'>[] = [
  { id: 0, name: '吴', color: 'fire-red' },
  { id: 1, name: '王', color: 'deep-sea-blue' },
  { id: 2, name: '来', color: 'emerald-green' },
  { id: 3, name: '静', color: 'night-purple' }
]

// 玩家颜色配置
export const PLAYER_COLORS = {
  'fire-red': { bg: 'linear-gradient(135deg, #ff4444 0%, #ff6b35 50%, #ff8800 100%)', border: '#ff4444', neon: '#ff6600' },
  'deep-sea-blue': { bg: 'linear-gradient(135deg, #0044ff 0%, #0088ff 50%, #00ccff 100%)', border: '#0088ff', neon: '#00ffff' },
  'emerald-green': { bg: 'linear-gradient(135deg, #00aa44 0%, #00cc66 50%, #39ff14 100%)', border: '#00cc66', neon: '#39ff14' },
  'night-purple': { bg: 'linear-gradient(135deg, #6600aa 0%, #8844cc 50%, #bb00ff 100%)', border: '#aa66ff', neon: '#ff00ff' }
}
