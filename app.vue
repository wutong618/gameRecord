<script setup lang="ts">
// 全局 keep-alive：每 5 分钟 ping 一次 /api/health，避免 Vercel serverless 函数"冻"
// v3.1：从 60s 延长到 5min——见 useKeepAlive.ts 注释
const { isActive: keepAliveActive, lastPingAt } = useKeepAlive(300_000)
</script>

<template>
  <div class="antialiased relative min-h-screen overflow-x-hidden" style="background: var(--cyber-bg);">
    <!-- 顶部固定扫描光带（esports 直播感） -->
    <div
      class="fixed top-0 inset-x-0 z-50 h-px pointer-events-none"
      style="background: linear-gradient(90deg, transparent 0%, #00ffff 50%, transparent 100%); box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"
    />

    <!-- 背景径向光晕（一个就够，多了 GPU 吃不消） -->
    <div
      class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full pointer-events-none animate-breathe"
      style="background: radial-gradient(circle, rgba(0, 255, 255, 0.10) 0%, rgba(57, 255, 20, 0.05) 40%, transparent 70%); filter: blur(16px); will-change: opacity, transform;"
      aria-hidden="true"
    />

    <!-- 细网格背景（数据感）—— GPU 友好：纯 background-image，无 blur -->
    <div
      class="fixed inset-0 pointer-events-none opacity-[0.04]"
      style="background-image:
        linear-gradient(rgba(0, 255, 255, 0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 255, 0.5) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);"
      aria-hidden="true"
    />

    <NuxtPage />

    <!-- v6.0.3 全局 Toast 容器（Teleport 到 body，z-100 不被任何页面挡） -->
    <ToastContainer />
  </div>
</template>

<style>
/* app 层不再需要单独样式——所有视觉 token 都在 assets/css/main.css */
</style>
