import { d as defineEventHandler, g as getQuery, c as createError, r as readBody } from '../../nitro/nitro.mjs';
import { updateRoomGameData } from '../../_/room.mjs';
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

const room_post = defineEventHandler(async (event) => {
  const id = getQuery(event).id;
  if (typeof id !== "string" || !id.trim()) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 id \u53C2\u6570" });
  }
  const body = await readBody(event);
  if (!body || !body.gameData || !Array.isArray(body.gameData.rounds)) {
    throw createError({ statusCode: 400, statusMessage: "\u8BF7\u6C42\u4F53\u9700\u8981\u5305\u542B gameData.rounds \u6570\u7EC4" });
  }
  await updateRoomGameData(id.trim(), body.gameData);
  return { success: true };
});

export { room_post as default };
//# sourceMappingURL=room.post.mjs.map
