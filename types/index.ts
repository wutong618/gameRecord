// v3.0 类型定义

// 玩家档案（来自 PostgreSQL `users` 表）
export interface User {
  id: number                   // 系统生成唯一 ID
  clientId: string             // 前端 LocalStorage 中的临时凭证
  openid: string | null        // 微信 openid（仅正式用户）
  unionid: string | null
  nickname: string
  avatarUrl: string | null
  avatarColor: string | null   // 纯文字头像的随机色
  isTemporary: boolean
  isVip: boolean
  createdAt: number
}

// 座位（join users）
export interface Seat {
  seatIndex: number            // 0-9
  user: User | null            // null = 空位
}

// 单轮分数（含追溯）
export interface Round {
  roundNumber: number
  scores: number[]             // 长度 max_players；seat_index 处的分数
  recordedBy: number           // user id
  recordedAt: number
  updatedBy?: number | null    // 最后修改人
  updatedAt?: number | null    // 最后修改时间
}

// 单局游戏数据快照（存于 `game_sessions.game_data` JSONB 字段）
export interface GameData {
  rounds: Round[]
}

// 房间记录（GET /api/room 返回结构）
export interface GameSession {
  roomId: string
  name: string | null          // 房主创建时填的昵称
  createdAt: number
  maxPlayers: number           // 2-10
  gameData: GameData
  seats: Seat[]                // 长度 = max_players；空位 = { seatIndex, user: null }
}

// 玩家颜色配置（v3.0 改名为 nickname 随机配色，保留旧名以兼容）
export const PLAYER_COLORS = {
  'fire-red': { bg: 'linear-gradient(135deg, #ff4444 0%, #ff6b35 50%, #ff8800 100%)', border: '#ff4444', neon: '#ff6600' },
  'deep-sea-blue': { bg: 'linear-gradient(135deg, #0044ff 0%, #0088ff 50%, #00ccff 100%)', border: '#0088ff', neon: '#00ffff' },
  'emerald-green': { bg: 'linear-gradient(135deg, #00aa44 0%, #00cc66 50%, #39ff14 100%)', border: '#00cc66', neon: '#39ff14' },
  'night-purple': { bg: 'linear-gradient(135deg, #6600aa 0%, #8844cc 50%, #bb00ff 100%)', border: '#aa66ff', neon: '#ff00ff' },
  'sunset-orange': { bg: 'linear-gradient(135deg, #ff8800 0%, #ffaa44 50%, #ffcc88 100%)', border: '#ffaa44', neon: '#ffbb55' },
  'rose-pink': { bg: 'linear-gradient(135deg, #ff4488 0%, #ff77aa 50%, #ffaacc 100%)', border: '#ff77aa', neon: '#ff99cc' },
  'cyan-teal': { bg: 'linear-gradient(135deg, #00bbcc 0%, #00ddee 50%, #88ffff 100%)', border: '#00ddee', neon: '#00ffff' },
  'lime-yellow': { bg: 'linear-gradient(135deg, #88cc00 0%, #aaee44 50%, #ccff88 100%)', border: '#aaee44', neon: '#bbff55' },
  'magenta-pink': { bg: 'linear-gradient(135deg, #cc0088 0%, #ee44aa 50%, #ff88cc 100%)', border: '#ee44aa', neon: '#ff77cc' },
  'ice-blue': { bg: 'linear-gradient(135deg, #4488ff 0%, #77aaff 50%, #bbddff 100%)', border: '#77aaff', neon: '#99ccff' }
} as const

export type PlayerColorKey = keyof typeof PLAYER_COLORS

// 随机昵称池
export const RANDOM_ANIMALS = [
  '小恐龙', '小熊猫', '小狐狸', '小老虎', '小兔子',
  '小猫咪', '小柯基', '小海豚', '小企鹅', '小考拉',
  '小刺猬', '小仓鼠', '小乌龟', '小鹦鹉', '小羊驼',
  '小狼崽', '小鳄鱼', '小松鼠', '小猪猪', '小象象',
  '小狮子', '小猩猩', '小河马', '小长颈鹿', '小斑马',
  '小熊猫', '小黄鸭', '小火鸡', '小龙猫', '小树懒'
]

export const RANDOM_FRUITS = [
  '神秘苹果', '奇异香蕉', '甜橙子', '紫葡萄', '脆西瓜',
  '红草莓', '黄金芒', '蓝莓', '火龙果', '猕猴桃',
  '百香果', '番石榴', '雪梨', '红心柚', '黑布林',
  '蜜瓜', '椰子', '山竹', '榴莲', '荔枝',
  '龙眼', '枇杷', '桑葚', '杨梅', '李子',
  '杏子', '石榴', '柿子', '车厘子', '牛油果'
]

// 生成临时昵称：动物/水果 + 随机后缀
export function randomNickname(): string {
  const pool = [...RANDOM_ANIMALS, ...RANDOM_FRUITS]
  const base = pool[Math.floor(Math.random() * pool.length)]
  const suffix = Math.random().toString(36).slice(2, 4)
  return `匿名${base}${suffix}`
}
