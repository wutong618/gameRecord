import { sql as sql$1 } from '@vercel/postgres';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 15e3;
const BACKOFF_BASE_MS = 800;
function withTimeout(p, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[postgres] ${label} timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
async function withRetry(fn, label) {
  var _a;
  let lastErr;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await withTimeout(fn(), TIMEOUT_MS, label);
    } catch (e) {
      lastErr = e;
      const msg = (_a = e == null ? void 0 : e.message) != null ? _a : String(e);
      if (msg.includes("duplicate key") || msg.includes("violates") || msg.includes("syntax error")) {
        throw e;
      }
      console.warn(`[postgres] ${label} attempt ${i + 1}/${MAX_RETRIES} failed: ${msg}`);
      if (i < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * (i + 1)));
      }
    }
  }
  throw lastErr;
}
const sql = new Proxy(sql$1, {
  apply(_target, thisArg, args) {
    const strings = args[0];
    const label = strings && strings[0] ? strings[0].trim().split("\n")[0].slice(0, 60) : "sql";
    return withRetry(
      () => Reflect.apply(sql$1, thisArg, args),
      label
    );
  }
});

export { sql };
//# sourceMappingURL=postgres.mjs.map
