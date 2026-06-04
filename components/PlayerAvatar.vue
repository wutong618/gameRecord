<template>
  <div class="flex flex-col items-center select-none">
    <!-- 头像（点击触发上传；长按或右键也能触发 input） -->
    <label
      class="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 cursor-pointer overflow-hidden group"
      :style="avatarStyle"
    >
      <img
        v-if="player.avatarUrl"
        :src="player.avatarUrl"
        :alt="player.name"
        class="w-full h-full object-cover"
        @error="onImgError"
      />
      <span v-else>{{ player.name }}</span>

      <!-- hover 提示 -->
      <div
        v-if="!uploading"
        class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center"
      >
        <svg
          class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      <!-- 上传中 loading -->
      <div
        v-if="uploading"
        class="absolute inset-0 bg-black/60 flex items-center justify-center"
      >
        <svg class="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        class="hidden"
        @change="onFileChange"
      />
    </label>

    <span class="mt-2 text-sm text-slate-300">{{ player.name }}</span>
    <span
      class="text-lg font-bold"
      :class="scoreColor"
    >
      {{ score >= 0 ? '+' : '' }}{{ score }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { PlayerProfile } from '~/types'
import { PLAYER_COLORS } from '~/types'

const props = defineProps<{
  player: PlayerProfile
  score?: number
  uploading?: boolean
}>()

const emit = defineEmits<{
  (e: 'upload', file: File): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const imgError = ref(false)

const colors = computed(() => PLAYER_COLORS[props.player.color as keyof typeof PLAYER_COLORS])

const avatarStyle = computed(() => ({
  background: colors.value.bg,
  borderColor: colors.value.neon,
  boxShadow: `0 0 15px ${colors.value.neon}40, 0 0 5px ${colors.value.neon}`
}))

const scoreColor = computed(() => (props.score ?? 0) >= 0 ? 'text-neon-green' : 'text-neon-pink')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('upload', file)
  // 重置以便重复选择同一文件
  input.value = ''
}

function onImgError() {
  imgError.value = true
}
</script>
