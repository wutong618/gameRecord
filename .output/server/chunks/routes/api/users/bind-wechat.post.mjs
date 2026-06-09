import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { bindWechat } from '../../../_/room.mjs';
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

const bindWechat_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.clientId) || !body.openid || !body.nickname) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5" });
  }
  if (body.nickname.length > 20) {
    throw createError({ statusCode: 400, statusMessage: "\u6635\u79F0\u8FC7\u957F\uFF08\u226420\uFF09" });
  }
  return await bindWechat(body.clientId, body.openid, body.nickname, body.avatarUrl);
});

export { bindWechat_post as default };
//# sourceMappingURL=bind-wechat.post.mjs.map
