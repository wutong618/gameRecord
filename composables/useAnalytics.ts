/**
 * v6.0 黄金行为埋点 Composable
 *
 * 在需要的组件里：
 *   const analytics = useAnalytics()
 *   analytics.createRoom(6)            // 6 人房
 *   analytics.joinRoomSuccess(true)    // 匿名坐下
 *   analytics.submitScoreRound()      // 记一轮分
 *
 * 设计原则：
 *  - 事件名 + props 类型集中定义，避免拼写错误污染 Vercel 仪表板
 *  - dev 模式 console.log 替代真实上报（Vercel SDK 自身 dev no-op 是第二道保险）
 *  - 失败静默：埋点绝不能 throw 把业务流程搞挂
 */
import { track as vercelTrack } from '@vercel/analytics'

// 事件名 + 关联 props 联合类型，编辑器能自动补全
export type AnalyticsEventPayload = {
  create_room: { total_players: number }
  join_room_success: { is_temporary: boolean }
  submit_score_round: undefined
}

export type AnalyticsEvent = keyof AnalyticsEventPayload

export function useAnalytics() {
  /**
   * 通用 track 入口（类型安全）
   * @example track('create_room', { total_players: 4 })
   */
  function track<E extends AnalyticsEvent>(
    event: E,
    ...args: AnalyticsEventPayload[E] extends undefined
      ? []
      : [props: AnalyticsEventPayload[E]]
  ): void {
    try {
      if (import.meta.dev) {
        // 开发环境：打到 console，便于本地调试
        // eslint-disable-next-line no-console
        console.log(`[analytics] ${event}`, args[0] ?? '')
        return
      }
      const props = args[0] as Record<string, unknown> | undefined
      if (props) vercelTrack(event, props as Record<string, string | number | boolean | null>)
      else vercelTrack(event)
    } catch (e) {
      // 静默失败，埋点绝不能 throw
      if (!import.meta.dev) {
        // eslint-disable-next-line no-console
        console.warn('[analytics] track failed:', e)
      }
    }
  }

  return {
    track,
    // 业务语义化方法：埋点处不用记事件名，IDE 自动提示
    createRoom: (totalPlayers: number) => track('create_room', { total_players: totalPlayers }),
    joinRoomSuccess: (isTemporary: boolean) =>
      track('join_room_success', { is_temporary: isTemporary }),
    submitScoreRound: () => track('submit_score_round')
  }
}
