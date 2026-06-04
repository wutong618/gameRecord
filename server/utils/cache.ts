// 进程级内存缓存：5 秒过期
// 用于减少对 Neon 的 SQL 查询次数，应对中国到 us-east-1 的高延迟
// 注意：dev 模式 HMR 会丢失缓存；production serverless 函数冷启动后也会清空

type Entry<T> = { value: T; expiresAt: number }
const store = new Map<string, Entry<unknown>>()

export function cacheGet<T>(key: string): T | null {
  const e = store.get(key) as Entry<T> | undefined
  if (!e) return null
  if (Date.now() > e.expiresAt) {
    store.delete(key)
    return null
  }
  return e.value
}

export function cacheSet<T>(key: string, value: T, ttlMs = 5000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheInvalidate(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

export function cacheInvalidateAll(): void {
  store.clear()
}
