import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { deleteAllRooms, invalidateRoomCache } from '../../_/room.mjs';
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

const rooms_delete = defineEventHandler(async () => {
  const count = await deleteAllRooms();
  invalidateRoomCache();
  return { success: true, deleted: count };
});

export { rooms_delete as default };
//# sourceMappingURL=rooms.delete.mjs.map
