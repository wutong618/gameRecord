<template>
  <button
    :class="[
      'flex items-center gap-1.5 rounded-lg font-bold transition-all active:scale-95',
      size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
      copied
        ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
        : 'bg-slate-800 text-neon-blue border border-neon-blue/30 hover:bg-slate-700'
    ]"
    @click="copy"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        v-if="!copied"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13.828 10.172a4 4 0 015.656 0l1.415 1.415a4 4 0 010 5.656l-3 3a4 4 0 01-5.656 0M10.172 13.828a4 4 0 01-5.656 0l-1.415-1.415a4 4 0 010-5.656l3-3a4 4 0 015.656 0"
      />
      <path
        v-else
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
    <span>{{ copied ? '已复制' : '复制分享链接' }}</span>
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 复制该文本；不传则复制当前完整 URL */
  text?: string
  size?: 'sm' | 'md'
}>(), { size: 'md' })

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  const text = props.text ?? (typeof window !== 'undefined' ? window.location.href : '')
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      // 兜底：textarea + execCommand
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, 1800)
  } catch (e) {
    console.error('copy failed', e)
    alert('复制失败，请手动复制：' + text)
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
