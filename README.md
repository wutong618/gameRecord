# 🎮 游戏现场记分器（云端同步版）

基于 Nuxt 3 + Vercel 全栈的游戏记分应用。每局游戏是一个独立"房间"，把链接发给朋友即可 4 人实时同步。

## ✨ 特性

- **房间制同步**：每局一个 UUID 房间号，URL 分享即开打
- **云端持久化**：PostgreSQL（Vercel Neon）保存所有数据
- **自定义头像**：玩家可上传图片，存到 Vercel Blob
- **4 秒轮询**：4 台手机数据自动一致
- **暗黑游戏风 UI**：霓虹发光 + 玻璃拟态 + 平滑动画
- **专业图表**：Chart.js 柱状图 + 折线图
- **移动端优先**：完美适配手机浏览

## 🛠️ 技术栈

- **框架**：Nuxt 3（SSR: false，纯客户端）
- **UI**：Tailwind CSS
- **图表**：Chart.js + vue-chartjs
- **数据库**：Vercel Neon PostgreSQL（`@vercel/postgres`）
- **对象存储**：Vercel Blob（`@vercel/blob`）
- **同步策略**：客户端 4 秒轮询 + 写入后立即主动拉取

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Vercel 环境变量

把 Neon Postgres + Vercel Blob 的环境变量拉到本地：

```bash
vercel link
vercel env pull .env.development.local
```

至少需要：
- `POSTGRES_URL`（Neon 提供）
- `BLOB_READ_WRITE_TOKEN`（Vercel Blob 提供）

### 3. 启动开发服务器

```bash
npm run dev -- --host 0.0.0.0
```

- 电脑：`http://localhost:3000/`
- 手机（同 WiFi）：`http://<电脑IP>:3000/`

### 4. 部署到 Vercel

```bash
vercel deploy --prod
```

在 Vercel 项目设置里把 Neon Postgres 数据库、Blob 存储绑定到当前项目即可，环境变量会自动注入。

## 🗄️ 数据库表结构

应用首次启动时会自动创建以下两张表（幂等，安全）：

```sql
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_sessions (
  room_id TEXT PRIMARY KEY,
  created_at BIGINT NOT NULL,
  game_data JSONB NOT NULL DEFAULT '{"rounds": []}'::jsonb
);
```

并自动写入 4 位默认玩家：吴、王、来、静。

## 🔌 Server API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/room?id=xxx` | 查询房间；不存在则自动创建 |
| `POST` | `/api/room?id=xxx` | 整体覆盖 `gameData` |
| `DELETE` | `/api/room?id=xxx` | 删除整局 |
| `POST` | `/api/upload-avatar` | 上传玩家头像到 Blob，并写入 players 表 |

`/api/upload-avatar` 接收 `multipart/form-data`：
- `file`: 图片文件（png/jpg/webp/gif，最大 2MB）
- `playerId`: 玩家 id (0-3)

返回 `{ success, playerId, url }`。

## 📂 项目结构

```
gameRecord/
├── server/                 # Nitro 后端
│   ├── api/
│   │   ├── room.get.ts            # 查询/创建房间
│   │   ├── room.post.ts           # 覆盖 gameData
│   │   ├── room.delete.ts         # 删除房间
│   │   └── upload-avatar.post.ts  # 头像上传
│   ├── plugins/
│   │   └── init-db.ts             # 启动时建表 + 写默认玩家
│   └── utils/
│       ├── postgres.ts            # sql 客户端封装
│       ├── init-db.ts             # 表结构与默认数据
│       └── room.ts                # 房间/玩家 CRUD
├── components/             # Vue 组件
│   ├── HomeView.vue               # 首页
│   ├── RoomView.vue               # 房间（记分板）页
│   ├── PlayerAvatar.vue           # 玩家头像（点击上传）
│   ├── ScoreBarChart.vue          # 柱状图
│   ├── ScoreTrendChart.vue        # 折线图
│   ├── ScoreInputModal.vue        # 分数录入弹窗
│   ├── RoundListItem.vue          # 横向单条历史
│   ├── CopyLinkButton.vue         # 复制分享链接
│   └── ConfirmDialog.vue          # 通用确认弹窗
├── composables/            # 组合式 API
│   ├── useDb.ts                   # 调后端 API
│   ├── useGame.ts                 # 状态管理 + 业务逻辑
│   └── usePolling.ts              # 4 秒轮询 hook
├── pages/
│   └── index.vue                  # 路由分发：?room=xxx
├── types/                  # TypeScript 类型
│   └── index.ts
├── nuxt.config.ts
└── tailwind.config.js
```

## 🎮 使用流程

1. 打开首页 `http://<host>/`
2. 点击「🎮 开启新局」，系统生成一个房间号
3. 自动跳转到 `/?room=xxx`
4. 点击右上角「复制分享链接」发到微信群
5. 4 个玩家各自在手机上打开链接
6. 任一人点击「记录新一轮」输入分数，其他人 4 秒内自动同步
7. 点击玩家头像可上传自定义头像
8. 整局结束可点「删除整局」清空数据

## 🎨 玩家配色

| 玩家 | 颜色 | 渐变 |
| --- | --- | --- |
| 吴 | 烈焰红 | #ff4444 → #ff8800 |
| 王 | 深海蓝 | #0044ff → #00ccff |
| 来 | 翡翠绿 | #00aa44 → #39ff14 |
| 静 | 暗夜紫 | #6600aa → #bb00ff |

## 📄 许可证

MIT License
