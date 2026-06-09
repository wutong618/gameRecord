import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { sql } from '../../../_/postgres.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@vercel/postgres';

function rowToUser(r) {
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
    createdAt: typeof r.created_at === "string" ? Number(r.created_at) : r.created_at
  };
}

const me_get = defineEventHandler(async (event) => {
  const q = getQuery(event);
  const clientId = typeof q.clientId === "string" ? q.clientId.trim() : "";
  if (!clientId) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 clientId" });
  }
  const { rows } = await sql`SELECT * FROM users WHERE client_id = ${clientId} LIMIT 1`;
  if (!rows[0]) return null;
  return rowToUser(rows[0]);
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
