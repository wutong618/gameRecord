<template>
  <div class="min-h-screen bg-slate-900">
    <!-- 房间模式：渲染记分板页 -->
    <RoomView v-if="roomId" :room-id="roomId" @leave="leaveRoom" />

    <!-- 主页模式：创建 / 进入 -->
    <HomeView v-else @enter="enterRoom" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// ?room=xxx 表示已进入某个房间
const roomId = computed<string | null>(() => {
  const id = route.query.room
  return typeof id === 'string' && id.trim() ? id.trim() : null
})

// 从首页进入房间：替换 URL，触发 RoomView
function enterRoom(id: string) {
  router.replace({ path: '/', query: { room: id } })
}

// 离开房间
function leaveRoom() {
  router.replace({ path: '/' })
}
</script>
