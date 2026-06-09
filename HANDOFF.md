# gameRecord · 项目 Handoff 文档

> 接手这个项目的 AI / 工程师请先读这一篇。
> 文档截至 2026-06-09，覆盖 v1.0 → v3.0 全部演进 + UI 视觉重塑 + 幽默裁判系统。

---

## 0. 一句话定位

**多玩家动态人数（2-10 人）实时同步的计分/排名应用**，部署在 Vercel，后端用 Vercel Neon PostgreSQL（us-east-1）+ Vercel Blob。
主打"零门槛加号坐下"（无登录弹窗，先坐下后完善资料），辅以"幽默裁判系统"在记分时随机弹 50 条毒舌文案。

---

## 1. 技术栈

| 层 | 技术 | 备注 |
|---|---|---|
| 框架 | Nuxt 3.11.2（SSR: false，纯 SPA） | `nuxt.config.ts` |
| UI | Tailwind CSS（自定义 cyber 设计 token） | `tailwind.config.js` |
| 图表 | Chart.js 4.4.2 + vue-chartjs 5.3.0 | 柱状图 + 折线图 |
| 状态 | Vue 3.4 Composition API + ref/computed | 单例全局 ref 跨组件共享 |
| 图标 | lucide-vue-next | 全站统一 |
| 字体 | Google Fonts: Audiowide / Orbitron / Bungee / Russo One / JetBrains Mono + Noto Sans SC + 系统 PingFang SC | 主标题苹方，数字 Russo One，标签 Orbitron |
| 客户端持久化 | LocalStorage（clientId + 用户缓存） | 跨 tab 隔离 |
| 同步策略 | **Polling**（8 秒一次，非 WebSocket） | `composables/usePolling.ts` |
| 实时数据 | `@vercel/postgres` 0.10（HTTP 模式，连接池） | 5s 进程内缓存 |
| 文件存储 | Vercel Blob（handleUpload 模式） | `@vercel/blob/client` |
| 图片压缩 | `browser-image-compression` | web worker，目标 200KB |
| 部署 | Vercel（`vercel deploy --prod`） | 自动注入 env vars |
| 预览 | `node --env-file=.env .output/server/index.mjs` | 本地生产构建 |

---

## 2. 环境变量（.env / Vercel Project Settings）

```
POSTGRES_URL=postgresql://...        # Neon 连接串
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...  # Vercel Blob token
```

**注意**：Vercel Marketplace 的 Neon 集成**不会自动注入** `BLOB_READ_WRITE_TOKEN`，需手动 `vercel env add BLOB_READ_WRITE_TOKEN production` 添加。本地 build 用 `nuxt.config.ts` 内置的 `.env` fallback（不需要 Google Fonts 的 download flag）。

---

## 3. 数据库 Schema（PostgreSQL via Neon）

### 3.1 users —— 玩家档案（替代 v2.x 的 players 表）
```sql
id            BIGSERIAL PRIMARY KEY
client_id     TEXT UNIQUE NOT NULL    -- 前端 LocalStorage 中的临时凭证（永久用户也保留）
openid        TEXT UNIQUE              -- 微信 openid（仅正式用户）
unionid       TEXT
nickname      TEXT NOT NULL
avatar_url    TEXT
avatar_color  TEXT                    -- 纯文字头像的随机色 key
is_temporary  BOOLEAN DEFAULT TRUE
is_vip        BOOLEAN DEFAULT FALSE
created_at    BIGINT NOT NULL
```

### 3.2 game_sessions —— 房间
```sql
room_id       TEXT PRIMARY KEY
created_at    BIGINT NOT NULL
max_players   INTEGER NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 10)
name          TEXT
game_data     JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
```

`game_data.rounds` 数组每个元素结构（v3.0）：
```ts
{
  roundNumber: number
  scores: number[]         // 长度 = max_players，按座位顺序
  recordedBy: number       // user id
  recordedAt: number
  updatedBy?: number
  updatedAt?: number
}
```

### 3.3 session_players —— 座位映射
```sql
id            BIGSERIAL PRIMARY KEY
room_id       TEXT NOT NULL REFERENCES game_sessions(room_id) ON DELETE CASCADE
user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
seat_index    INTEGER NOT NULL CHECK (seat_index >= 0 AND seat_index <= 9)
joined_at     BIGINT NOT NULL
UNIQUE(room_id, seat_index)
```

