<template>
  <div class="min-h-screen pb-24 safe-area-bottom">
    <!-- 顶部标题（苹方 + 扫描光带） -->
    <header class="relative pt-10 pb-6 text-center scan-line-band">
      <h1
        class="font-pingfang text-5xl tracking-[0.08em] text-gradient-cyber drop-shadow-[0_0_24px_rgba(0,255,255,0.35)]"
      >
        游戏记分器
      </h1>
      <p class="font-heading text-slate-400 text-[11px] mt-3 tracking-[0.3em] uppercase">
        SCORE · SYNC · SHARE
      </p>
      <p class="text-slate-500 text-xs mt-1.5">把链接发给朋友 · 2-10 人实时同步</p>
    </header>

    <!--
      v6.0.4 首页按 4 个模块化分区呈现：
        1. 👤 我的资料（用户身份，先看到自己是谁，cyan 主题）
        2. 🎮 快速开局（主操作，绿色 neon 主题）
        3. 🚪 加入房间（次要操作，蓝色 neon 主题）
        4. 📜 历史房间（数据列表，紫色 neon 主题）
      视觉层级用 icon 颜色 + 字号 + 分隔线形成，扫一眼就能定位。
    -->
    <main class="px-4 max-w-md mx-auto space-y-5">
      <!-- ========== Section 1: 我的资料（先看到自己是谁） ========== -->
      <section>
        <div class="section-header">
          <div class="section-icon-wrap section-icon-cyan">
            <UserCircle2 class="w-3.5 h-3.5 text-neon-cyan" :stroke-width="2.5" />
          </div>
          <h2 class="font-heading text-[11px] font-bold tracking-[0.25em] uppercase text-slate-200">
            我的资料
          </h2>
          <div class="section-divider" />
        </div>

        <div
          class="glass-card-elevated rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden min-h-[72px] transition-all"
          :class="currentUser ? 'cursor-pointer active:scale-[0.98] hover:border-neon-cyan/40' : ''"
          :role="currentUser ? 'button' : undefined"
          :tabindex="currentUser ? 0 : -1"
          :aria-label="currentUser ? '点击配置昵称和头像' : undefined"
          @click="currentUser && (showProfile = true)"
          @keyup.enter="currentUser && (showProfile = true)"
        >
          <!-- 骨架：没拿到 user 时显示 -->
          <div
            v-if="!currentUser"
            class="flex items-center gap-4 w-full"
            aria-label="加载中"
          >
            <div class="w-12 h-12 rounded-full shimmer-bg shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 rounded shimmer-bg w-24" />
              <div class="h-2 rounded shimmer-bg w-16" />
            </div>
          </div>

          <!-- 真实卡片：currentUser 到达后淡入 -->
          <template v-else>
            <div
              class="absolute -right-10 -top-10 w-32 h-32 rounded-full pointer-events-none opacity-40"
              :style="{ background: `radial-gradient(circle, ${avatarGlow(currentUser.avatarColor)}, transparent 70%)`, filter: 'blur(20px)' }"
            />
            <div
              class="relative w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shrink-0 ring-2 ring-offset-2 ring-offset-cyber-elevated"
              :style="{
                background: getPlayerBg(currentUser.avatarColor),
                boxShadow: `0 0 16px ${getPlayerGlow(currentUser.avatarColor)}`,
                '--tw-ring-color': getPlayerGlow(currentUser.avatarColor)
              }"
            >
              <img
                v-if="currentUser.avatarUrl"
                :src="currentUser.avatarUrl"
                class="w-full h-full object-cover rounded-full"
              />
              <span v-else>{{ (currentUser.nickname || '?').slice(0, 1) }}</span>
            </div>
            <div class="min-w-0 flex-1 relative">
              <div class="text-white text-sm font-bold truncate">{{ currentUser.nickname }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span
                  class="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                  :class="currentUser.isTemporary ? 'bg-amber-500/15 text-amber-300' : 'bg-neon-green/15 text-glow-green'"
                >
                  {{ currentUser.isTemporary ? '临时' : '已绑定' }}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">id #{{ currentUser.id }}</span>
              </div>
            </div>
            <span class="text-[10px] text-slate-500 font-bold shrink-0">配置 ›</span>
          </template>
        </div>
      </section>

      <!-- ========== Section 2: 快速开局（主操作） ========== -->
      <section>
        <div class="section-header">
          <div class="section-icon-wrap section-icon-green">
            <Trophy class="w-3.5 h-3.5 text-neon-green" :stroke-width="2.5" />
          </div>
          <h2 class="font-heading text-[11px] font-bold tracking-[0.25em] uppercase text-slate-200">
            快速开局
          </h2>
          <div class="section-divider" />
        </div>

        <div class="glass-card rounded-2xl p-4 space-y-4 border-glow-green">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-heading text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold block">房间名称</label>
              <button
                type="button"
                class="text-[10px] font-bold text-slate-500 hover:text-neon-blue flex items-center gap-1 active:scale-95 transition-transform"
                @click="randomRoomName"
                title="随机一个"
              >
                <Shuffle class="w-3 h-3" :stroke-width="2.5" />
                随机
              </button>
            </div>
            <input
              v-model="roomName"
              type="text"
              maxlength="30"
              placeholder="给房间起个名字（可选）"
              class="font-heading w-full bg-slate-900/60 text-white text-center text-sm py-2.5 rounded-xl border border-slate-700/60 focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 outline-none transition-all duration-200 placeholder:text-slate-600"
            />
            <!-- v6.0 幽默房间名 chip 行：点一下填充，懒得打字就抽 -->
            <div class="-mx-1 mt-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                v-for="name in FUNNY_ROOM_NAMES"
                :key="name"
                type="button"
                class="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-700/60 text-slate-400 hover:border-neon-blue/50 hover:text-neon-blue hover:bg-neon-blue/5 active:scale-95 transition-all whitespace-nowrap"
                :class="roomName === name ? 'border-neon-blue/70 text-neon-blue bg-neon-blue/10' : ''"
                @click="pickRoomName(name)"
              >
                {{ name }}
              </button>
            </div>
          </div>
          <div>
            <label class="font-heading text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-2 block">玩家人数</label>
            <PlayerCountPicker v-model="maxPlayers" />
          </div>
        </div>

        <button
          class="btn-cyber-primary w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-2 relative overflow-hidden active:scale-95 mt-3"
          :disabled="creating"
          @click="createRoom"
        >
          <span v-if="creating" class="flex items-center gap-2">
            <span class="inline-block w-4 h-4 border-2 border-cyber-bg/30 border-t-cyber-bg rounded-full animate-spin" />
            正在创建…
          </span>
          <span v-else class="flex items-center gap-2">
            <Trophy class="w-5 h-5" :stroke-width="2.5" />
            开启新局
          </span>
        </button>
      </section>

      <!-- ========== Section 3: 加入房间 ========== -->
      <section>
        <div class="section-header">
          <div class="section-icon-wrap section-icon-blue">
            <LogIn class="w-3.5 h-3.5 text-neon-blue" :stroke-width="2.5" />
          </div>
          <h2 class="font-heading text-[11px] font-bold tracking-[0.25em] uppercase text-slate-200">
            加入房间
          </h2>
          <div class="section-divider" />
        </div>

        <div class="glass-card rounded-2xl p-4 space-y-2.5">
          <input
            v-model="inputRoom"
            type="text"
            placeholder="粘贴房间链接或 ID"
            class="w-full bg-slate-900/60 text-white text-center font-mono text-sm py-2.5 rounded-xl border border-slate-700/60 focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 outline-none transition-all duration-200 placeholder:text-slate-600"
            @keyup.enter="joinInput"
          />
          <button
            class="btn-cyber-ghost w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!inputRoom.trim()"
            @click="joinInput"
          >
            <LogIn class="w-4 h-4" />
            加入房间
          </button>
        </div>
      </section>

      <!-- ========== Section 4: 历史房间 ========== -->
      <section>
        <div class="section-header">
          <div class="section-icon-wrap section-icon-pink">
            <History class="w-3.5 h-3.5 text-neon-pink" :stroke-width="2.5" />
          </div>
          <h2 class="font-heading text-[11px] font-bold tracking-[0.25em] uppercase text-slate-200">
            历史房间
            <span v-if="rooms.length" class="ml-1 text-slate-500">({{ rooms.length }})</span>
          </h2>
          <button
            class="text-[10px] text-slate-500 hover:text-neon-pink transition-colors flex items-center gap-1 ml-2 shrink-0"
            :disabled="loadingList"
            @click="loadList"
            title="刷新列表"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': loadingList }" />
          </button>
          <div class="section-divider" />
        </div>

        <div v-if="loadingList && rooms.length === 0" class="space-y-2">
          <div v-for="i in 3" :key="i" class="glass-card rounded-2xl p-3 h-[68px] shimmer-bg" />
        </div>

        <div v-else-if="rooms.length === 0" class="glass-card rounded-2xl p-8 text-center">
          <div class="text-5xl mb-3 opacity-40">
            <Inbox class="w-12 h-12 mx-auto text-slate-600" :stroke-width="1.5" />
          </div>
          <p class="text-slate-500 text-sm">还没有房间记录</p>
          <p class="text-slate-600 text-xs mt-1">点击上方"开启新局"开始第一局</p>
        </div>

        <TransitionGroup v-else name="room-list" tag="div" class="space-y-2">
          <div
            v-for="r in rooms"
            :key="r.roomId"
            class="glass-card rounded-2xl p-3 hover:border-neon-blue/40 hover:shadow-neon-blue/20 active:scale-[0.99] transition-all duration-200 cursor-pointer group"
            @click="enterExisting(r.roomId)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="text-sm text-white font-bold truncate group-hover:text-glow-blue transition-colors">
                  {{ r.name || '未命名房间' }}
                </div>
                <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span class="font-mono">{{ formatTime(r.createdAt) }}</span>
                  <span class="text-slate-700">·</span>
                  <span class="text-slate-400">{{ r.seatedCount }}/{{ r.maxPlayers }}人</span>
                  <span class="text-slate-700">·</span>
                  <span class="text-slate-400">{{ r.roundsCount }} 轮</span>
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-1">
                <button
                  class="px-2.5 py-1 rounded-md text-[11px] font-bold border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-all duration-200 flex items-center gap-1"
                  @click.stop="copyLink(r.roomId)"
                >
                  <Link2 class="w-3 h-3" />
                  复制
                </button>
                <!--
                  v6.0.2 Fix 3：单条删除按钮（直接删，无 confirm dialog）
                  - 默认 opacity-30 不抢视线
                  - hover 显形 + 红色提示
                  - @click.stop 防止冒泡触发 enterExisting
                  - 删除中显示 spinner 锁按钮
                -->
                <button
                  class="w-7 h-7 rounded-md border border-slate-700/60 text-slate-500 hover:border-neon-pink/60 hover:text-neon-pink hover:bg-neon-pink/10 opacity-30 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center active:scale-90"
                  :class="deletingId === r.roomId ? 'opacity-100' : ''"
                  :disabled="deletingId === r.roomId"
                  :aria-label="`删除房间 ${r.name || r.roomId}`"
                  @click.stop="deleteOneRoom(r.roomId)"
                >
                  <span v-if="deletingId === r.roomId" class="inline-block w-3 h-3 border border-slate-400 border-t-neon-pink rounded-full animate-spin" />
                  <X v-else class="w-3.5 h-3.5" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </section>

      <p class="text-center text-slate-600 text-[11px] leading-relaxed">
        创建后把链接发到微信群<br/>2-10 人坐下后即可开始记分
      </p>

      <!-- 清空我的房间（v6.0.2：直接执行，无 confirm dialog；按钮放在底部降低误触） -->
      <div v-if="rooms.length > 0" class="pt-4 border-t border-slate-800/50">
        <button
          class="w-full py-2.5 rounded-xl text-xs text-slate-500 hover:text-neon-pink border border-slate-800 hover:border-neon-pink/40 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
          :disabled="clearing"
          @click="executeClearAll"
        >
          <Trash2 class="w-3.5 h-3.5" />
          {{ clearing ? '清空中…' : '清空我的房间' }}
        </button>
      </div>
    </main>

    <!-- v6.0.2 用户配置弹窗：与 RoomView 同款 ProfileModal -->
    <ProfileModal
      :show="showProfile"
      :user="currentUser"
      @close="showProfile = false"
      @saved="onProfileSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { listRooms as fetchRooms, deleteAllRooms, deleteRoom as deleteRoomApi, type RoomSummary } from '~/composables/useDb'
import { useUser } from '~/composables/useUser'
import { useAnalytics } from '~/composables/useAnalytics'
import { useToast } from '~/composables/useToast'
import { PLAYER_COLORS } from '~/types'
import { Trophy, LogIn, History, RefreshCw, Inbox, Link2, Trash2, Shuffle, X, UserCircle2 } from 'lucide-vue-next'

// v6.0.2 用户配置弹窗按需加载（与 RoomView 一致，不进首屏 critical chunk）
const ProfileModal = defineAsyncComponent(() => import('./ProfileModal.vue'))

const emit = defineEmits<{
  (e: 'enter', roomId: string): void
}>()

const { currentUser, init: initUser } = useUser()
const analytics = useAnalytics()
const toast = useToast()

// v6.0 默认幽默房间名库：覆盖"对抗 / 嘲讽 / 自嘲 / 玩梗"四类情绪
// 不直接用 emoji prefix 是因为不想抢"游戏记分器"主标题的视觉焦点
const FUNNY_ROOM_NAMES = [
  '群魔乱舞局', '菜鸡互啄大会', '巅峰对决', '翻盘选手集合',
  '谁是卧底', '智商检测站', '大佬求带', '欢乐送分局',
  '赌神争霸', '零和博弈', '人菜瘾大', '请文明竞技',
  '友谊的小船', '爸爸们打架', '妈妈叫我回家', '输了请奶茶',
  '一局定乾坤', '周末不睡觉', '加班后遗症', '摸鱼专属'
] as const

// v6.0.2 Fix 1：输入框默认展示一条幽默房间名
// 选一个随机的（避开上次用过的），用户可一键清空或重抽
const lastShownDefaultIndex = ref(-1)
function pickDefaultRoomName() {
  let i = Math.floor(Math.random() * FUNNY_ROOM_NAMES.length)
  // 避免两次连续显示同一个
  if (i === lastShownDefaultIndex.value && FUNNY_ROOM_NAMES.length > 1) {
    i = (i + 1) % FUNNY_ROOM_NAMES.length
  }
  lastShownDefaultIndex.value = i
  roomName.value = FUNNY_ROOM_NAMES[i]
}

function pickRoomName(name: string) {
  roomName.value = name
}
function randomRoomName() {
  // 排除当前已选项，避免点了等于没点
  const pool = FUNNY_ROOM_NAMES.filter((n) => n !== roomName.value)
  roomName.value = pool[Math.floor(Math.random() * pool.length)]
}

const inputRoom = ref('')
const roomName = ref('')
const maxPlayers = ref(4)
const creating = ref(false)
const loadingList = ref(false)
const clearing = ref(false)
const showProfile = ref(false)  // v6.0.2 用户卡片可点 → 弹 ProfileModal
const rooms = ref<RoomSummary[]>([])

// v6.0.2 Fix 1：进入首页时立刻给一个默认房间名
// 比"空 placeholder"更有"开始玩"的引导感，也省得用户自己想
pickDefaultRoomName()

// v6.0.2 Fix 2：用户卡片可点 → ProfileModal（与 RoomView 同款）
// 弹窗关闭时刷新 currentUser（昵称/头像/颜色可能改）
function onProfileSaved(updated: any) {
  currentUser.value = updated
  showProfile.value = false
}

// v6.0.2 Fix 3：单条房间删除——直接删，无 confirm dialog
// item 立即从列表淡出（TransitionGroup room-list-leave 已配），提供自然反馈
const deletingId = ref<string | null>(null)
async function deleteOneRoom(roomId: string) {
  if (deletingId.value) return  // 防止双击
  deletingId.value = roomId
  try {
    await deleteRoomApi(roomId)
    rooms.value = rooms.value.filter((r) => r.roomId !== roomId)
    // v6.0.3：自定义 toast 替代 alert
    toast.success('房间已删除', 2000)
  } catch (e: any) {
    toast.error('删除失败：' + (e?.message || e), 4000)
  } finally {
    deletingId.value = null
  }
}

// v3.1 性能优化：并行而不是串行。
// 原来：await initUser() (~1.5s 跨太平洋) → loadList() (再 ~1.5s) = 3s 串行
// 现在：initUser 同步读 localStorage 立刻填 currentUser，watcher 触发 loadList；
// 后台异步 ensureTempUser 完成时 currentUser 引用更新 + localStorage 持久化。
// 首屏 HTML 渲染和骨架屏立即可见，历史房间与 user 卡片几乎同时就位。
onMounted(() => {
  initUser()  // 同步返回 cache user（null 时也立刻返回 null）
  loadList()  // currentUser 可能还是 null（首次访问），但 listCache 5s 内命中 / 失败也无害
})

// 监听 currentUser 变化：user 异步 ensure 回来后再拉一次列表（clientId 可能换）
watch(currentUser, (u) => {
  if (u) loadList()
})

async function loadList() {
  if (!currentUser.value) return
  loadingList.value = true
  try {
    rooms.value = await fetchRooms(currentUser.value.clientId)
  } catch (e) {
    console.error('加载房间列表失败', e)
  } finally {
    loadingList.value = false
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getPlayerBg(colorKey?: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.bg || PLAYER_COLORS['fire-red'].bg
}
function getPlayerGlow(colorKey?: string | null) {
  const key = (colorKey || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]?.neon || PLAYER_COLORS['fire-red'].neon
}
function avatarGlow(colorKey?: string | null) {
  return getPlayerGlow(colorKey) + '40'  // 25% alpha
}

function extractId(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const q = u.searchParams.get('room')
    if (q) return q
  } catch { /* not a URL */ }
  return s
}

async function createRoom() {
  if (creating.value || !currentUser.value) return
  creating.value = true
  try {
    // 走 useRoom.createRoom：返回 session 同时自动 setCurrentSession
    // → RoomView mount 时 currentSession 已有值，跳过第一次重试
    const { useRoom } = await import('~/composables/useRoom')
    const session = await useRoom().createRoom(
      maxPlayers.value,
      currentUser.value.clientId,
      roomName.value.trim() || undefined
    )
    // 标记"我刚创建"，RoomView mount 时读这个标记触发"房主宣言"裁决
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('justCreatedRoomId', session.roomId)
    }
    // v6.0 埋点：成功创建房间
    analytics.createRoom(maxPlayers.value)
    emit('enter', session.roomId)
  } catch (e: any) {
    toast.error('创建失败：' + (e?.message || e), 4000)
  } finally {
    creating.value = false
  }
}

function joinInput() {
  const id = extractId(inputRoom.value)
  if (!id) return
  emit('enter', id)
}

function enterExisting(id: string) { emit('enter', id) }

async function copyLink(roomId: string) {
  const url = `${window.location.origin}/?room=${roomId}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    prompt('复制此链接：', url)
  }
}

async function executeClearAll() {
  if (clearing.value || !currentUser.value) return
  clearing.value = true
  try {
    // v6.0.2：直接执行，无 confirm（按钮在底部 + hover 红字已经够警示）
    const res = await deleteAllRooms(currentUser.value.clientId)
    rooms.value = []
    toast.success(`已清空 ${res.deleted} 个房间`, 2500)
  } catch (e: any) {
    toast.error('清空失败：' + (e?.message || e), 4000)
  } finally {
    clearing.value = false
  }
}
</script>

<style scoped>
/*
 * v6.0.3 模块化分区 header：每个 section 顶部一行
 *   [icon-chip] TITLE ─────────────
 * 用 icon 颜色做"分区主题色"，配合文字 + 渐变分隔线，
 * 扫一眼就能定位"这是干嘛的"。
 */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.625rem;
  padding: 0 0.25rem;
}
.section-icon-wrap {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid;
  flex-shrink: 0;
}
.section-icon-green { border-color: rgba(57, 255, 20, 0.4); box-shadow: 0 0 8px rgba(57, 255, 20, 0.2); }
.section-icon-blue  { border-color: rgba(0, 255, 255, 0.4); box-shadow: 0 0 8px rgba(0, 255, 255, 0.2); }
.section-icon-cyan  { border-color: rgba(34, 211, 238, 0.4); box-shadow: 0 0 8px rgba(34, 211, 238, 0.2); }
.section-icon-pink  { border-color: rgba(255, 0, 255, 0.4); box-shadow: 0 0 8px rgba(255, 0, 255, 0.2); }
.section-divider {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.25) 0%, transparent 100%);
  margin-left: 0.25rem;
}

/* 列表项插入动效 */
.room-list-enter-active,
.room-list-leave-active {
  transition: all 0.4s var(--ease-apple);
}
.room-list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.room-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.room-list-move {
  transition: transform 0.4s var(--ease-apple);
}

/* 顶部弹入 */
.slide-in-top-enter-active {
  transition: all 0.5s var(--ease-apple);
}
.slide-in-top-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
