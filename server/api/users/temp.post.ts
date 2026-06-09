import { getOrCreateTempUser } from '~/server/utils/room'

// POST /api/users/temp
// body: { clientId: string }
// 用 clientId 拿或创建临时用户，返回 user
export default defineEventHandler(async (event) => {
  const body = await readBody<{ clientId?: string }>(event)
  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : ''
  if (!clientId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 clientId' })
  }
  if (clientId.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'clientId 过长' })
  }
  return await getOrCreateTempUser(clientId)
})