### 3.4 已删除
- ❌ `players` 表（v2.0 4 行固定玩家）—— init-db 自动 DROP

### 3.5 初始化
`server/utils/init-db.ts` 在每个 API 第一次调用时**惰性**建表（幂等）。包括 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 兼容老表升级。

---

## 4. Server API 完整清单

所有路由在 `server/api/`。

| 方法 | 路径 | 用途 |
|---|---|---|
| `GET` | `/api/room?id=xxx` | 查询房间（不存在返 404） |
| `POST` | `/api/room?id=xxx` | 覆盖 gameData，server 端校验 scores 长度 = max_players |
| `DELETE` | `/api/room?id=xxx` | 删除整局（硬删） |
| `POST` | `/api/rooms` | 创建房间（body: maxPlayers, creatorClientId, name?）房主自动坐 seat 0 |
| `GET` | `/api/rooms?clientId=xxx` | 列出该用户参与过的房间摘要 |
| `DELETE` | `/api/rooms?clientId=xxx` | **必须传 clientId**——只删该用户参与过的（多租户安全） |
| `POST` | `/api/rooms/:id/seat` | 坐下/换座（switched: true 表示换了位置） |
| `DELETE` | `/api/rooms/:id/seat?seatIndex=N` | 离座（v3.0 可选功能，保留供将来） |
| `POST` | `/api/users/temp` | 用 clientId 创建/获取临时用户 |
| `GET` | `/api/users/me?clientId=xxx` | 查当前用户 |
| `PUT` | `/api/users/me` | 改昵称/头像/颜色 |
| `POST` | `/api/users/bind-wechat` | **Mock** 微信绑定（body: clientId, openid, nickname, avatarUrl） |
| `POST` | `/api/users/me/avatar` | 头像上传（handleUpload 模式，前端直传 Vercel Blob） |

**server 端重试 + 缓存**：
- `server/utils/postgres.ts` 给所有 SQL 加 3 次重试 + 15s 超时 + 指数退避
- `server/utils/cache.ts` 进程内 Map 缓存 5s（getRoomWithSeats / getAllPlayers / listRooms）
- 写操作（updateRoomGameData / seatPlayer / deleteRoom）会**主动失效**对应缓存

---

## 5. 前端结构

### 5.1 目录
```
gameRecord/
├── app.vue                          # 全局背景（slate-950 + 顶部扫描光带 + 1 个径向光晕 + 网格）
├── pages/
│   └── index.vue                    # 路由分发：?room=xxx → RoomView，否则 HomeView
├── components/
│   ├── HomeView.vue                 # 首页（创建 + 历史房间 + 清空）
│   ├── RoomView.vue                 # 记分板主页面
│   ├── PlayerCountPicker.vue        # 2-10 人数选择器（玻璃态按钮组）
│   ├── PlayerGrid.vue               # 座位网格容器（自适应 2-10 列）
│   ├── SeatSlot.vue                 # 单个座位（头像+昵称+分数）
│   ├── RoundListItem.vue            # 历史轮次横向行（点整行进详情）
│   ├── CopyLinkButton.vue           # 复制链接按钮
│   ├── ProfileModal.vue             # 完善资料 Modal（微信/手动 tab 滑块）
│   ├── ScoreInputModal.vue          # 记分录入 Modal（打字机 + ± 切换按钮）
│   ├── RoundDetailModal.vue         # 单轮详情 Modal（追溯）
│   ├── ConfirmDialog.vue            # 通用确认弹窗
│   ├── RoastModal.vue               # 幽默裁判弹窗（5 场景 + 打字机 + 弹簧）
│   ├── PlayerAvatar.vue             # 玩家头像（带头像上传 + 点击 ProfileModal）
│   ├── ScoreBarChart.vue / ScoreTrendChart.vue # Chart.js 封装
├── composables/
│   ├── useDb.ts                     # API 客户端封装（含 in-flight 去重 + 1.5s 列表缓存）
│   ├── useUser.ts                   # 当前用户单例（LocalStorage clientId）
│   ├── useRoom.ts                   # 房间状态 + 座位管理
│   ├── usePolling.ts                # 8s 轮询 hook（标签页隐藏暂停）
│   ├── useRoast.ts                  # 50 条幽默文案 + 触发逻辑
│   ├── useTypewriter.ts             # 打字机 hook
│   └── useFeatureAccess.ts          # 商业化预留（当前全 true）
├── types/index.ts                    # User / Round / GameSession / Seat / RoomSummary 等
├── server/                           # 同 §4
├── assets/css/main.css               # 设计 token + 玻璃态/霓虹/shimmer utility
├── tailwind.config.js                # 自定义动画 + 霓虹 box-shadow + 字体栈
├── nuxt.config.ts                    # Google Fonts 注入 + 运行时配置
```

