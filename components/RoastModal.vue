<template>
  <Teleport to="body">
    <Transition name="roast-pop">
      <div
        v-if="roast"
        class="fixed inset-x-0 top-16 z-50 flex justify-center pointer-events-none px-4"
      >
        <div
          class="pointer-events-auto relative glass-card-elevated rounded-2xl p-5 max-w-md w-full overflow-hidden"
          :class="scenarioBorderClass"
        >
          <!-- 顶部装饰条（按场景切色） -->
          <div
            class="absolute top-0 inset-x-0 h-0.5"
            :style="{
              background: `linear-gradient(90deg, transparent, ${scenarioGlow}, transparent)`,
              boxShadow: `0 0 12px ${scenarioGlow}`
            }"
          />

          <!-- 标题行 -->
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :style="{
                  background: `linear-gradient(135deg, ${scenarioColor}30, ${scenarioColor}10)`,
                  border: `1px solid ${scenarioColor}50`,
                  boxShadow: `0 0 12px ${scenarioGlow}`
                }"
              >
                <Gavel class="w-4 h-4" :style="{ color: scenarioColor }" :stroke-width="2.5" />
              </div>
              <div>
                <div
                  class="font-heading text-[10px] uppercase tracking-[0.3em] font-bold"
                  :style="{ color: scenarioColor }"
                >
                  {{ scenarioTitle }}
                </div>
                <div class="font-num text-[10px] text-slate-500 mt-0.5">R{{ roundNumber }}</div>
              </div>
            </div>
            <button
              class="btn-cyber-ghost w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-neon-pink"
              @click="dismiss"
              title="关闭"
            >
              <X class="w-3.5 h-3.5" :stroke-width="2.5" />
            </button>
          </div>

          <!-- 打字机正文 -->
          <div class="relative min-h-[3.5rem]">
            <p
              class="font-pingfang text-[15px] leading-relaxed text-slate-100 tracking-[0.02em]"
              :style="{
                textShadow: `0 0 8px ${scenarioGlow}40`
              }"
            >
              <span>{{ displayText }}</span>
              <span
                v-if="isTyping"
                class="inline-block w-0.5 h-4 ml-0.5 align-middle"
                :style="{
                  background: scenarioColor,
                  boxShadow: `0 0 6px ${scenarioGlow}`,
                  animation: 'blink-caret 0.6s steps(2) infinite'
                }"
              />
            </p>
          </div>

          <!-- 底部操作行：手动关闭按钮 + 状态提示 -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/40">
            <span class="font-heading text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {{ isTyping ? '正在撰写判决…' : '判决已送达' }}
            </span>
            <button
              class="btn-cyber-primary px-4 py-1.5 rounded-lg font-pingfang text-xs flex items-center gap-1.5"
              @click="dismiss"
            >
              <X class="w-3 h-3" :stroke-width="2.5" />
              关闭判决
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Gavel, X } from 'lucide-vue-next'
import { useTypewriter } from '~/composables/useTypewriter'
import { useRoast } from '~/composables/useRoast'

const props = defineProps<{ roundNumber?: number }>()

const { currentRoast, dismissRoast } = useRoast()
const { displayText, isTyping, start, finish } = useTypewriter(28)

const roast = computed(() => currentRoast.value)

const scenarioConfig = {
  king_loser: {
    title: '裁判判决 · 统治时刻',
    color: '#39ff14',
    glow: 'rgba(57, 255, 20, 0.6)',
    border: 'border-neon-green/40'
  },
  comeback: {
    title: '裁判判决 · 热血逆袭',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.6)',
    border: 'border-neon-yellow/40'
  },
  lopsided: {
    title: '裁判判决 · 鸿沟预警',
    color: '#ff3355',
    glow: 'rgba(255, 51, 85, 0.6)',
    border: 'border-neon-red/40'
  },
  room_created: {
    title: '局已开局 · 房主宣言',
    color: '#ff00ff',
    glow: 'rgba(255, 0, 255, 0.6)',
    border: 'border-neon-pink/40'
  },
  player_joined: {
    title: '新玩家入局 · 欢迎登车',
    color: '#00ffff',
    glow: 'rgba(0, 255, 255, 0.6)',
    border: 'border-neon-cyan/40'
  }
}

const scenarioTitle = computed(() => roast.value ? scenarioConfig[roast.value.scenario].title : '')
const scenarioColor = computed(() => roast.value ? scenarioConfig[roast.value.scenario].color : '#00ffff')
const scenarioGlow = computed(() => roast.value ? scenarioConfig[roast.value.scenario].glow : 'rgba(0, 255, 255, 0.6)')
const scenarioBorderClass = computed(() => roast.value ? scenarioConfig[roast.value.scenario].border : 'border-neon-blue/40')

// 启动打字机（不自动消失）
watch(roast, (val) => {
  if (val) start(val.text)
})

function dismiss() {
  finish()
  dismissRoast()
}

// 全局键盘：打字机时按任意键立即完成
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
function onKey() { if (isTyping.value) finish() }
</script>

<style scoped>
.roast-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.roast-pop-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}
.roast-pop-enter-from {
  opacity: 0;
  transform: scale(0.6) translateY(-30px) rotate(-2deg);
}
.roast-pop-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-20px);
}

@keyframes blink-caret {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
