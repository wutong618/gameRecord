import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { listRooms } from '../../_/room.mjs';
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

const rooms_get = defineEventHandler(async () => {
  return await listRooms();
});

export { rooms_get as default };
//# sourceMappingURL=rooms.get.mjs.map
