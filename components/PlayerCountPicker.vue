<template>
  <div>
    <label class="block text-slate-300 text-sm font-bold mb-2 text-center">
      房间人数：<span class="text-neon-blue text-lg">{{ modelValue }}</span> 人
    </label>
    <div class="grid grid-cols-9 gap-1.5">
      <button
        v-for="n in 9"
        :key="n + 1"
        type="button"
        class="aspect-square rounded-lg font-bold text-sm transition-all"
        :class="modelValue === n + 1
          ? 'bg-neon-blue text-slate-900 shadow-lg shadow-neon-blue/30'
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
        @click="$emit('update:modelValue', n + 1)"
      >
        {{ n + 1 }}
      </button>
    </div>
    <p class="text-[11px] text-slate-500 text-center mt-1.5">范围 2-10 人</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>
