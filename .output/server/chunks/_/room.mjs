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

const DEFAULT_PLAYERS = [
  { id: 0, name: "\u5434", color: "fire-red" },
  { id: 1, name: "\u738B", color: "deep-sea-blue" },
  { id: 2, name: "\u6765", color: "emerald-green" },
  { id: 3, name: "\u9759", color: "night-purple" }
];

async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_url TEXT,
      color TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      room_id TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      game_data JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
    )
  `;
  for (const p of DEFAULT_PLAYERS) {
    await sql`
      INSERT INTO players (id, name, color)
      VALUES (${p.id}, ${p.name}, ${p.color})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

const store = /* @__PURE__ */ new Map();
function cacheGet(key) {
  const e = store.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    store.delete(key);
    return null;
  }
  return e.value;
}
function cacheSet(key, value, ttlMs = 5e3) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
function cacheInvalidate(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

const PLAYERS_CACHE_KEY = "players:all";
const ROOM_CACHE_KEY = (id) => `room:${id}`;
function invalidateRoomCache(roomId) {
  if (roomId) cacheInvalidate(`room:${roomId}`);
  else cacheInvalidate("room:");
}
function rowToPlayer(row) {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    color: row.color
  };
}
async function getAllPlayers() {
  const cached = cacheGet(PLAYERS_CACHE_KEY);
  if (cached) return cached;
  const { rows } = await sql`SELECT id, name, avatar_url, color FROM players ORDER BY id ASC`;
  const players = rows.map(rowToPlayer);
  cacheSet(PLAYERS_CACHE_KEY, players, 5e3);
  return players;
}
async function getPlayer(id) {
  const { rows } = await sql`SELECT id, name, avatar_url, color FROM players WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToPlayer(rows[0]) : null;
}
async function setPlayerAvatar(id, avatarUrl) {
  await sql`UPDATE players SET avatar_url = ${avatarUrl} WHERE id = ${id}`;
  cacheInvalidate("players:");
}
function parseGameData(raw) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { rounds: [] };
    }
  }
  return raw;
}
function rowToSession(row, players) {
  return {
    roomId: row.room_id,
    createdAt: typeof row.created_at === "string" ? Number(row.created_at) : row.created_at,
    gameData: parseGameData(row.game_data),
    players
  };
}
async function getRoom(roomId) {
  const cached = cacheGet(ROOM_CACHE_KEY(roomId));
  if (cached !== null && cached !== void 0) return cached;
  await initDb();
  const players = await getAllPlayers();
  const { rows } = await sql`SELECT room_id, created_at, game_data FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`;
  if (!rows[0]) {
    cacheSet(ROOM_CACHE_KEY(roomId), null, 2e3);
    return null;
  }
  const session = rowToSession(rows[0], players);
  cacheSet(ROOM_CACHE_KEY(roomId), session, 5e3);
  return session;
}
async function updateRoomGameData(roomId, gameData) {
  await initDb();
  await sql`
    INSERT INTO game_sessions (room_id, created_at, game_data)
    VALUES (${roomId}, ${Date.now()}, ${JSON.stringify(gameData)})
    ON CONFLICT (room_id) DO UPDATE SET game_data = EXCLUDED.game_data
  `;
  invalidateRoomCache(roomId);
}
async function deleteRoom(roomId) {
  var _a;
  const result = await sql`DELETE FROM game_sessions WHERE room_id = ${roomId}`;
  invalidateRoomCache(roomId);
  return ((_a = result.rowCount) != null ? _a : 0) > 0;
}
async function deleteAllRooms() {
  var _a;
  const result = await sql`DELETE FROM game_sessions`;
  cacheInvalidate("room:");
  return (_a = result.rowCount) != null ? _a : 0;
}
async function listRooms() {
  const KEY = "rooms:list";
  const cached = cacheGet(KEY);
  if (cached) return cached;
  const { rows } = await sql`SELECT room_id, created_at, game_data FROM game_sessions`;
  const list = rows.map((r) => {
    var _a;
    const gd = parseGameData(r.game_data);
    const createdAt = typeof r.created_at === "string" ? Number(r.created_at) : r.created_at;
    const lastRound = gd.rounds[gd.rounds.length - 1];
    return {
      roomId: r.room_id,
      createdAt,
      roundsCount: gd.rounds.length,
      lastActivityAt: (_a = lastRound == null ? void 0 : lastRound.createdAt) != null ? _a : createdAt
    };
  }).sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  cacheSet(KEY, list, 2e3);
  return list;
}

export { deleteAllRooms as a, getPlayer as b, deleteRoom as d, getRoom as g, invalidateRoomCache as i, listRooms as l, setPlayerAvatar as s, updateRoomGameData as u };
//# sourceMappingURL=room.mjs.map
