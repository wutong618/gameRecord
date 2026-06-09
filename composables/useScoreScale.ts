import { computed, type Ref } from 'vue'

/**
 * Score-to-Size Avatar Scaling
 * v3.1 动态头像视觉压迫系统：
 *   - 最高分玩家头像 scale(1.35) → "大魔王"压迫感
 *   - 最低分玩家头像 scale(0.75) → 仍有辨识度、不破坏点击区
 *   - 平分或单人时所有人 scale(1.0) → 基础状态
 *   - 玩家分数变化时头像"充气/泄气"地丝滑缩放（500ms ease-spring）
 *
 * 算法：
 *   normalized = (myScore - minScore) / (maxScore - minScore)  // [0, 1]
 *   scale = 0.75 + normalized * (1.35 - 0.75)                  // [0.75, 1.35]
 *
 * 关键约束：
 *   - 用 CSS transform: scale()，**绝不**改 width/height（避免重排/周围元素抖动）
 *   - 单一 source of truth：从 totalScores 同步计算，无 watch
 *   - 数值稳定：所有玩家平分时 everyone = 1.0（用 max - min = 0 做零除保护）
 */
const MIN_SCALE = 0.75
const MAX_SCALE = 1.35
const DEFAULT_SCALE = 1.0

/**
 * 接受 totalScores 响应式引用 + 当前座位索引，返回该座位的 CSS scale 数值。
 *
 * @example
 *   const totalScores = computed(() => ...)
 *   const myScale = useScoreScale(totalScores, 0)
 *   // → 1.05 / 0.82 / 1.35 ...
 *   <div :style="{ transform: `scale(${myScale.value})` }" />
 */
export function useScoreScale(
  totalScores: Ref<readonly number[]>,
  seatIndex: number
) {
  return computed<number>(() => {
    const scores = totalScores.value
    if (!scores || scores.length === 0) return DEFAULT_SCALE

    // 找 min/max（同时跳过 NaN/undefined）
    let min = Infinity
    let max = -Infinity
    for (const s of scores) {
      if (typeof s !== 'number' || Number.isNaN(s)) continue
      if (s < min) min = s
      if (s > max) max = s
    }
    if (min === Infinity || max === -Infinity) return DEFAULT_SCALE

    // 所有人平分（包括全部 0 分）→ 1.0 基础状态
    if (min === max) return DEFAULT_SCALE

    const myScore = scores[seatIndex]
    // 当前座位分数无效（极端情况：座位空 / 越界）→ 用 min
    const safe = typeof myScore === 'number' && !Number.isNaN(myScore) ? myScore : min
    const normalized = (safe - min) / (max - min) // 0..1
    return MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE)
  })
}

/**
 * 纯函数版本，方便测试或在非响应式上下文使用
 */
export function computeScoreScale(scores: readonly number[], seatIndex: number): number {
  if (!scores || scores.length === 0) return DEFAULT_SCALE
  let min = Infinity
  let max = -Infinity
  for (const s of scores) {
    if (typeof s !== 'number' || Number.isNaN(s)) continue
    if (s < min) min = s
    if (s > max) max = s
  }
  if (min === Infinity || max === -Infinity || min === max) return DEFAULT_SCALE
  const my = scores[seatIndex]
  const safe = typeof my === 'number' && !Number.isNaN(my) ? my : min
  return MIN_SCALE + ((safe - min) / (max - min)) * (MAX_SCALE - MIN_SCALE)
}
