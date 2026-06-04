// 把 500 错误的详细堆栈打到日志里

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('error', (err, ctx) => {
    const url = ctx?.event?.node?.req?.url
    const method = ctx?.event?.node?.req?.method
    console.error(`[err] ${method} ${url}`)
    console.error(err)
  })
})