### 5.2 全局单例 + 路由
- `useUser()` / `useRoom()` / `useRoast()` 内部用模块级 `ref`，**全应用共享**
- `pages/index.vue` 单文件路由分发：query 里有 `room` → RoomView，否则 HomeView

### 5.3 关键流程

**创建房间**：HomeView `createRoom()` → `POST /api/rooms` → `sessionStorage.setItem('justCreatedRoomId', roomId)` → `emit('enter', roomId)` → router 跳到 `/?room=xxx` → RoomView mount → 读 sessionStorage 标记 → 触发"房主宣言"（场景 4）→ 1.5s 后若未坐满则 `autoSit()` 给自己坐 0 → 4 次重试拿到 session。

**坐下/换座**：点 [+] → `useRoom.sitDown` → `POST /api/rooms/:id/seat` → server 端**先 DELETE 旧位置再 INSERT 新位置**（`switched: true`）→ 触发"新玩家入局"（场景 5）→ 8s 轮询让其他设备同步。

**记分**：点底部"记录新一轮" → `openAddModal` 实时校验坐满 → 弹 ScoreInputModal → 提交 → `useRoom.addRound(scores, recorder)` → server `POST /api/room`（带 recordedBy/recordedAt）→ 60% 概率触发`judgeAndTriggerRoast`（场景 1-3）→ 用户手动关闭弹窗。

**邀请链接**：`CopyLinkButton` 复制 `/?room=xxx` → 朋友打开 → RoomView mount → onMounted 主动重试 4 次（800/1280/2050/3280ms）+ 1.5s 缓冲 → 显示"正在进入房间…重试中 N/4" → 拉成功后切到记分板。

---

## 6. v3.0 重构要点（核心升级）

| 阶段 | 变化 | 关键文件 |
|---|---|---|
| **架构** | 删除 4 玩家固定 → 2-10 人动态 + 用户表 | `server/utils/room.ts`, `types/index.ts` |
| **零门槛坐下** | 加号无登录拦截，前端 LocalStorage clientId 临时用户 | `composables/useUser.ts` |
| **渐进式完善** | 点自己头像弹 ProfileModal，微信/手动 tab 切换 | `components/ProfileModal.vue` |
| **记分追溯** | 每轮记 recordedBy/recordedAt/updatedBy/updatedAt | `server/utils/room.ts`, `Round` 类型 |
| **空状态历史** | 列表显示创建时间 + 房间名（不显示 roomId） | `components/HomeView.vue` |
| **多人安全** | `deleteAllRooms(clientId)` 强制要求 clientId（不传 400） | `server/api/rooms.delete.ts` |
| **重试缓冲** | RoomView 4 次重试 + 1.5s 强制缓冲避免闪失败页 | `components/RoomView.vue` |
| **头像走 Blob** | 旧 `POST /api/upload-avatar`（受 4.5MB 限制）→ 新 `POST /api/users/me/avatar`（handleUpload 客户端直传） | `server/api/users/me/avatar.ts` |

---

## 7. 视觉设计系统（Frontend Design / 顶级前端设计专家视角）

