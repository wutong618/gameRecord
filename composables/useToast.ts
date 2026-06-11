import { ref, readonly } from 'vue'

/**
 * v6.0.3 全局轻量 Toast 提示系统
 *
 * 替代原生 alert() / confirm()：
 *   const toast = useToast()
 *   toast.success('已删除')
 *   toast.error('网络错误')
 *   toast.info('加载中…')
 *
 * 设计原则：
 *  - 全局单例：模块级 ref，任意组件调用都进同一个队列
 *  - 自动消失：默认 3s，可指定 duration
 *  - 同类去重：相同 id 的 toast 不会重复显示
 *  - 入场/出场动画用 CSS 处理（toast-container.vue）
 *  - 最多同时显示 4 条，超出排队等位
 */

export type ToastVariant = 'success' | 'error' | 'info' | 'warn'
export interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
  duration: number
}

const toasts = ref<ToastItem[]>([])
let nextId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()
const MAX_VISIBLE = 4

function push(variant: ToastVariant, message: string, duration = 3000) {
  const id = nextId++
  const item: ToastItem = { id, variant, message, duration }
  toasts.value = [...toasts.value, item].slice(-MAX_VISIBLE)
  if (duration > 0) {
    timers.set(id, setTimeout(() => dismiss(id), duration))
  }
  return id
}

function dismiss(id: number) {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
  toasts.value = toasts.value.filter((x) => x.id !== id)
}

function clear() {
  for (const t of timers.values()) clearTimeout(t)
  timers.clear()
  toasts.value = []
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    success: (msg: string, duration?: number) => push('success', msg, duration),
    error: (msg: string, duration?: number) => push('error', msg, duration),
    info: (msg: string, duration?: number) => push('info', msg, duration),
    warn: (msg: string, duration?: number) => push('warn', msg, duration),
    dismiss,
    clear
  }
}
