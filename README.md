# 🎮 游戏现场记分器

基于 Nuxt 3 + Vue 3 的移动端游戏计分应用，支持多人计分、实时图表展示、数据持久化。

## ✨ 特性

- **4 位固定玩家**：吴、王、来、静
- **游戏化 UI**：暗黑风格 + 霓虹发光效果
- **专业级图表**：柱状图对比 + 折线图趋势
- **数据持久化**：IndexedDB 本地存储
- **导入/导出**：支持 JSON 文件备份
- **移动端适配**：完美支持手机浏览

## 🛠️ 技术栈

- **框架**：Nuxt 3 (SSR: false)
- **UI**：Tailwind CSS
- **图表**：Chart.js + vue-chartjs
- **数据库**：Dexie.js (IndexedDB)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 📱 使用说明

### 首页
- **开启新局**：创建新的游戏对局
- **导入/导出**：备份和恢复游戏数据
- **历史记录**：查看和管理过去的游戏

### 记分板
- **顶部**：4 位玩家头像和实时总分
- **图表**：切换查看总分对比或趋势图
- **记录**：点击底部按钮记录新一轮分数

### 数据操作
- **加分/扣分**：输入正数加分，负数扣分
- **修改历史**：点击轮次右侧编辑图标
- **删除轮次**：点击删除图标移除单轮记录

## 📂 项目结构

```
gameRecord/
├── assets/css/        # 全局样式
├── components/        # Vue 组件
│   ├── PlayerAvatar.vue       # 玩家头像
│   ├── ScoreBarChart.vue      # 柱状图
│   ├── ScoreTrendChart.vue    # 折线图
│   ├── ScoreInputModal.vue    # 分数录入弹窗
│   ├── GameHistoryCard.vue    # 历史游戏卡片
│   └── RoundListItem.vue      # 轮次列表项
├── composables/       # 组合式 API
│   ├── useDb.ts       # IndexedDB 操作
│   └── useGame.ts     # 游戏状态管理
├── plugins/           # Nuxt 插件
│   └── chartjs.client.ts
├── pages/             # 路由页面
│   ├── index.vue      # 首页
│   └── game/[id].vue  # 记分板页
├── types/             # TypeScript 类型
│   └── index.ts
├── nuxt.config.ts     # Nuxt 配置
└── tailwind.config.js # Tailwind 配置
```

## 🎨 配色方案

| 玩家 | 颜色 | 渐变 |
|------|------|------|
| 吴 | 烈焰红 | #ff4444 → #ff8800 |
| 王 | 深海蓝 | #0044ff → #00ccff |
| 来 | 翡翠绿 | #00aa44 → #39ff14 |
| 静 | 暗夜紫 | #6600aa → #bb00ff |

## 📄 许可证

MIT License