### 7.1 设计 Token
```css
/* main.css */
--neon-green: #39ff14;   --neon-blue: #00ffff;    --neon-pink: #ff00ff;
--neon-purple: #bb00ff;  --neon-cyan: #22d3ee;     --neon-yellow: #facc15;
--neon-red: #ff3355;     --neon-orange: #ff6600;
--cyber-bg: #050714;     --cyber-surface: #0a0f1e; --cyber-elevated: #131a2e;
--ease-apple: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 7.2 字体方案（主标题苹方 + 数字 Russo One + 标签 Orbitron）
| 位置 | 字体 | 工具类 |
|---|---|---|
| 主标题"游戏记分器" | PingFang SC（苹方） | `.font-pingfang` |
| 副标题/标签/按钮 | Orbitron + tracking | `.font-heading` |
| 数字（±5, 轮次号） | Russo One + tabular-nums | `.font-score` / `.font-num` |
| Modal 标题 | 苹方 | `.font-pingfang` |
| 时间戳 | JetBrains Mono | `.font-num` |

### 7.3 动画
- **入场弹性曲线**：`cubic-bezier(0.34, 1.56, 0.64, 1)`（spring）
- **Modal 弹性**：`scale 0.94→1.0` + opacity 0→1
- **Roast 弹簧下拉**：`scale 0.6→1.12→1` + `rotate(-2deg)`
- **Tab 滑块**：translateX 200ms
- **轮次插入**：TransitionGroup + `slide-in-top` 0.4s
- **打字机**：28ms/字 + 闪烁光标
- **闪烁光标**：`@keyframes blink-caret` 0.6s steps(2)
- **progress 进度条**：自动走完

### 7.4 Utility Class 库（main.css）
- `.glass-card` / `.glass-card-elevated` —— 玻璃态卡片（线性渐变 + backdrop-blur + 内描边）
- `.text-glow-green` / `-blue` / `-pink` / `-cyan` —— 文字外发光（多档位 text-shadow）
- `.border-glow-green` / `-blue` / `-pink` —— 1px 内描边 + 16px 外发光
- `.btn-cyber-primary` / `.btn-cyber-ghost` —— 两套按钮 token
- `.text-gradient-cyber` —— 主标题用（绿→青→紫 渐变 + 6s 漂移）
- `.scan-line-band` —— 顶部 4s 扫光带
- `.shimmer-bg` —— 骨架屏

### 7.5 性能护栏
- `app.vue` 只用 **1 个** `filter: blur(16px)` 径向光晕（不是 3 个 40px——那会让 Mac M1 发烫）
- `will-change: opacity, transform` + `transform: translateZ(0)` 提示 GPU 合成
- `@media (prefers-reduced-motion: reduce)` 媒体查询自动关掉 `backdrop-filter: blur` 和所有动画

---

## 8. 幽默裁判系统（5 场景 50 条）

文件：`composables/useRoast.ts` + `components/RoastModal.vue`

### 8.1 场景
| 场景 | 触发 | 颜色 | 触发函数 |
|---|---|---|---|
| king_loser  统治时刻 | 场景 1/2/3 条件判断 | 🟢 霓虹绿 | `judgeAndTriggerRoast` |
| comeback     热血逆袭 | 同上 | 🟡 霓虹黄 | 同上 |
| lopsided     鸿沟预警 | 同上 | 🔴 霓虹红 | 同上 |
| room_created 房主宣言 | 房主进入自己刚建的房间 | 🟣 霓虹粉 | `triggerRoomCreated(host)` |
| player_joined 新玩家入局 | 自己的 doSitDown 成功 | 🩵 霓虹青 | `triggerPlayerJoined(player)` |

### 8.2 文案库
50 条分 5 场景各 10 条，占位符自动替换：
- 场景 1-3：`【第一名】` / `【最后一名】`
- 场景 4：`【房主昵称】`
- 场景 5：`【新玩家昵称】`

### 8.3 行为
- **手动关闭**（不自动倒数）—— 用户点 ✕ 或底部"关闭判决"才走
- 按任意键 → 打字机立即完成
- 8s 轮询拉到新分数时 RoomView `handleScoreSubmit` 成功后**60% 概率**触发场景 1-3 之一
- 4 次重试后如果房间失败不触发（避免无效文案）
- 全局单例：任意时刻只能有一个裁决弹窗（新的覆盖旧的）

---

## 9. 已知问题 & 痛点

| 问题 | 状态 |
|---|---|
| 移动端 mobile 浏览器 disk cache 会缓存旧资源 → 加载失败 | **靠隐私/无痕窗口规避**（不根本修复） |
| Vercel Blob `BLOB_READ_WRITE_TOKEN` Marketplace 集成不自动注入 | **需手动 `vercel env add`** |
| `@vercel/postgres` 0.10 已 deprecated，建议迁移 Neon SDK | **未做**，等迁移到正式 Neon 账户时再处理 |
| Phase 3 埋点 + 商业化（v4.0 任务 #50） | **未做**——按用户要求砍掉 |
| 数字翻牌器 | 用户明确不要，不做 |
| 音效 | 用户明确不要，不做 |
| tsparticles 粒子背景 | 用户同意但我没接入（如要加，在 app.vue `<NuxtPage/>` 上面加 `<vue-particles>`） |

---

## 10. 待办（按 ROI 排序）

1. **Neon 区域换 ap-southeast-1**（现在 us-east-1，从中国访问 200-500ms/请求）—— 换新加坡区域降 60% 延迟
2. **@vercel/postgres 迁移到 Neon SDK**（避免未来 SDK 删除）
3. **Phase 3 商业化**：`useFeatureAccess` 实战 + 4 事件埋点（create_room/join_room_temp/user_upgrade/submit_score）
4. **移动端 iOS safe-area 进一步优化**（有 safe-area-bottom 但 header 没考虑）
5. **RoundListItem 视觉再升级**（虽已统一但仍可更精致）
6. **多局切换**（目前只有"删除整局"，没"暂存并开新局"）

---

## 11. 启动 / 调试速查

```bash
# 本地 dev
npm run dev

