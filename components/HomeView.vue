<template>
  <div class="min-h-screen bg-slate-900 pb-24">
    <!-- 顶部标题 -->
    <header class="p-6 text-center border-b border-slate-800">
      <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-blue to-neon-pink">
        游戏记分器
      </h1>
      <p class="text-slate-400 text-sm mt-1">把链接发给朋友，4 人实时同步</p>
    </header>

    <main class="p-4 max-w-md mx-auto space-y-6">
      <!-- 创建新局 -->
      <button
        class="w-full py-5 rounded-2xl font-black text-lg bg-gradient-to-br from-neon-green to-emerald-500 text-slate-900 shadow-lg shadow-neon-green/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        :disabled="creating"
        :class="{ 'opacity-70 cursor-not-allowed': creating }"
        @click="createRoom"
      >
        <svg v-if="creating" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>{{ creating ? '正在创建...' : '🎮 开启新局' }}</span>
      </button>

      <!-- 输入已有 room 链接 / ID -->
      <div class="space-y-2">
        <input
          v-model="inputRoom"
          type="text"
          placeholder="粘贴房间链接或 ID 直接进入"
          class="w-full bg-slate-800 text-white text-center font-mono text-sm py-3 rounded-xl border border-slate-700 focus:border-neon-blue outline-none"
          @keyup.enter="joinInput"
        />
        <button
          class="w-full py-3 rounded-xl font-bold bg-slate-800 text-neon-blue border border-neon-blue/30 hover:bg-slate-700 transition-all"
          :disabled="!inputRoom.trim()"
          :class="{ 'opacity-50 cursor-not-allowed': !inputRoom.trim() }"
          @click="joinInput"
        >
          加入房间
        </button>
      </div>

      <!-- 历史房间 -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-slate-300">历史房间</h2>
          <button
            class="text-xs text-slate-500 hover:text-neon-blue transition-colors"
            :disabled="loadingList"
            @click="loadList"
          >
            {{ loadingList ? '刷新中…' : '↻ 刷新' }}
          </button>
        </div>

        <div v-if="loadingList && rooms.length === 0" class="text-center py-6 text-slate-500 text-sm">
          加载中…
        </div>

        <div v-else-if="rooms.length === 0" class="text-center py-6 text-slate-500 text-sm">
          还没有房间记录
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="r in rooms"
            :key="r.roomId"
            class="bg-slate-800/70 rounded-xl p-3 border border-slate-700 hover:border-neon-blue/50 active:scale-[0.99] transition-all cursor-pointer"
            @click="enterExisting(r.roomId)"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-sm text-white truncate">{{ r.roomId }}</span>
                  <span class="text-xs text-slate-500 shrink-0">{{ r.roundsCount }} 轮</span>
                </div>
                <div class="text-[11px] text-slate-500">
                  {{ formatRelative(r.lastActivityAt) }}
                </div>
              </div>
              <button
                class="shrink-0 px-2 py-1 rounded-md text-[11px] text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/10 transition-colors"
                @click.stop="copyLink(r.roomId)"
              >
                复制链接
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center text-slate-500 text-[11px] leading-relaxed">
        <p>创建后把链接发到微信群</p>
        <p>4 个人分别打开就能一起记分</p>
      </div>

      <!-- 清空所有（危险操作，放在底部） -->
      <div v-if="rooms.length > 0" class="pt-4 border-t border-slate-800">
        <button
          class="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-neon-pink border border-slate-800 hover:border-neon-pink/40 transition-all"
          :disabled="clearing"
          @click="askClearAll = true"
        >
          🗑 清空所有房间
        </button>
      </div>
    </main>

    <!-- 清空确认 -->
    <ConfirmDialog
      :show="askClearAll"
      title="清空所有房间？"
      :message="`将永久删除 ${rooms.length} 个房间及其所有分数，无法恢复。`"
      @cancel="askClearAll = false"
      @confirm="executeClearAll"
    />
  </div>
</template>

<script setup lang="ts">
import { generateRoomId } from '~/composables/useGame'
import { listRooms as fetchRooms, deleteAllRooms, type RoomSummary } from '~/composables/useDb'

const emit = defineEmits<{
  (e: 'enter', roomId: string): void
}>()

const inputRoom = ref('')
const creating = ref(false)
const loadingList = ref(false)
const clearing = ref(false)
const askClearAll = ref(false)
const rooms = ref<RoomSummary[]>([])

onMounted(() => {
  loadList()
})

async function loadList() {
  loadingList.value = true
  try {
    rooms.value = await fetchRooms()
  } catch (e) {
    console.error('加载房间列表失败', e)
  } finally {
    loadingList.value = false
  }
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return new Date(ts).toLocaleDateString('zh-CN')
}

function extractId(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  try {
    const u = new URL(s)
    const q = u.searchParams.get('room')
    if (q) return q
  } catch {
    // not a URL
  }
  return s
}

function createRoom() {
  if (creating.value) return
  creating.value = true
  const id = generateRoomId()
  emit('enter', id)
}

function joinInput() {
  const id = extractId(inputRoom.value)
  if (!id) return
  emit('enter', id)
}

function enterExisting(id: string) {
  emit('enter', id)
}

async function copyLink(roomId: string) {
  const url = `${window.location.origin}/?room=${roomId}`
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    prompt('复制此链接：', url)
  }
}

async function executeClearAll() {
  if (clearing.value) return
  clearing.value = true
  try {
    await deleteAllRooms()
    rooms.value = []
  } catch (e: any) {
    alert('清空失败：' + (e?.message || e))
  } finally {
    clearing.value = false
    askClearAll.value = false
  }
}
</script>
