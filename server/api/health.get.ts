// GET /api/health —— 极简端点，供客户端 keep-alive 探测
// 1s 内返回，避免 Vercel serverless 函数进入"冷态"
// 不查 DB，零依赖
export default defineEventHandler(() => {
  return { ok: true, ts: Date.now() }
})
