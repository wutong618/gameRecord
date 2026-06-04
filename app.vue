<template>
  <div class="antialiased">
    <NuxtPage />
  </div>
</template>

<style>
html, body {
  background-color: #0f172a;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: #1e293b;
}
::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>