import { d as defineEventHandler, a as getRouterParam, c as createError, g as getQuery } from '../../../../nitro/nitro.mjs';
import { leaveSeat } from '../../../../_/room.mjs';
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

const seat_delete = defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id");
  if (!roomId) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 roomId" });
  }
  const q = getQuery(event);
  const seatIndex = Number(q.seatIndex);
  if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex > 9) {
    throw createError({ statusCode: 400, statusMessage: "seatIndex \u5FC5\u987B\u662F 0-9" });
  }
  await leaveSeat(roomId, seatIndex);
  return { success: true };
});

export { seat_delete as default };
//# sourceMappingURL=seat.delete.mjs.map
