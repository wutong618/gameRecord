import { ref, computed } from 'vue'
import type { User } from '~/types'

// 50 条高情商/毒舌文案，分 5 个场景
export const ROASTS = {
  // 场景 1：第一名 vs 最后一名（领先差距大）
  king_loser: [
    '🏆 【第一名】已经坐上了火箭，【最后一名】的共享单车链条掉了吗？',
    '🏆 【第一名】开启了独孤求败模式，【最后一名】别慌，风水轮流转……大概吧。',
    '🏆 【第一名】今天的牌运连AI都害怕！【最后一名】悄悄问一句：需要帮你报警吗？',
    '🏆 【第一名】正在统治全场！至于【最后一名】……我们保护弱势群体，加油！',
    '🏆 检测到【第一名】开启了"降维打击"，请给【最后一名】倒一杯卡布奇诺开始你的倒数。',
    '🏆 【第一名】正在收割战场，【最后一名】已经在考虑等会怎么逃单了。',
    '🏆 高处不胜寒啊【第一名】！那个……山脚下的【最后一名】听得到我说话吗？',
    '🏆 【第一名】的积分突破天际，【最后一名】正在用毕生功力进行防守。',
    '🏆 【第一名】今晚是不是偷偷洗手了？【最后一名】要不换个座位转转运？',
    '🏆 这是【第一名】的个人秀，也是【最后一名】的渡劫现场。'
  ],
  // 场景 2：最后一名暴击大幅加分
  comeback: [
    '🔥 夭寿啦！【最后一名】突然觉醒，这一波是教科书级的垂死挣扎！',
    '🔥 【最后一名】开始发力了！第一名请坐稳，你的王座有点晃。',
    '🔥 剧本不是这么写的！【最后一名】突然开挂，正在疯狂甩尾超车！',
    '🔥 【最后一名】燃起来了！这一记绝地反击，直接打碎了第一名的清梦！',
    '🔥 燃起来了！【最后一名】原地复活，请大声告诉他们：三十年河东，三十年河西！',
    '🔥 【最后一名】刚刚展现了什么叫"医学奇迹"，留给其他人的时间不多了！',
    '🔥 注意！【最后一名】正在开启狂暴暴击模式，前面的准备迎接冲击！',
    '🔥 谁说站在光里的才算英雄？【最后一名】这波逆袭我给满分！',
    '🔥 【最后一名】支棱起来了！全场起立，给这位追风少年让路！',
    '🔥 局势变了！【最后一名】露出了獠牙，今晚的猎杀时刻才刚刚开始！'
  ],
  // 场景 3：两级分化严重（分差大）
  lopsided: [
    '💀 【第一名】和【最后一名】之间，隔了一个银河系的距离。',
    '💀 【最后一名】不哭，站起来撸！只要局数够多，总能熬死【第一名】！',
    '💀 温馨提示：【最后一名】距离【第一名】的差距，需要连续抓三个超级加倍。',
    '💀 【第一名】已经在外太空度假，【最后一名】还在新手村迷路。',
    '💀 裁判陷入了沉思……【最后一名】你跟【第一名】玩的真的是同一款游戏吗？',
    '💀 【第一名】已经准备发表获奖感言，【最后一名】正在偷偷查银行卡余额。',
    '💀 这是一场没有悬念的凌辱，【最后一名】，全场的目光都在慈祥地看着你。',
    '💀 【第一名】的尾灯已经看不见了，【最后一名】还在原地研究怎么打火。',
    '💀 建议【最后一名】立刻向【第一名】拜师学艺，学费可以打八折。',
    '💀 分差已经大到连计算器都开始冒烟了，【最后一名】顶住啊！'
  ],
  // 场景 4：房主成功创建房间
  room_created: [
    '👑 局已经组好，今晚谁是散财童子，谁是全场真神？',
    '👑 大魔王【房主昵称】已经建好了战场，正在静静等待受害者们入局。',
    '👑 【房主昵称】发起了局，并贴心地为每个人准备好了速效救心丸。',
    '👑 新房间已开辟！今晚的目标：不把【房主昵称】打趴下谁都不准走！',
    '👑 战场已就绪，听说爱建房的人今晚运气都不会太差？',
    '👑 【房主昵称】已经就位，今晚是打算在自家主场大杀四方吗？',
    '👑 房间建好了，快把链接甩到群里，看看哪个倒霉蛋会第一个进来。',
    '👑 检测到尊贵的【房主昵称】发起了决斗，请各位选手抓紧时间准备。',
    '👑 今晚的豪华巨轮由【房主昵称】掌舵，请各位乘客抓紧扶手，准备起飞！',
    '👑 局长【房主昵称】已上线，今晚的口号是：分分见底，不醉不归！'
  ],
  // 场景 5：新玩家点击加号坐下
  player_joined: [
    '🚪 危险分子【新玩家昵称】悍然入局！全场拉响一级战斗警报！',
    '🚪 【新玩家昵称】顶着主角光环坐下了，今晚是要来掀翻王座的吗？',
    '🚪 欢迎【新玩家昵称】加入受害者联盟，请先调整好你的呼吸。',
    '🚪 【新玩家昵称】以迅雷不及掩耳之势抢占了座位，这手速今晚必赢！',
    '🚪 全场目光请看向【新玩家昵称】，这位选手落座的姿势充满了自信。',
    '🚪 【新玩家昵称】悄悄加入了房间，并试图隐藏自己今晚必胜的野心。',
    '🚪 打牌不积极，思想有问题！欢迎全场速度最快的【新玩家昵称】！',
    '🚪 【新玩家昵称】已经坐定，今晚是扮演"送财观音"还是"冷酷杀手"？',
    '🚪 有请下一位追梦人【新玩家昵称】落座！今晚的黑马会是你吗？',
    '🚪 【新玩家昵称】成功上车！位置已经锁死，今晚谁也别想中途跳车！'
  ]
} as const

