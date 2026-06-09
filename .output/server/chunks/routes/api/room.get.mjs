import { d as defineEventHandler, g as getQuery, c as createError } from '../../nitro/nitro.mjs';
import { getRoomWithSeats } from '../../_/room.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../../_/postgres.mjs';
import '@vercel/postgres';

const room_get = defineEventHandler(async (event) => {
  const id = getQuery(event).id;
  if (typeof id !== "string" || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 id \u53C2\u6570" });
  }
  const session = await getRoomWithSeats(id.trim());
  if (!session) {
    throw createError({ statusCode: 404, statusMessage: "\u623F\u95F4\u4E0D\u5B58\u5728" });
  }
  return session;
});

export { room_get as default };
//# sourceMappingURL=room.get.mjs.map
