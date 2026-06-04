import { d as defineEventHandler, a as readMultipartFormData, c as createError } from '../../nitro/nitro.mjs';
import { put } from '@vercel/blob';
import { b as getPlayer, s as setPlayerAvatar } from '../../_/room.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@vercel/postgres';

const uploadAvatar_post = defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: "\u9700\u8981 multipart/form-data" });
  }
  const filePart = form.find((p) => p.name === "file");
  const idPart = form.find((p) => p.name === "playerId");
  if (!(filePart == null ? void 0 : filePart.data) || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 file \u5B57\u6BB5" });
  }
  if (!(idPart == null ? void 0 : idPart.data)) {
    throw createError({ statusCode: 400, statusMessage: "\u7F3A\u5C11 playerId \u5B57\u6BB5" });
  }
  const playerId = Number(idPart.data.toString());
  if (!Number.isInteger(playerId) || playerId < 0 || playerId > 3) {
    throw createError({ statusCode: 400, statusMessage: "playerId \u5FC5\u987B\u662F 0-3" });
  }
  const player = await getPlayer(playerId);
  if (!player) {
    throw createError({ statusCode: 404, statusMessage: "\u73A9\u5BB6\u4E0D\u5B58\u5728" });
  }
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
  if (filePart.type && !allowed.includes(filePart.type)) {
    throw createError({ statusCode: 400, statusMessage: "\u4EC5\u652F\u6301 png/jpg/webp/gif" });
  }
  if (filePart.data.length > 2 * 1024 * 1024) {
    throw createError({ statusCode: 400, statusMessage: "\u6587\u4EF6\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 2MB" });
  }
  const ext = (filePart.filename.split(".").pop() || "png").toLowerCase();
  const safeExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const filename = `avatars/${playerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const blob = await put(filename, filePart.data, {
    access: "public",
    contentType: filePart.type || "image/png",
    addRandomSuffix: false
  });
  await setPlayerAvatar(playerId, blob.url);
  return {
    success: true,
    playerId,
    url: blob.url
  };
});

export { uploadAvatar_post as default };
//# sourceMappingURL=upload-avatar.post.mjs.map
