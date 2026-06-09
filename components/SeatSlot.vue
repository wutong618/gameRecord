<template>
  <div class="flex flex-col items-center select-none">
    <label
      class="relative rounded-full flex items-center justify-center text-white text-xl font-bold border-2 cursor-pointer overflow-hidden group transition-all"
      :class="[
        sizeClass,
        isEmpty
          ? 'border-dashed border-slate-600 hover:border-neon-blue/60 hover:bg-slate-800/30'
          : isSelf
            ? 'border-solid cursor-pointer active:scale-95'
            : 'border-solid',
        isSelf ? neonRing : ''
      ]"
      :style="avatarStyle"
      @click="handleClick"
    >
      <template v-if="isEmpty">
        <!-- 空位：[+] -->
        <svg class="w-1/2 h-1/2 text-slate-500 group-hover:text-neon-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </template>
      <template v-else>
        <img
          v-if="user!.avatarUrl"
          :src="user!.avatarUrl"
          :alt="user!.nickname"
          class="w-full h-full object-cover"
        />
        <span v-else>{{ user!.nickname.slice(0, 1) }}</span>
      </template>

      <!-- 自己：右下角小角标 -->
      <div
        v-if="isSelf"
        class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon-blue text-slate-900 flex items-center justify-center text-[10px] font-black border-2 border-slate-900"
      >
        我
      </div>
    </label>
    <span class="mt-1.5 text-xs text-slate-300 truncate max-w-[80px]">{{ isEmpty ? '空位' : user!.nickname }}</span>
    <span
      v-if="!isEmpty"
      class="text-sm font-bold"
      :class="(score ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-pink'"
    >
      {{ score === undefined ? '' : `${(score ?? 0) >= 0 ? '+' : ''}${score}` }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  user: User | null
  size?: 'sm' | 'md' | 'lg'
  isSelf?: boolean
  score?: number
  uploading?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', payload: { user: User | null }): void
  (e: 'upload', file: File): void
}>()

const isEmpty = computed(() => !props.user)
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-10 h-10 text-sm'
    case 'lg': return 'w-20 h-20 text-3xl'
    default: return 'w-16 h-16 text-xl'
  }
})

const colors = computed(() => {
  const key = (props.user?.avatarColor || 'fire-red') as keyof typeof PLAYER_COLORS
  return PLAYER_COLORS[key]
})

const avatarStyle = computed(() => ({
  background: isEmpty.value ? 'transparent' : colors.value.bg,
  borderColor: isEmpty.value ? '' : colors.value.neon,
  boxShadow: isEmpty.value ? 'none' : `0 0 12px ${colors.value.neon}50`
}))

const neonRing = computed(() => {
  if (!props.user) return ''
  const c = colors.value.neon
  return `ring-2 ring-offset-2 ring-offset-slate-900`
})

function handleClick() {
  emit('click', { user: props.user })
}
</script>
