import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { getOrCreateTempUser } from '../../../_/room.mjs';
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

const temp_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const clientId = typeof (body == null ? void 0 : body.clientId) === "string" ? body.clientId.trim() : "";
  if (!clientId) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 clientId" });
  }
  if (clientId.length > 64) {
    throw createError({ statusCode: 400, statusMessage: "clientId \u8FC7\u957F" });
  }
  return await getOrCreateTempUser(clientId);
});

export { temp_post as default };
//# sourceMappingURL=temp.post.mjs.map
