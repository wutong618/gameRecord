import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { updateUser } from '../../../_/room.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../../../_/postgres.mjs';
import '@vercel/postgres';

const me_put = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.clientId)) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 clientId" });
  }
  const { sql } = await import('../../../_/postgres.mjs');
  const user = await sql`SELECT id FROM users WHERE client_id = ${body.clientId} LIMIT 1`;
  if (!user.rows[0]) {
    throw createError({ statusCode: 404, statusMessage: "\u7528\u6237\u4E0D\u5B58\u5728" });
  }
  const updated = await updateUser(user.rows[0].id, {
    nickname: body.nickname,
    avatarUrl: body.avatarUrl,
    avatarColor: body.avatarColor
  });
  return updated;
});

export { me_put as default };
//# sourceMappingURL=me.put.mjs.map
