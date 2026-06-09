import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Keep-Alive hook：每 60s 客户端 ping /api/health
 * 目的：避免 Vercel serverless 函数进入"冷态"（长时间无请求会 freeze）
 * 冷启动会引入 200-500ms 额外延迟
 *
 * 挂在顶层（app.vue 或 pages/index.vue），全局单例
 */
export function useKeepAlive(intervalMs = 60_000) {
  let timer: ReturnType<typeof setInterval> | null = null
  const isActive = ref(false)
  const lastPingAt = ref<number | null>(null)

  async function ping() {
    if (typeof document !== 'undefined' && document.hidden) {
      // 标签页隐藏时不发请求
      return
    }
    try {
      await $fetch('/api/health', { method: 'GET' })
      lastPingAt.value = Date.now()
    } catch {
      /* 静默失败，不打扰用户 */
    }
  }

  onMounted(() => {
    isActive.value = true
    // 立即 ping 一次（warm up 当前 session）
    ping()
    timer = setInterval(ping, intervalMs)
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isActive.value = false
  })

  return { isActive, lastPingAt }
}
