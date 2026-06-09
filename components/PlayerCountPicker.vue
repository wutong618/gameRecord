<template>
  <div>
    <div class="flex items-baseline justify-center gap-1.5 mb-2.5">
      <span class="font-heading text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">人数</span>
      <span class="font-score text-2xl text-glow-cyan leading-none">{{ modelValue }}</span>
      <span class="text-slate-500 text-xs">/ 10</span>
    </div>
    <div class="grid grid-cols-9 gap-1.5">
      <button
        v-for="n in 9"
        :key="n + 1"
        type="button"
        class="aspect-square rounded-lg font-heading font-bold text-sm transition-all duration-200 active:scale-90 flex items-center justify-center"
        :class="modelValue === n + 1
          ? 'text-cyber-bg'
          : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/40'"
        :style="modelValue === n + 1
          ? { background: 'linear-gradient(135deg, #00ffff, #39ff14)', boxShadow: '0 0 16px rgba(0, 255, 255, 0.4), inset 0 0 0 1px rgba(0, 255, 255, 0.5)' }
          : {}"
        @click="$emit('update:modelValue', n + 1)"
      >
        {{ n + 1 }}
      </button>
    </div>
    <p class="text-[10px] text-slate-600 text-center mt-2 font-num">范围 2-10 人</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>
