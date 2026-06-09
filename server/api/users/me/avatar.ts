import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { sql } from '~/server/utils/postgres'
import { rowToUser, type UserRow } from '~/server/utils/mappers'

// POST /api/users/me/avatar
// Vercel Blob 推荐的 handleUpload 模式：
// 1. 客户端调这里拿 token
// 2. 拿 token 直传 Blob CDN
// 3. 上传完成 Blob 回调 onUploadCompleted 写回 users.avatar_url
//
// 路径规则：avatars/{userId}/{timestamp}-{random}.{ext}
// tokenPayload 带 userId，回调时用于 UPDATE
export default defineEventHandler(async (event) => {
  const body = (await readBody<HandleUploadBody>(event)) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request: event.node.req as any,
      onBeforeGenerateToken: async (pathname) => {
        // pathname: avatars/{userId}/{...}.{ext}
        const m = pathname.match(/^avatars\/(\d+)\//)
        if (!m) throw new Error('非法路径')
        const userId = Number(m[1])
        if (!Number.isInteger(userId) || userId <= 0) throw new Error('userId 越界')
        return {
          allowedContentTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 2 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId })
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || '{}')
          const userId = Number(payload.userId)
          if (Number.isInteger(userId) && userId > 0) {
            await sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${userId}`
            console.log(`[avatar] user=${userId} url=${blob.url}`)
          }
        } catch (e) {
          console.error('[avatar] onUploadCompleted failed:', e)
        }
      }
    })
    return json
  } catch (e: any) {
    console.error('[avatar] handleUpload failed:', e?.message ?? e)
    throw createError({ statusCode: 400, statusMessage: e?.message ?? '上传失败' })
  }
})