# 本地生产 preview（与 Vercel 部署行为一致）
npm run build
HOST=0.0.0.0 PORT=3000 node --env-file=.env .output/server/index.mjs

# 部署
vercel deploy --prod

# 拉 Vercel 线上 log（找 500 错误）
npx vercel logs <deployment-url>

# 添加 Vercel env
printf 'vercel_blob_rw_xxx' | npx vercel env add BLOB_READ_WRITE_TOKEN production
```

**手机端访问**：`http://<电脑 LAN IP>:3000`（电脑与手机同 WiFi）。

**关键交互调试入口**：
- 创建房间后 `sessionStorage.getItem('justCreatedRoomId')` 应有值
- 自己点 [+] 时 `RoastModal` 应弹"新玩家入局"（青色）
- 记分时 60% 概率弹裁判（按规则选场景 1-3）

---

## 12. 不要踩的坑

1. **不要用 `Vite 模板字符串嵌套 sql\`\``**——必须用 `sql.query(string, [params])` 否则报 `syntax error at $1`
2. **不要在 `useDb.updateRoom` 之前清空 `inflightGet` 缓存**——会丢去重保护；改用 append
3. **不要用 `@vercel/blob` 默认 `access: 'public'`**——需要传 `token`（Vercel 自动从 env 读，但我们走 `handleUpload` 模式）
4. **不要让 `triggerRoast` 内含 `setTimeout` 自动消失**——用户已确认要手动关闭
5. **不要在 client 用 `process.env`**——会被 webpack 替换；用 `useRuntimeConfig().public.*`
6. **不要忘记 `vercel env add` 到 `production` 环境**——Marketplace 集成不会自动注入 Blob token

---

## 13. 给后续 AI 的 TL;DR

> 这个项目是 **多玩家动态人数计分应用**（2-10 人），从"固定 4 人"重构到"动态 N 人+真实用户体系"。后端 Postgres + Blob，前端 Nuxt 3 SPA。**轮询 8s 同步**（非 WebSocket，因为 Vercel serverless 不支持长连接）。最大特色是**幽默裁判系统**：50 条随机毒舌文案在记分/建房/落座时弹出，用打字机 + 弹簧动效呈现。设计语言是**暗黑 cyber + 霓虹 glow**，主标题苹方，数字 Russo One，标签 Orbitron。**接手时优先理解 v3.0 重构的"加号坐下+追溯"逻辑**，然后看 useUser/useRoom/useRoast 三个 composable 的全局单例模式。

