<template>
  <div class="min-h-screen pb-24 safe-area-bottom">
    <!-- 顶部标题（苹方 + 扫描光带） -->
    <header class="relative pt-10 pb-8 text-center scan-line-band">
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

    <main class="px-4 max-w-md mx-auto space-y-6">
      <!-- 当前用户卡片（玻璃态 + 头像环） -->
      <Transition name="slide-in-top">
        <div
          v-if="currentUser"
          class="glass-card-elevated rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
        >
          <!-- 背景光晕 -->
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
        </div>
      </Transition>

      <!-- 房间名称 + 人数 + 创建 -->
      <div class="space-y-3">
        <div class="glass-card rounded-2xl p-4 space-y-4">
          <div>
            <label class="font-heading text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-1.5 block">房间名称</label>
            <input
              v-model="roomName"
              type="text"
              maxlength="30"
              placeholder="给房间起个名字（可选）"
              class="font-heading w-full bg-slate-900/60 text-white text-center text-sm py-2.5 rounded-xl border border-slate-700/60 focus:border-neon-blue/60 focus:ring-2 focus:ring-neon-blue/20 outline-none transition-all duration-200 placeholder:text-slate-600"
            />
          </div>
          <div>
            <label class="font-heading text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold mb-2 block">玩家人数</label>
            <PlayerCountPicker v-model="maxPlayers" />
          </div>
        </div>

        <button
          class="btn-cyber-primary w-full py-4 rounded-2xl text-lg flex items-center justify-center gap-2 relative overflow-hidden active:scale-95"
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
      </div>

      <!-- 粘贴链接加入 -->
      <div class="glass-card rounded-2xl p-4 space-y-2">
        <label class="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">加入已有房间</label>
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

      <!-- 历史房间 -->
      <div>
        <div class="flex items-center justify-between mb-3 px-1">
          <h2 class="font-heading text-sm font-bold tracking-[0.2em] uppercase text-slate-200 flex items-center gap-2">
            <History class="w-4 h-4 text-neon-blue" :stroke-width="2.5" />
            历史房间
          </h2>
          <button
            class="text-xs text-slate-500 hover:text-neon-blue transition-colors flex items-center gap-1"
            :disabled="loadingList"
            @click="loadList"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loadingList }" />
            刷新
          </button>
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
              <button
                class="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-all duration-200 flex items-center gap-1"
                @click.stop="copyLink(r.roomId)"
              >
                <Link2 class="w-3 h-3" />
                复制
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <p class="text-center text-slate-600 text-[11px] leading-relaxed">
        创建后把链接发到微信群<br/>2-10 人坐下后即可开始记分
      </p>

      <!-- 清空我的房间（危险操作，放在底部） -->
      <div v-if="rooms.length > 0" class="pt-4 border-t border-slate-800/50">
        <button
          class="w-full py-2.5 rounded-xl text-xs text-slate-500 hover:text-neon-pink border border-slate-800 hover:border-neon-pink/40 transition-all duration-200 flex items-center justify-center gap-2"
          :disabled="clearing"
          @click="askClearAll = true"
        >
          <Trash2 class="w-3.5 h-3.5" />
          清空我的房间
        </button>
      </div>
    </main>

    <!-- 清空确认 -->
    <ConfirmDialog
      :show="askClearAll"
      title="清空我的房间？"
      :message="`将永久删除您参与过的 ${rooms.length} 个房间及其所有分数，无法恢复。`"
      @cancel="askClearAll = false"
      @confirm="executeClearAll"
    />
  </div>
</template>

<script setup lang="ts">
import { listRooms as fetchRooms, deleteAllRooms, type RoomSummary } from '~/composables/useDb'
import { useUser } from '~/composables/useUser'
import { PLAYER_COLORS } from '~/types'
import { Trophy, LogIn, History, RefreshCw, Inbox, Link2, Trash2 } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'enter', roomId: string): void
}>()

const { currentUser, init: initUser } = useUser()

const inputRoom = ref('')
const roomName = ref('')
const maxPlayers = ref(4)
const creating = ref(false)
const loadingList = ref(false)
const clearing = ref(false)
const askClearAll = ref(false)
const rooms = ref<RoomSummary[]>([])

onMounted(async () => {
  await initUser()
  loadList()
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
    emit('enter', session.roomId)
  } catch (e: any) {
    alert('创建失败：' + (e?.message || e))
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
    await deleteAllRooms(currentUser.value.clientId)
    rooms.value = []
  } catch (e: any) {
    alert('清空失败：' + (e?.message || e))
  } finally {
    clearing.value = false
    askClearAll.value = false
  }
}
</script>

<style scoped>
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
