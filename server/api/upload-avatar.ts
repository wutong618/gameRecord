import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { setPlayerAvatar } from '~/server/utils/room'

// POST /api/upload-avatar
// 用 Vercel Blob 官方推荐的 handleUpload 模式：
//   1. 浏览器先调这里拿一次性的 upload token（GET/POST body）
//   2. 浏览器用 token 直传文件到 Vercel Blob CDN
//   3. 上传完成时 Vercel Blob 回调本接口的 onUploadCompleted
//   4. 本接口把 blob url 写回 players 表
//
// 这样文件不经 server，绕开 Vercel serverless 4.5MB body 限制
export default defineEventHandler(async (event) => {
  const body = (await readBody<HandleUploadBody>(event)) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request: event.node.req as any,
      onBeforeGenerateToken: async (pathname) => {
        // pathname 形如 avatars/0/123-abc.png
        // 校验 playerId 是否在 0-3
        const m = pathname.match(/^avatars\/(\d)\//)
        if (!m) throw new Error('非法路径')
        const playerId = Number(m[1])
        if (playerId < 0 || playerId > 3) throw new Error('playerId 越界')
        return {
          allowedContentTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 2 * 1024 * 1024,
          tokenPayload: JSON.stringify({ playerId })
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || '{}')
          const playerId = Number(payload.playerId)
          if (Number.isInteger(playerId) && playerId >= 0 && playerId <= 3) {
            await setPlayerAvatar(playerId, blob.url)
            console.log(`[upload] done playerId=${playerId} url=${blob.url}`)
          }
        } catch (e) {
          console.error('[upload] onUploadCompleted failed:', e)
        }
      }
    })
    return json
  } catch (e: any) {
    console.error('[upload] handleUpload failed:', e?.message ?? e)
    throw createError({ statusCode: 400, statusMessage: e?.message ?? '上传失败' })
  }
})
