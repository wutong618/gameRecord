// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts'
  ],
  googleFonts: {
    families: {
      // v3.1 字体瘦身：去掉未使用的 weight 和未引用的 family
      // 实际代码审计：
      //   - font-medium (500) / font-semibold (600) / font-extrabold (800) 0 处使用
      //   - font-bold (700) / font-black (900) / 默认 (400) 是真实需求
      //   - Audiowide / Bungee 0 处 class 引用（只在 tailwind.config.js 字体栈 fallback）
      // 主体（中文 + UI）：Noto Sans SC（去 500 档）
      'Noto Sans SC': [400, 700, 900],
      // 等宽数字 / 时间戳
      'JetBrains Mono': [400, 700],
      // 副标题/标签/按钮：Orbitron
      'Orbitron': [400, 700],
      // 数字强调（分数、轮次号）：Russo One
      'Russo One': [400]
    },
    display: 'swap',
    download: true,
    inject: true,
    preload: true
  },
  runtimeConfig: {
    public: {
      // 头像上传改走 client 直传后，token 不再需要
    }
  },
  app: {
    head: {
      title: '游戏现场记分器',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
      meta: [
        { name: 'theme-color', content: '#050714' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
