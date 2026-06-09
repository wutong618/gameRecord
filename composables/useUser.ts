import { ref, computed } from 'vue'
import type { User } from '~/types'
import * as db from '~/composables/useDb'

// 全局唯一 current user（单 tab 内单用户；多 tab 各自独立）
const currentUser = ref<User | null>(null)
const isReady = ref(false)

const CLIENT_ID_KEY = 'gameRecord.clientId'
const USER_CACHE_KEY = 'gameRecord.user'

// 生成或读取 LocalStorage 中的 clientId
function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    // 12 字符随机 ID：足够分散，URL 友好
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

function loadCachedUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_CACHE_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as User } catch { return null }
}

function persistUser(u: User | null) {
  if (typeof window === 'undefined') return
  if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
  else localStorage.removeItem(USER_CACHE_KEY)
}

export function useUser() {
  // 初始化：v3.1 优化——同步从 localStorage 读缓存立刻填 currentUser，
  // 后台异步调 /api/users/temp 拿最新 user 覆盖。
  // 这样首屏 HomeView 立即能渲染 user 卡片（即使是 cache 数据），
  // 不必等跨太平洋 HTTP 完成。
  const init = (): User | null => {
    if (isReady.value) return currentUser.value
    const clientId = getOrCreateClientId()
    // 1) 同步读缓存填 currentUser
    const cached = loadCachedUser()
    if (cached && cached.clientId === clientId) {
      currentUser.value = cached
    }
    isReady.value = true
    // 2) 后台异步 ensure（拿最新 user_id / isTemporary 状态）
    db.ensureTempUser(clientId)
      .then((user) => {
        currentUser.value = user
        persistUser(user)
      })
      .catch((e) => {
        console.error('[useUser] init failed:', e)
      })
    return currentUser.value
  }

  // 刷新当前 user（轮询时使用）
  const refresh = async (): Promise<User | null> => {
    if (!currentUser.value) return null
    try {
      const fresh = await db.getUser(currentUser.value.clientId)
      if (fresh) {
        currentUser.value = fresh
        persistUser(fresh)
      }
      return currentUser.value
    } catch (e) {
      console.error('[useUser] refresh failed:', e)
      return currentUser.value
    }
  }

  // 手动修改资料
  const updateProfile = async (patch: {
    nickname?: string
    avatarUrl?: string | null
    avatarColor?: string | null
  }): Promise<User | null> => {
    if (!currentUser.value) return null
    const u = await db.updateUser(currentUser.value.clientId, patch)
    if (u) {
      currentUser.value = u
      persistUser(u)
    }
    return u
  }

  // 微信绑定（mock）
  const bindWechat = async (
    openid: string,
    nickname: string,
    avatarUrl: string
  ): Promise<User | null> => {
    if (!currentUser.value) return null
    const u = await db.bindWechat(currentUser.value.clientId, openid, nickname, avatarUrl)
    if (u) {
      currentUser.value = u
      persistUser(u)
    }
    return u
  }

  return {
    currentUser,
    isReady,
    isTemporary: computed(() => currentUser.value?.isTemporary ?? true),
    init,
    refresh,
    updateProfile,
    bindWechat
  }
}
