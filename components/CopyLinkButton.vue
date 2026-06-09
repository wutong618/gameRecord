<template>
  <button
    :class="[
      'flex items-center gap-1.5 rounded-lg font-bold transition-all duration-200 active:scale-95',
      size === 'sm' ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-sm',
      copied
        ? 'bg-neon-green/15 text-glow-green border border-neon-green/40'
        : 'btn-cyber-ghost text-slate-300 hover:text-neon-blue'
    ]"
    @click="copy"
  >
    <Check v-if="copied" class="w-3.5 h-3.5" :stroke-width="2.5" />
    <Link2 v-else class="w-3.5 h-3.5" :stroke-width="2.5" />
    <span class="font-pingfang">{{ copied ? '已复制' : '复制链接' }}</span>
  </button>
</template>

<script setup lang="ts">
import { Link2, Check } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
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
