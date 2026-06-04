<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <div class="absolute inset-0 bg-black/70" />
        <div class="relative bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
          <h3 class="text-xl font-bold text-white mb-2">{{ title }}</h3>
          <p class="text-slate-400 mb-6 text-sm">{{ message }}</p>
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold"
              @click="$emit('cancel')"
            >
              取消
            </button>
            <button
              class="flex-1 py-3 rounded-xl bg-neon-pink text-white font-bold"
              @click="$emit('confirm')"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message?: string
}>()
defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
