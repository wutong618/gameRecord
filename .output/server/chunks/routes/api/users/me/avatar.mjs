import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { handleUpload } from '@vercel/blob/client';
import { sql } from '../../../../_/postgres.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@vercel/postgres';

const avatar = defineEventHandler(async (event) => {
  var _a, _b;
  const body = await readBody(event);
  try {
    const json = await handleUpload({
      body,
      request: event.node.req,
      onBeforeGenerateToken: async (pathname) => {
        const m = pathname.match(/^avatars\/(\d+)\//);
        if (!m) throw new Error("\u975E\u6CD5\u8DEF\u5F84");
        const userId = Number(m[1]);
        if (!Number.isInteger(userId) || userId <= 0) throw new Error("userId \u8D8A\u754C");
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
          maximumSizeInBytes: 2 * 1024 * 1024,
          tokenPayload: JSON.stringify({ userId })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          const userId = Number(payload.userId);
          if (Number.isInteger(userId) && userId > 0) {
            await sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${userId}`;
            console.log(`[avatar] user=${userId} url=${blob.url}`);
          }
        } catch (e) {
          console.error("[avatar] onUploadCompleted failed:", e);
        }
      }
    });
    return json;
  } catch (e) {
    console.error("[avatar] handleUpload failed:", (_a = e == null ? void 0 : e.message) != null ? _a : e);
    throw createError({ statusCode: 400, statusMessage: (_b = e == null ? void 0 : e.message) != null ? _b : "\u4E0A\u4F20\u5931\u8D25" });
  }
});

export { avatar as default };
//# sourceMappingURL=avatar.mjs.map
