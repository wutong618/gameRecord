<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <!-- 背景：磨砂黑 + 蓝色辉光 -->
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm"
          style="background: radial-gradient(circle at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85));"
        />

        <div
          class="relative glass-card-elevated rounded-2xl p-6 w-full max-w-sm overflow-hidden"
          :class="danger ? 'border-glow-pink' : 'border-glow-blue'"
        >
          <!-- 顶部装饰条 -->
          <div
            class="absolute top-0 inset-x-0 h-px"
            :style="{
              background: danger
                ? 'linear-gradient(90deg, transparent, #ff00ff, transparent)'
                : 'linear-gradient(90deg, transparent, #00ffff, transparent)',
              boxShadow: danger
                ? '0 0 12px rgba(255, 0, 255, 0.6)'
                : '0 0 12px rgba(0, 255, 255, 0.6)'
            }"
          />

          <!-- 图标 -->
          <div class="flex justify-center mb-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :class="danger
                ? 'bg-neon-pink/10 border border-neon-pink/40'
                : 'bg-neon-blue/10 border border-neon-blue/40'"
              :style="{
                boxShadow: danger
                  ? '0 0 20px rgba(255, 0, 255, 0.3)'
                  : '0 0 20px rgba(0, 255, 255, 0.3)'
              }"
            >
              <AlertTriangle
                class="w-6 h-6"
                :class="danger ? 'text-neon-pink' : 'text-neon-blue'"
                :stroke-width="2.5"
              />
            </div>
          </div>

          <h3 class="font-pingfang text-xl text-center mb-2 text-white tracking-[0.05em]">
            {{ title }}
          </h3>
          <p class="text-slate-400 mb-6 text-sm text-center leading-relaxed">{{ message }}</p>

          <div class="flex gap-3">
            <button
              class="btn-cyber-ghost flex-1 py-3 rounded-xl font-pingfang"
              @click="$emit('cancel')"
            >
              取消
            </button>
            <button
              class="flex-1 py-3 rounded-xl font-pingfang text-white font-bold transition-all duration-200 active:scale-95"
              :class="danger
                ? 'bg-gradient-to-r from-neon-pink to-pink-600 shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:shadow-[0_0_30px_rgba(255,0,255,0.6)]'
                : 'bg-gradient-to-r from-neon-blue to-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]'"
              @click="$emit('confirm')"
            >
              {{ confirmText || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

withDefaults(defineProps<{
  show: boolean
  title: string
  message?: string
  danger?: boolean
  confirmText?: string
}>(), { danger: false, confirmText: '' })
defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()
</script>

<style scoped>
.modal-fade-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active { transition: all 0.15s ease-in; }
.modal-fade-enter-from { opacity: 0; transform: scale(0.94) translateY(10px); }
.modal-fade-leave-to   { opacity: 0; transform: scale(0.96); }
</style>
