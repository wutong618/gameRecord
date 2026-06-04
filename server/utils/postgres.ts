import { sql as vercelSql } from '@vercel/postgres'

// 重新导出 sql 客户端 + 在其外层套上重试与超时
// 解决 Neon HTTP fetch 在中国访问 us-east-1 时偶发 fetch failed

const MAX_RETRIES = 3
const TIMEOUT_MS = 15_000
const BACKOFF_BASE_MS = 800

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`[postgres] ${label} timeout after ${ms}ms`)), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await withTimeout(fn(), TIMEOUT_MS, label)
    } catch (e: any) {
      lastErr = e
      const msg = e?.message ?? String(e)
      // 业务错误（unique violation 等）直接抛，不重试
      if (
        msg.includes('duplicate key') ||
        msg.includes('violates') ||
        msg.includes('syntax error')
      ) {
        throw e
      }
      console.warn(`[postgres] ${label} attempt ${i + 1}/${MAX_RETRIES} failed: ${msg}`)
      if (i < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * (i + 1)))
      }
    }
  }
  throw lastErr
}

// Proxy：拦截 tagged template 调用，包一层 retry+timeout
// vercelSql 既是 VercelPool 对象又有 [[Call]]（可调用），
// 用 Reflect.apply 触发其 callable 行为；其他属性透传
export const sql: typeof vercelSql = new Proxy(vercelSql, {
  apply(_target, thisArg, args) {
    const strings = args[0] as TemplateStringsArray | undefined
    const label = strings && strings[0] ? strings[0].trim().split('\n')[0].slice(0, 60) : 'sql'
    return withRetry(
      () => Reflect.apply(vercelSql as any, thisArg, args) as ReturnType<typeof vercelSql>,
      label
    )
  }
}) as typeof vercelSql

export type { VercelPoolClient, Row, Field } from '@vercel/postgres'
