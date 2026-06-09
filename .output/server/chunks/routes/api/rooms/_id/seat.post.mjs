import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody } from '../../../../nitro/nitro.mjs';
import { getOrCreateTempUser, seatPlayer } from '../../../../_/room.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../../../../_/postgres.mjs';
import '@vercel/postgres';

const seat_post = defineEventHandler(async (event) => {
  var _a;
  const roomId = getRouterParam(event, "id");
  if (!roomId) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 roomId" });
  }
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.clientId)) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 clientId" });
  }
  const user = await getOrCreateTempUser(body.clientId);
  try {
    return await seatPlayer(roomId, user.id, body.seatIndex);
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: (_a = e == null ? void 0 : e.message) != null ? _a : "\u5750\u4E0B\u5931\u8D25" });
  }
});

export { seat_post as default };
//# sourceMappingURL=seat.post.mjs.map
