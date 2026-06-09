import { bindWechat } from '~/server/utils/room'

// POST /api/users/bind-wechat (mock)
// body: { clientId, openid, nickname, avatarUrl }
// demo 阶段：前端让用户填表单模拟微信授权
// 生产阶段：换成 jscode2session 拿真实 openid
export default defineEventHandler(async (event) => {
  const body = await readBody<{
    clientId: string
    openid: string
    nickname: string
    avatarUrl: string
  }>(event)
  if (!body?.clientId || !body.openid || !body.nickname) {
    throw createError({ statusCode: 400, statusMessage: '缺少必填字段' })
  }
  if (body.nickname.length > 20) {
    throw createError({ statusCode: 400, statusMessage: '昵称过长（≤20）' })
  }
  return await bindWechat(body.clientId, body.openid, body.nickname, body.avatarUrl)
})
