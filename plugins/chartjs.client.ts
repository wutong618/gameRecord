import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// 注册 Chart.js 组件
export default defineNuxtPlugin(() => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
  )

  // 设置 Chart.js 默认样式
  ChartJS.defaults.color = '#94a3b8'
  ChartJS.defaults.borderColor = '#334155'
  ChartJS.defaults.font.family = 'system-ui, -apple-system, sans-serif'
})