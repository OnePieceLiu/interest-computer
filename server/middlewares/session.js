const { redis } = require('../utils/redis.js')

module.exports = async (ctx, next) => {
    const { sessionid } = ctx.headers
    const sessionStr = await redis.get(sessionid)
    const session = JSON.parse(sessionStr) || {}

    ctx.openid = session.openid
    ctx.session_key = session.session_key
    await next()
}