export type RoastScenario = 'king_loser' | 'comeback' | 'lopsided' | 'room_created' | 'player_joined'

// 随机选一条
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 替换占位符（4 类占位符）
function fillTemplate(
  template: string,
  ctx: { first?: User; last?: User; host?: User; player?: User }
): string {
  return template
    .replace(/【第一名】/g, ctx.first?.nickname || '神秘高手')
    .replace(/【最后一名】/g, ctx.last?.nickname || '无名氏')
    .replace(/【房主昵称】/g, ctx.host?.nickname || '神秘房主')
    .replace(/【新玩家昵称】/g, ctx.player?.nickname || '神秘来客')
}

// 全局单例
const currentRoast = ref<{ scenario: RoastScenario; text: string } | null>(null)

// 触发裁决（不自动消失，由用户手动关闭）
export function triggerRoast(
  scenario: RoastScenario,
  ctx: { first?: User; last?: User; host?: User; player?: User } = {}
) {
  const tpl = pick(ROASTS[scenario])
  currentRoast.value = { scenario, text: fillTemplate(tpl, ctx) }
}

// 便捷触发：场景 4 / 场景 5
export function triggerRoomCreated(host: User) {
  triggerRoast('room_created', { host })
}
export function triggerPlayerJoined(player: User) {
  triggerRoast('player_joined', { player })
}

export function dismissRoast() {
  currentRoast.value = null
}

// 根据记分结果 + 历史 + 当前快照判断应该触发哪个场景
export interface RoastJudgeInput {
  /** 当前局所有玩家（按座位顺序） */
  players: (User | null)[]
  /** 累计分（按座位顺序） */
  totalScores: number[]
  /** 这一轮每人的得分（按座位顺序） */
  roundScores: number[]
  /** 该轮局内玩家以前的总得分（这一轮之前，用于判断谁"暴击"了） */
  previousTotals: number[]
  /** 是否第一轮（之前没有数据） */
  isFirstRound: boolean
}

export function judgeAndTriggerRoast(input: RoastJudgeInput): RoastScenario | null {
  const { players, totalScores, roundScores, previousTotals, isFirstRound } = input

  // 过滤空位
  const seatedIndices = players.map((p, i) => (p ? i : -1)).filter((i) => i >= 0)
  if (seatedIndices.length < 2) return null // 至少 2 人

  // 排名（按 totalScores 降序）
  const ranked = seatedIndices
    .map((i) => ({
      i,
      score: totalScores[i] ?? 0,
      round: roundScores[i] ?? 0,
      prev: previousTotals[i] ?? 0
    }))
    .sort((a, b) => b.score - a.score)
  const firstIdx = ranked[0].i
  const lastIdx = ranked[ranked.length - 1].i
  const first = players[firstIdx]
  const last = players[lastIdx]
  if (!first || !last) return null
  const gap = (totalScores[firstIdx] ?? 0) - (totalScores[lastIdx] ?? 0)

  const ctx = { first, last }

  // 第一轮：用 lopsided（开局即是定级）
  if (isFirstRound) {
    triggerRoast('lopsided', ctx)
    return 'lopsided'
  }

  // 场景 2：最后一名本轮得分 >= 上一轮 + N（暴击）
  const lastRound = roundScores[lastIdx] ?? 0
  const lastPrev = previousTotals[lastIdx] ?? 0
  const isComeback = lastIdx !== firstIdx && lastRound > 0 && lastRound >= Math.max(15, lastPrev * 1.5)
  if (isComeback) {
    triggerRoast('comeback', ctx)
    return 'comeback'
  }

  // 场景 3：分差 >= maxPlayers * 8
  const lopsidedThreshold = Math.max(30, players.filter(Boolean).length * 8)
  if (gap >= lopsidedThreshold) {
    triggerRoast('lopsided', ctx)
    return 'lopsided'
  }

  // 场景 1：第 1 名很稳，差距扩大
  const firstRound = roundScores[firstIdx] ?? 0
  if (firstRound > 0 && gap >= 10) {
    triggerRoast('king_loser', ctx)
    return 'king_loser'
  }

  return null
}

export function useRoast() {
  return {
    currentRoast: computed(() => currentRoast.value),
    triggerRoast,
    triggerRoomCreated,
    triggerPlayerJoined,
    dismissRoast,
    judgeAndTriggerRoast
  }
}
