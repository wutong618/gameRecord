import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { handleUpload } from '@vercel/blob/client';
import { s as setPlayerAvatar } from '../../_/room.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@vercel/postgres';

const uploadAvatar = defineEventHandler(async (event) => {
  var _a, _b;
  const body = await readBody(event);
  try {
    const json = await handleUpload({
      body,
      request: event.node.req,
      onBeforeGenerateToken: async (pathname) => {
        const m = pathname.match(/^avatars\/(\d)\//);
        if (!m) throw new Error("\u975E\u6CD5\u8DEF\u5F84");
        const playerId = Number(m[1]);
        if (playerId < 0 || playerId > 3) throw new Error("playerId \u8D8A\u754C");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
          maximumSizeInBytes: 2 * 1024 * 1024,
          tokenPayload: JSON.stringify({ playerId })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          const playerId = Number(payload.playerId);
          if (Number.isInteger(playerId) && playerId >= 0 && playerId <= 3) {
            await setPlayerAvatar(playerId, blob.url);
            console.log(`[upload] done playerId=${playerId} url=${blob.url}`);
          }
        } catch (e) {
          console.error("[upload] onUploadCompleted failed:", e);
        }
      }
    });
    return json;
  } catch (e) {
    console.error("[upload] handleUpload failed:", (_a = e == null ? void 0 : e.message) != null ? _a : e);
    throw createError({ statusCode: 400, statusMessage: (_b = e == null ? void 0 : e.message) != null ? _b : "\u4E0A\u4F20\u5931\u8D25" });
  }
});

export { uploadAvatar as default };
//# sourceMappingURL=upload-avatar.mjs.map
