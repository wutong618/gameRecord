// 玩家数据类型
export interface Player {
  id: number;           // 0-3
  name: string;         // 姓名
  color: string;        // 渐变背景CSS
  totalScore: number;   // 当前总分
}

// 单轮数据类型
export interface Round {
  roundNumber: number;  // 轮次编号
  scores: number[];     // [吴分, 王分, 来分, 静分]
  createdAt: number;    // 记录时间
}

// 游戏数据类型
export interface Game {
  id: string;           // UUID
  name: string;         // 游戏名称 (含时间戳)
  createdAt: number;    // 创建时间戳
  players: Player[];    // 4位玩家
  rounds: Round[];      // 历史轮次
}

// 默认玩家列表
export const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: '吴', color: 'fire-red', totalScore: 0 },
  { id: 1, name: '王', color: 'deep-sea-blue', totalScore: 0 },
  { id: 2, name: '来', color: 'emerald-green', totalScore: 0 },
  { id: 3, name: '静', color: 'night-purple', totalScore: 0 }
]

// 玩家颜色配置
export const PLAYER_COLORS = {
  'fire-red': { bg: 'linear-gradient(135deg, #ff4444 0%, #ff6b35 50%, #ff8800 100%)', border: '#ff4444', neon: '#ff6600' },
  'deep-sea-blue': { bg: 'linear-gradient(135deg, #0044ff 0%, #0088ff 50%, #00ccff 100%)', border: '#0088ff', neon: '#00ffff' },
  'emerald-green': { bg: 'linear-gradient(135deg, #00aa44 0%, #00cc66 50%, #39ff14 100%)', border: '#00cc66', neon: '#39ff14' },
  'night-purple': { bg: 'linear-gradient(135deg, #6600aa 0%, #8844cc 50%, #bb00ff 100%)', border: '#aa66ff', neon: '#ff00ff' }
}