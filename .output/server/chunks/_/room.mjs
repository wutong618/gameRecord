import { sql } from './postgres.mjs';
import '@vercel/postgres';

async function initDb() {
  await sql`DROP TABLE IF EXISTS players CASCADE`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT UNIQUE NOT NULL,
      openid TEXT UNIQUE,
      unionid TEXT,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      avatar_color TEXT,
      is_temporary BOOLEAN NOT NULL DEFAULT TRUE,
      is_vip BOOLEAN NOT NULL DEFAULT FALSE,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_openid
    ON users(openid) WHERE openid IS NOT NULL
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      room_id TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 10),
      game_data JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
    )
  `;
  await sql`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS max_players INTEGER NOT NULL DEFAULT 4
  `;
  await sql`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS name TEXT
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS session_players (
      id BIGSERIAL PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES game_sessions(room_id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seat_index INTEGER NOT NULL CHECK (seat_index >= 0 AND seat_index <= 9),
      joined_at BIGINT NOT NULL,
      UNIQUE(room_id, seat_index)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sp_room ON session_players(room_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sp_user ON session_players(user_id)`;
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

const PLAYER_COLORS = {
  "fire-red": { bg: "linear-gradient(135deg, #ff4444 0%, #ff6b35 50%, #ff8800 100%)", border: "#ff4444", neon: "#ff6600" },
  "deep-sea-blue": { bg: "linear-gradient(135deg, #0044ff 0%, #0088ff 50%, #00ccff 100%)", border: "#0088ff", neon: "#00ffff" },
  "emerald-green": { bg: "linear-gradient(135deg, #00aa44 0%, #00cc66 50%, #39ff14 100%)", border: "#00cc66", neon: "#39ff14" },
  "night-purple": { bg: "linear-gradient(135deg, #6600aa 0%, #8844cc 50%, #bb00ff 100%)", border: "#aa66ff", neon: "#ff00ff" },
  "sunset-orange": { bg: "linear-gradient(135deg, #ff8800 0%, #ffaa44 50%, #ffcc88 100%)", border: "#ffaa44", neon: "#ffbb55" },
  "rose-pink": { bg: "linear-gradient(135deg, #ff4488 0%, #ff77aa 50%, #ffaacc 100%)", border: "#ff77aa", neon: "#ff99cc" },
  "cyan-teal": { bg: "linear-gradient(135deg, #00bbcc 0%, #00ddee 50%, #88ffff 100%)", border: "#00ddee", neon: "#00ffff" },
  "lime-yellow": { bg: "linear-gradient(135deg, #88cc00 0%, #aaee44 50%, #ccff88 100%)", border: "#aaee44", neon: "#bbff55" },
  "magenta-pink": { bg: "linear-gradient(135deg, #cc0088 0%, #ee44aa 50%, #ff88cc 100%)", border: "#ee44aa", neon: "#ff77cc" },
  "ice-blue": { bg: "linear-gradient(135deg, #4488ff 0%, #77aaff 50%, #bbddff 100%)", border: "#77aaff", neon: "#99ccff" }
};
const RANDOM_ANIMALS = [
  "\u5C0F\u6050\u9F99",
  "\u5C0F\u718A\u732B",
  "\u5C0F\u72D0\u72F8",
  "\u5C0F\u8001\u864E",
  "\u5C0F\u5154\u5B50",
  "\u5C0F\u732B\u54AA",
  "\u5C0F\u67EF\u57FA",
  "\u5C0F\u6D77\u8C5A",
  "\u5C0F\u4F01\u9E45",
  "\u5C0F\u8003\u62C9",
  "\u5C0F\u523A\u732C",
  "\u5C0F\u4ED3\u9F20",
  "\u5C0F\u4E4C\u9F9F",
  "\u5C0F\u9E66\u9E49",
  "\u5C0F\u7F8A\u9A7C",
  "\u5C0F\u72FC\u5D3D",
  "\u5C0F\u9CC4\u9C7C",
  "\u5C0F\u677E\u9F20",
  "\u5C0F\u732A\u732A",
  "\u5C0F\u8C61\u8C61",
  "\u5C0F\u72EE\u5B50",
  "\u5C0F\u7329\u7329",
  "\u5C0F\u6CB3\u9A6C",
  "\u5C0F\u957F\u9888\u9E7F",
  "\u5C0F\u6591\u9A6C",
  "\u5C0F\u718A\u732B",
  "\u5C0F\u9EC4\u9E2D",
  "\u5C0F\u706B\u9E21",
  "\u5C0F\u9F99\u732B",
  "\u5C0F\u6811\u61D2"
];
const RANDOM_FRUITS = [
  "\u795E\u79D8\u82F9\u679C",
  "\u5947\u5F02\u9999\u8549",
  "\u751C\u6A59\u5B50",
  "\u7D2B\u8461\u8404",
  "\u8106\u897F\u74DC",
  "\u7EA2\u8349\u8393",
  "\u9EC4\u91D1\u8292",
  "\u84DD\u8393",
  "\u706B\u9F99\u679C",
  "\u7315\u7334\u6843",
  "\u767E\u9999\u679C",
  "\u756A\u77F3\u69B4",
  "\u96EA\u68A8",
  "\u7EA2\u5FC3\u67DA",
  "\u9ED1\u5E03\u6797",
  "\u871C\u74DC",
  "\u6930\u5B50",
  "\u5C71\u7AF9",
  "\u69B4\u83B2",
  "\u8354\u679D",
  "\u9F99\u773C",
  "\u6787\u6777",
  "\u6851\u845A",
  "\u6768\u6885",
  "\u674E\u5B50",
  "\u674F\u5B50",
  "\u77F3\u69B4",
  "\u67FF\u5B50",
  "\u8F66\u5398\u5B50",
  "\u725B\u6CB9\u679C"
];
function randomNickname() {
  const pool = [...RANDOM_ANIMALS, ...RANDOM_FRUITS];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const suffix = Math.random().toString(36).slice(2, 4);
  return `\u533F\u540D${base}${suffix}`;
}

const ROOM_CACHE_KEY = (id) => `room:${id}`;
function invalidateRoomCache(roomId) {
  if (roomId) cacheInvalidate(`room:${roomId}`);
  else cacheInvalidate("room:");
}
const COLOR_KEYS = Object.keys(PLAYER_COLORS);
function randomAvatarColor() {
  return COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
}
function rowToUser(r) {
  return {
    id: Number(r.id),
    clientId: r.client_id,
    openid: r.openid,
    unionid: r.unionid,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    avatarColor: r.avatar_color,
    isTemporary: r.is_temporary,
    isVip: r.is_vip,
    createdAt: typeof r.created_at === "string" ? Number(r.created_at) : r.created_at
  };
}
async function getOrCreateTempUser(clientId) {
  await initDb();
  const found = await sql`SELECT * FROM users WHERE client_id = ${clientId} LIMIT 1`;
  if (found.rows[0]) return rowToUser(found.rows[0]);
  const nickname = randomNickname();
  const avatarColor = randomAvatarColor();
  const createdAt = Date.now();
  const inserted = await sql`
    INSERT INTO users (client_id, nickname, avatar_color, is_temporary, is_vip, created_at)
    VALUES (${clientId}, ${nickname}, ${avatarColor}, TRUE, FALSE, ${createdAt})
    RETURNING *
  `;
  return rowToUser(inserted.rows[0]);
}
async function getUserById(id) {
  const { rows } = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] ? rowToUser(rows[0]) : null;
}
async function updateUser(id, patch) {
  const sets = [];
  const values = [];
  let i = 1;
  if (patch.nickname !== void 0) {
    sets.push(`nickname = $${i++}`);
    values.push(patch.nickname);
  }
  if (patch.avatarUrl !== void 0) {
    sets.push(`avatar_url = $${i++}`);
    values.push(patch.avatarUrl);
  }
  if (patch.avatarColor !== void 0) {
    sets.push(`avatar_color = $${i++}`);
    values.push(patch.avatarColor);
  }
  if (sets.length === 0) return await getUserById(id);
  values.push(id);
  const { rows } = await sql.query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}
async function bindWechat(clientId, openid, nickname, avatarUrl) {
  const sets = [
    "openid = $1",
    "is_temporary = FALSE",
    "nickname = $2",
    "avatar_url = $3"
  ];
  const values = [openid, nickname, avatarUrl];
  values.push(clientId);
  const { rows } = await sql.query(
    `UPDATE users SET ${sets.join(", ")} WHERE client_id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}
async function getRoomSeats(roomId) {
  var _a, _b, _c;
  const session = await sql`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `;
  const max = (_b = (_a = session.rows[0]) == null ? void 0 : _a.max_players) != null ? _b : 4;
  const occupied = await sql`
    SELECT sp.seat_index, u.* FROM session_players sp
    JOIN users u ON u.id = sp.user_id
    WHERE sp.room_id = ${roomId}
    ORDER BY sp.seat_index ASC
  `;
  const m2 = /* @__PURE__ */ new Map();
  for (const r of occupied.rows) {
    m2.set(r.seat_index, rowToUser(r));
  }
  const seats = [];
  for (let i = 0; i < max; i++) {
    seats.push({ seatIndex: i, user: (_c = m2.get(i)) != null ? _c : null });
  }
  return seats;
}
async function getRoomWithSeats(roomId) {
  const cached = cacheGet(ROOM_CACHE_KEY(roomId));
  if (cached !== null && cached !== void 0) return cached;
  await initDb();
  const sessionRes = await sql`SELECT room_id, created_at, max_players, name, game_data FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`;
  if (!sessionRes.rows[0]) {
    cacheSet(ROOM_CACHE_KEY(roomId), null, 2e3);
    return null;
  }
  const row = sessionRes.rows[0];
  const gameData = typeof row.game_data === "string" ? JSON.parse(row.game_data) : row.game_data;
  const seats = await getRoomSeats(roomId);
  const session = {
    roomId: row.room_id,
    createdAt: typeof row.created_at === "string" ? Number(row.created_at) : row.created_at,
    maxPlayers: row.max_players,
    name: row.name,
    gameData,
    seats
  };
  cacheSet(ROOM_CACHE_KEY(roomId), session, 5e3);
  return session;
}
async function createRoomWithCreator(roomId, maxPlayers, creatorUserId, name) {
  await initDb();
  const user = await getUserById(creatorUserId);
  if (!user) throw new Error("creator user \u4E0D\u5B58\u5728");
  const createdAt = Date.now();
  const safeName = (name || "").trim().slice(0, 30) || null;
  await sql`
    INSERT INTO game_sessions (room_id, created_at, max_players, name, game_data)
    VALUES (${roomId}, ${createdAt}, ${maxPlayers}, ${safeName}, ${JSON.stringify({ rounds: [] })})
    ON CONFLICT (room_id) DO NOTHING
  `;
  await sql`
    INSERT INTO session_players (room_id, user_id, seat_index, joined_at)
    VALUES (${roomId}, ${creatorUserId}, 0, ${createdAt})
    ON CONFLICT (room_id, seat_index) DO NOTHING
  `;
  invalidateRoomCache(roomId);
  const session = await getRoomWithSeats(roomId);
  if (!session) throw new Error("\u521B\u5EFA\u623F\u95F4\u540E\u67E5\u8BE2\u5931\u8D25");
  return session;
}
async function seatPlayer(roomId, userId, seatIndex) {
  var _a;
  await initDb();
  const sess = await sql`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `;
  if (!sess.rows[0]) throw new Error("\u623F\u95F4\u4E0D\u5B58\u5728");
  const max = sess.rows[0].max_players;
  const existing = await sql`
    SELECT seat_index FROM session_players WHERE room_id = ${roomId} AND user_id = ${userId} LIMIT 1
  `;
  const currentSeat = (_a = existing.rows[0]) == null ? void 0 : _a.seat_index;
  const switched = currentSeat !== void 0;
  let targetIndex = seatIndex;
  if (targetIndex === void 0) {
    const occupied = await sql`
      SELECT seat_index FROM session_players WHERE room_id = ${roomId}
    `;
    const taken = new Set(occupied.rows.map((r) => r.seat_index));
    targetIndex = -1;
    for (let i = 0; i < max; i++) {
      if (!taken.has(i) || i === currentSeat) {
        targetIndex = i;
        break;
      }
    }
    if (targetIndex === -1) throw new Error("\u623F\u95F4\u5DF2\u6EE1");
  } else {
    if (targetIndex < 0 || targetIndex >= max) throw new Error("seatIndex \u8D8A\u754C");
    if (targetIndex !== currentSeat) {
      const exists = await sql`
        SELECT 1 FROM session_players WHERE room_id = ${roomId} AND seat_index = ${targetIndex} LIMIT 1
      `;
      if (exists.rows[0]) throw new Error("\u8BE5\u4F4D\u7F6E\u5DF2\u88AB\u5360\u7528");
    }
  }
  if (currentSeat !== void 0 && currentSeat !== targetIndex) {
    await sql`DELETE FROM session_players WHERE room_id = ${roomId} AND user_id = ${userId}`;
  }
  if (currentSeat !== targetIndex) {
    await sql`
      INSERT INTO session_players (room_id, user_id, seat_index, joined_at)
      VALUES (${roomId}, ${userId}, ${targetIndex}, ${Date.now()})
    `;
  }
  invalidateRoomCache(roomId);
  const session = await getRoomWithSeats(roomId);
  if (!session) throw new Error("\u5750\u4E0B\u540E\u67E5\u8BE2\u5931\u8D25");
  return { seat: session.seats[targetIndex], session, switched };
}
async function leaveSeat(roomId, seatIndex) {
  await sql`DELETE FROM session_players WHERE room_id = ${roomId} AND seat_index = ${seatIndex}`;
  invalidateRoomCache(roomId);
}
async function updateRoomGameData(roomId, gameData) {
  var _a, _b;
  await initDb();
  const exists = await sql`SELECT 1 FROM game_sessions WHERE room_id = ${roomId} LIMIT 1`;
  if (!exists.rows[0]) {
    await sql`
      INSERT INTO game_sessions (room_id, created_at, max_players, game_data)
      VALUES (${roomId}, ${Date.now()}, 4, ${JSON.stringify(gameData)})
    `;
    return;
  }
  const roomMeta = await sql`
    SELECT max_players FROM game_sessions WHERE room_id = ${roomId} LIMIT 1
  `;
  const max = (_b = (_a = roomMeta.rows[0]) == null ? void 0 : _a.max_players) != null ? _b : 4;
  for (const r of gameData.rounds) {
    if (r.scores.length !== max) {
      throw new Error(`round ${r.roundNumber} scores \u957F\u5EA6 ${r.scores.length} \u4E0E max_players ${max} \u4E0D\u4E00\u81F4`);
    }
  }
  await sql`
    UPDATE game_sessions
    SET game_data = ${JSON.stringify(gameData)}
    WHERE room_id = ${roomId}
  `;
  invalidateRoomCache(roomId);
}
async function deleteRoom(roomId) {
  var _a;
  const result = await sql`DELETE FROM game_sessions WHERE room_id = ${roomId}`;
  invalidateRoomCache(roomId);
  return ((_a = result.rowCount) != null ? _a : 0) > 0;
}
async function deleteAllRooms(clientId) {
  var _a;
  let result;
  if (clientId) {
    const userRow = await sql`SELECT id FROM users WHERE client_id = ${clientId} LIMIT 1`;
    if (!userRow.rows[0]) return 0;
    const uid = userRow.rows[0].id;
    result = await sql`
      DELETE FROM game_sessions
      WHERE room_id IN (SELECT room_id FROM session_players WHERE user_id = ${uid})
    `;
  } else {
    result = await sql`DELETE FROM game_sessions`;
  }
  cacheInvalidate("room:");
  cacheInvalidate("rooms:list");
  return (_a = result.rowCount) != null ? _a : 0;
}
async function listRooms(clientId) {
  const KEY = clientId ? `rooms:list:${clientId}` : "rooms:list:all";
  const cached = cacheGet(KEY);
  if (cached) return cached;
  await initDb();
  let userId = null;
  if (clientId) {
    const u = await sql`SELECT id FROM users WHERE client_id = ${clientId} LIMIT 1`;
    if (!u.rows[0]) {
      cacheSet(KEY, [], 2e3);
      return [];
    }
    userId = u.rows[0].id;
  }
  const sessRows = userId ? await sql.query(
    `SELECT gs.room_id, gs.name, gs.created_at, gs.max_players, gs.game_data
         FROM game_sessions gs
         WHERE EXISTS (
           SELECT 1 FROM session_players sp
           WHERE sp.room_id = gs.room_id AND sp.user_id = $1
         )`,
    [userId]
  ) : await sql`SELECT room_id, name, created_at, max_players, game_data FROM game_sessions`;
  const countRows = await sql`
    SELECT room_id, COUNT(*)::int AS seated
    FROM session_players GROUP BY room_id
  `;
  const seatMap = new Map(countRows.rows.map((r) => [r.room_id, r.seated]));
  const list = sessRows.rows.map((r) => {
    var _a, _b, _c;
    const gd = typeof r.game_data === "string" ? JSON.parse(r.game_data) : r.game_data;
    const createdAt = typeof r.created_at === "string" ? Number(r.created_at) : r.created_at;
    const lastRound = gd.rounds[gd.rounds.length - 1];
    return {
      roomId: r.room_id,
      name: r.name,
      createdAt,
      maxPlayers: r.max_players,
      seatedCount: (_a = seatMap.get(r.room_id)) != null ? _a : 0,
      roundsCount: gd.rounds.length,
      lastActivityAt: (_c = (_b = lastRound == null ? void 0 : lastRound.recordedAt) != null ? _b : lastRound == null ? void 0 : lastRound.updatedAt) != null ? _c : createdAt
    };
  });
  list.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  cacheSet(KEY, list, 2e3);
  return list;
}

export { bindWechat, createRoomWithCreator, deleteAllRooms, deleteRoom, getOrCreateTempUser, getRoomWithSeats, getUserById, invalidateRoomCache, leaveSeat, listRooms, seatPlayer, updateRoomGameData, updateUser };
//# sourceMappingURL=room.mjs.map
