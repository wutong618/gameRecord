import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Keep-Alive hook：每 5 分钟客户端 ping /api/health
 * 目的：避免 Vercel serverless 函数进入"冷态"（长时间无请求会 freeze）
 * 冷启动会引入 200-500ms 额外延迟
 *
 * v3.1 调整：默认间隔从 60s 改为 5 分钟。
 * Vercel 函数 idle 5-15 分钟才 freeze，60s 太频繁——每分钟一次跨太平洋 fetch
 * 浪费网络、抢占首屏请求带宽。5 分钟是更健康的折中。
 *
 * 挂在顶层（app.vue 或 pages/index.vue），全局单例
 */
export function useKeepAlive(intervalMs = 300_000) {
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
