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
      // 主体（中文 + UI）：保留 Noto Sans SC + JetBrains Mono（等宽数字不抖）
      'Noto Sans SC': [400, 500, 700, 900],
      'JetBrains Mono': [400, 500, 700],
      // 标题：复古电子 + 赛博几何
      Audiowide: [400],
      Orbitron: [400, 500, 600, 700, 800, 900],
      Bungee: [400],
      // 数字强调（分数、轮次号）：力量感等宽
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
