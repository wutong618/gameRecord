/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        // UI 默认：Noto Sans SC（中文）→ Audiowide（无中文时兜底）
        sans: ['Noto Sans SC', 'Audiowide', 'system-ui', 'sans-serif'],
        // 主标题用：Audiowide（圆润复古电子 + 强烈游戏感）
        display: ['Audiowide', 'Orbitron', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        // 副标题/按钮：Orbitron（赛博几何，有未来感）
        heading: ['Orbitron', 'Audiowide', 'Noto Sans SC', 'sans-serif'],
        // 数字/分数：JetBrains Mono（等宽，不抖）+ Russo One（强调时力量感）
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // 力量感数字（用于 +5 / -3 大字号）
        score: ['Russo One', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        // 中文
        cn: ['Noto Sans SC', 'system-ui', 'sans-serif']
      },
      colors: {
        // 霓虹主色
        'neon-green': '#39ff14',
        'neon-blue': '#00ffff',
        'neon-pink': '#ff00ff',
        'neon-purple': '#bb00ff',
        'neon-orange': '#ff6600',
        'emerald-500': '#10b981',
        // 补充辅助霓虹
        'neon-cyan': '#22d3ee',
        'neon-yellow': '#facc15',
        'neon-red': '#ff3355',
        'cyber-bg': '#050714'
      },
      // 霓虹 box-shadow 三档（高斯辉光）
      boxShadow: {
        'neon-green': '0 0 12px rgba(57, 255, 20, 0.55), 0 0 32px rgba(57, 255, 20, 0.25)',
        'neon-green-lg': '0 0 20px rgba(57, 255, 20, 0.7), 0 0 56px rgba(57, 255, 20, 0.35)',
        'neon-blue': '0 0 12px rgba(0, 255, 255, 0.55), 0 0 32px rgba(0, 255, 255, 0.25)',
        'neon-blue-lg': '0 0 20px rgba(0, 255, 255, 0.7), 0 0 56px rgba(0, 255, 255, 0.35)',
        'neon-pink': '0 0 12px rgba(255, 0, 255, 0.55), 0 0 32px rgba(255, 0, 255, 0.25)',
        'neon-pink-lg': '0 0 20px rgba(255, 0, 255, 0.7), 0 0 56px rgba(255, 0, 255, 0.35)',
        // 卡片立体感
        'card-elevated': '0 8px 32px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04) inset',
        'card-glow': '0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 12px 48px -12px rgba(0, 255, 255, 0.18)'
      },
      animation: {
        // 呼吸发光
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'glow-pulse-fast': 'glow-pulse 1.2s ease-in-out infinite',
        // 扫描线（顶部那条光带）
        'scan-line': 'scan-line 3s linear infinite',
        // shimmer 骨架屏
        'shimmer': 'shimmer 2s linear infinite',
        // 慢速旋转
        'spin-slow': 'spin 8s linear infinite',
        'spin-slower': 'spin 20s linear infinite',
        // 分数变动
        'flash-green': 'flash-green 0.8s ease-out',
        'flash-pink': 'flash-pink 0.8s ease-out',
        // 新条目插入
        'slide-in-top': 'slide-in-top 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        // 模态弹窗
        'modal-in': 'modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'modal-out': 'modal-out 0.18s ease-in',
        // 背景径向光晕
        'breathe': 'breathe 8s ease-in-out infinite',
        // 指示光点
        'ping-slow': 'ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite'
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px currentColor, 0 0 16px transparent' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px rgba(0, 255, 255, 0.2)' }
        },
        'scan-line': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgba(57, 255, 20, 0.25)', transform: 'scale(1)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' }
        },
        'flash-pink': {
          '0%': { backgroundColor: 'rgba(255, 0, 255, 0.25)', transform: 'scale(1)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' }
        },
        'slide-in-top': {
          '0%': { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'modal-in': {
          '0%': { transform: 'translateY(20px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        'modal-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.96)', opacity: '0' }
      },
        'breathe': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.08)' }
        }
      },
      // 数字字宽等宽（防 ±5 / -3 跳动）
      fontVariantNumeric: {
        'tabular-nums': 'tabular-nums',
        'lining-nums': 'lining-nums'
      },
      // 自定义 transition timing（Apple 风格）
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: []
}
