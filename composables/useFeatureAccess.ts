// v3.0 商业化预留：所有功能默认开放（v3.x 免费）
// 未来 v4.x 可基于 useUser().currentUser?.isVip 做条件限制
//
// 业务侧只需调用：
//   const { checkFeatureAccess } = useFeatureAccess()
//   if (!checkFeatureAccess('create_large_room')) return

import { useUser } from '~/composables/useUser'

export type FeatureKey =
  | 'create_room'        // 创建房间
  | 'create_large_room'  // 6 人及以上房间（v4.0 拟限定为 VIP）
  | 'record_score'       // 记分
  | 'edit_score'         // 修改分数
  | 'upload_avatar'      // 上传自定义头像
  | 'wechat_bind'        // 微信绑定
  | 'view_history'       // 查看历史
  | 'view_audit'         // 查看追溯

// 简化的策略表：v3.0 全部 true
const ALWAYS_FREE: Record<FeatureKey, boolean> = {
  create_room: true,
  create_large_room: true,
  record_score: true,
  edit_score: true,
  upload_avatar: true,
  wechat_bind: true,
  view_history: true,
  view_audit: true
}

export function useFeatureAccess() {
  const { currentUser } = useUser()

  /**
   * 校验 feature 访问权限
   * @param feature 功能 key
   * @returns true = 允许访问
   */
  const checkFeatureAccess = (feature: FeatureKey): boolean => {
    // v3.x 全部开放；预留 hook（未来可读 currentUser.isVip）
    return ALWAYS_FREE[feature]
  }

  return {
    checkFeatureAccess,
    currentUser
  }
}
