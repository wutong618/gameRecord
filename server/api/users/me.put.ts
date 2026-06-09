import { updateUser } from '~/server/utils/room'

// PUT /api/users/me
// body: { clientId, nickname?, avatarUrl?, avatarColor? }
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    clientId: string
    nickname?: string
    avatarUrl?: string | null
    avatarColor?: string | null
  }>(event)
  if (!body?.clientId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 clientId' })
  }
  const { sql } = await import('~/server/utils/postgres')
  const user = await sql<{ id: number }>`SELECT id FROM users WHERE client_id = ${body.clientId} LIMIT 1`
  if (!user.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: '用户不存在' })
  }
  const updated = await updateUser(user.rows[0].id, {
    nickname: body.nickname,
    avatarUrl: body.avatarUrl,
    avatarColor: body.avatarColor
  })
  return updated
})
