<template>
  <!--
    v6.0.3 自定义 Toast 容器
    - fixed top-12 让 toast 在头部下方，不挡标题
    - 移动端用全宽 + safe-area，桌面端右侧靠齐
    - 入场/出场用 Vue Transition + CSS 弹性
  -->
  <Teleport to="body">
    <div
      class="fixed z-[100] left-1/2 -translate-x-1/2 top-12 sm:top-4 sm:left-auto sm:right-4 sm:translate-x-0 flex flex-col gap-2 w-[min(420px,calc(100vw-2rem))] pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 backdrop-blur-md border shadow-lg"
          :class="variantClass(t.variant)"
          role="status"
        >
          <!-- 图标 -->
          <component
            :is="iconFor(t.variant)"
            class="w-5 h-5 shrink-0 mt-0.5"
            :stroke-width="2.5"
          />
          <!-- 文本 -->
          <div class="flex-1 min-w-0 text-sm font-bold leading-snug break-words">
            {{ t.message }}
          </div>
          <!-- 关闭按钮 -->
          <button
            class="shrink-0 -mt-0.5 -mr-1 p-1 rounded-md opacity-60 hover:opacity-100 active:scale-90 transition"
            :aria-label="'关闭提示'"
            @click="dismiss(t.id)"
          >
            <X class="w-3.5 h-3.5" :stroke-width="2.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-vue-next'
import { useToast, type ToastVariant } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

function iconFor(v: ToastVariant) {
  switch (v) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'warn': return AlertTriangle
    default: return Info
  }
}

function variantClass(v: ToastVariant) {
  switch (v) {
    case 'success':
      return 'bg-cyber-elevated/95 border-neon-green/40 text-neon-green'
    case 'error':
      return 'bg-cyber-elevated/95 border-neon-red/40 text-neon-red'
    case 'warn':
      return 'bg-cyber-elevated/95 border-neon-yellow/40 text-neon-yellow'
    default:
      return 'bg-cyber-elevated/95 border-neon-blue/40 text-neon-blue'
  }
}
</script>

<style scoped>
/* 弹性入场 / 滑出 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.92);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}
.toast-move {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
