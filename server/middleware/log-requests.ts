// 记录所有请求的 method + url + status，方便排查 mobile 端 500
// 临时调试用，问题解决后可删除

export default defineEventHandler((event) => {
  const start = Date.now()
  event.node.res.on('finish', () => {
    const status = event.node.res.statusCode
    const url = event.node.req.url
    const method = event.node.req.method
    const dur = Date.now() - start
    const tag = status >= 500 ? '!!' : status >= 400 ? '!' : '·'
    console.log(`[req] ${tag} ${method} ${url} -> ${status} (${dur}ms)`)
  })
})
