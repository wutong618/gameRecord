import { d as defineEventHandler, g as getQuery, c as createError } from '../../nitro/nitro.mjs';
import { deleteAllRooms } from '../../_/room.mjs';
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

const rooms_delete = defineEventHandler(async (event) => {
  const q = getQuery(event);
  const clientId = typeof q.clientId === "string" && q.clientId.trim() ? q.clientId.trim() : "";
  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u7F3A\u5C11 clientId\uFF08\u51FA\u4E8E\u5B89\u5168\uFF0C\u4E0D\u5141\u8BB8\u6E05\u7A7A\u5168\u90E8\u623F\u95F4\uFF09"
    });
  }
  const count = await deleteAllRooms(clientId);
  return { success: true, deleted: count };
});

export { rooms_delete as default };
//# sourceMappingURL=rooms.delete.mjs.map
