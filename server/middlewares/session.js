const { redis } = require('../utils/redis.js')
const env = process.env.NODE_ENV

const whiteLists = ['/login']

module.exports = async (ctx, next) => {
  const { sessionid, openid } = ctx.headers

  if (whiteLists.some(a => a === ctx.path)) return await next()

  if (env === 'development' && openid) {  // postman 调试
    ctx.openid = openid
  } else {
    const sessionStr = await redis.get(sessionid)
    const session = JSON.parse(sessionStr)
    if (!session) throw new Error('会话已过期，请退出重新打开小程序！')

    ctx.openid = session.openid
    ctx.sessionKey = session.session_key
  }

  await next()
}