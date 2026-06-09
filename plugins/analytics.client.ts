/**
 * v6.0 Vercel 监控集成
 *
 * 文件名后缀 `.client.ts` 强制该插件只在客户端运行，
 * 不会在 Nitro 服务端执行——保证 SDK 仅在浏览器初始化。
 *
 * 引入：
 *  - @vercel/analytics        —— 流量统计 + 自定义事件 track()
 *  - @vercel/speed-insights   —— Core Web Vitals (LCP / FID / CLS / INP / TTFB / FCP)
 *
 * 用法：script-based inject() 方式（不需要在模板里挂 <Analytics /> 组件），
 * 这样不会增加 SPA hydration 负担，零阻塞渲染。
 *
 * dev 隔离：
 *  - Vercel SDK 自身会在 localhost / 非 Vercel host 时 no-op
 *  - 我们额外用 import.meta.dev 守一道，prod build 会被 dead-code-eliminate
 *  - 用户跑 `node .output/server/index.mjs` 本地 prod preview 时会真的上报
 *    （方便他们验证；不想的话用 `VERCEL=1` / `import.meta.dev` 进一步收口）
 */
export default defineNuxtPlugin(() => {
  if (import.meta.dev) {
    // 开发环境：跳过 Vercel 初始化，避免脏数据进仪表板
    return
  }

  // 异步 import：避免首屏 critical path 阻塞；SDK 会在下一个 microtask 注册
  // 不 await —— 我们不想等 SDK 加载完才让页面继续渲染
  Promise.all([
    import('@vercel/analytics').then(({ inject }) => inject()),
    import('@vercel/speed-insights').then(({ injectSpeedInsights }) =>
      injectSpeedInsights()
    )
  ]).catch((e) => {
    // SDK 加载失败不影响主流程
    console.warn('[v6.0 analytics] SDK init failed:', e)
  })
})
