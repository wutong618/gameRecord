import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { createRoomWithCreator } from '../../_/room.mjs';
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

const rooms_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const max = Number(body == null ? void 0 : body.maxPlayers);
  if (!Number.isInteger(max) || max < 2 || max > 10) {
    throw createError({ statusCode: 400, statusMessage: "maxPlayers \u5FC5\u987B\u662F 2-10 \u7684\u6574\u6570" });
  }
  if (!(body == null ? void 0 : body.creatorClientId)) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 creatorClientId" });
  }
  const { getOrCreateTempUser } = await import('../../_/room.mjs');
  const creator = await getOrCreateTempUser(body.creatorClientId);
  const roomId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const session = await createRoomWithCreator(roomId, max, creator.id, body.name);
  return session;
});

export { rooms_post as default };
//# sourceMappingURL=rooms.post.mjs.map
