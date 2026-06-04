import { put } from '@vercel/blob'
import { getPlayer, setPlayerAvatar } from '~/server/utils/room'

// POST /api/upload-avatar
//   multipart/form-data:
//     - file: 头像图片
//     - playerId: 玩家 id (0-3)
// 上传到 Vercel Blob，再把返回的 url 写回 players 表
export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: '需要 multipart/form-data' })
  }

  const filePart = form.find(p => p.name === 'file')
  const idPart = form.find(p => p.name === 'playerId')
  if (!filePart?.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: '缺少 file 字段' })
  }
  if (!idPart?.data) {
    throw createError({ statusCode: 400, statusMessage: '缺少 playerId 字段' })
  }
  const playerId = Number(idPart.data.toString())
  if (!Number.isInteger(playerId) || playerId < 0 || playerId > 3) {
    throw createError({ statusCode: 400, statusMessage: 'playerId 必须是 0-3' })
  }
  const player = await getPlayer(playerId)
  if (!player) {
    throw createError({ statusCode: 404, statusMessage: '玩家不存在' })
  }

  // 文件类型白名单
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
  if (filePart.type && !allowed.includes(filePart.type)) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 png/jpg/webp/gif' })
  }
  // 限制大小：2MB
  if (filePart.data.length > 2 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: '文件大小不能超过 2MB' })
  }

  // 拼一个不冲突的文件名：avatars/{id}/{timestamp}-{随机}.{ext}
  const ext = (filePart.filename.split('.').pop() || 'png').toLowerCase()
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) ? ext : 'png'
  const filename = `avatars/${playerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`

  // @vercel/blob 需要 BLOB_READ_WRITE_TOKEN；本地未配置时会报错
  const blob = await put(filename, filePart.data, {
    access: 'public',
    contentType: filePart.type || 'image/png',
    addRandomSuffix: false
  })

  await setPlayerAvatar(playerId, blob.url)
  return {
    success: true,
    playerId,
    url: blob.url
  }
})
