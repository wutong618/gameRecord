import { sql } from '~/server/utils/postgres'
import { rowToUser, type UserRow } from '~/server/utils/mappers'

// GET /api/users/me?clientId=xxx
// demo 阶段：client 通过 query 传 clientId（生产应用可换 cookie/session）
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const clientId = typeof q.clientId === 'string' ? q.clientId.trim() : ''
  if (!clientId) {
    throw createError({ statusCode: 400, statusMessage: '缺少 clientId' })
  }
  const { rows } = await sql<UserRow>`SELECT * FROM users WHERE client_id = ${clientId} LIMIT 1`
  if (!rows[0]) return null
  return rowToUser(rows[0])
})
