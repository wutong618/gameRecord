import { onBeforeUnmount, ref } from 'vue'

/**
 * 在组件挂载期间按固定间隔执行回调。
 * 卸载时自动停止。
 *
 * - 默认每 8 秒一次（4s 配合 server cache 已足够，且减少 Neon 冷启动压力）
 * - 回调返回的 Promise resolve 之后才会计入下一次（避免重叠）
 * - 标签页隐藏时自动暂停
 */
export function usePolling(
  fn: () => Promise<void> | void,
  intervalMs = 8000
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  const enabled = ref(true)
  let stopOnHidden = true

  const tick = async () => {
    if (!enabled.value) {
      schedule()
      return
    }
    if (typeof document !== 'undefined' && stopOnHidden && document.hidden) {
      schedule()
      return
    }
    if (running) {
      schedule()
      return
    }
    running = true
    try {
      await fn()
    } catch (e) {
      console.error('[usePolling] tick error:', e)
    } finally {
      running = false
      schedule()
    }
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(tick, intervalMs)
  }

  const start = () => {
    enabled.value = true
    schedule()
  }

  const stop = () => {
    enabled.value = false
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const onVisibility = () => {
    if (document.hidden) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    } else if (enabled.value) {
      // 回到前台时立即拉一次
      tick()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility)
  }

  // 第一次延迟 intervalMs 后开始
  schedule()

  onBeforeUnmount(() => {
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  return { start, stop, enabled }
}
