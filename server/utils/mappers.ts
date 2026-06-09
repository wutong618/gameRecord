// server 端 row → domain 映射工具
import type { User } from '~/types'

export type UserRow = {
  id: string | number
  client_id: string
  openid: string | null
  unionid: string | null
  nickname: string
  avatar_url: string | null
  avatar_color: string | null
  is_temporary: boolean
  is_vip: boolean
  created_at: string | number
}

export function rowToUser(r: UserRow): User {
  return {
    id: Number(r.id),
    clientId: r.client_id,
    openid: r.openid,
    unionid: r.unionid,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    avatarColor: r.avatar_color,
    isTemporary: r.is_temporary,
    isVip: r.is_vip,
    createdAt: typeof r.created_at === 'string' ? Number(r.created_at) : r.created_at
  }
}
