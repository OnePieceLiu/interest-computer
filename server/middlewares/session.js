const { redis } = require('../utils/redis.js')
const env = process.env.NODE_ENV

module.exports = async (ctx, next) => {
  const { sessionid, openid } = ctx.headers
  const sessionStr = await redis.get(sessionid)
  const session = JSON.parse(sessionStr) || {}

  ctx.openid = (env === 'dev' && openid) ? openid : session.openid
  ctx.sessionKey = session.session_key
  await next()
}