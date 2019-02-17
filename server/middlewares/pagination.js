const { redis } = require('../utils/redis.js')
const moment = require('moment')

module.exports = async (ctx, next) => {
  const { method, path, query, openid } = ctx
  const { offset } = query

  if (typeof offset !== 'undefined') {
    if (offset === '0') {
      const now = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
      await redis.set(`${openid}:pageTS:${path}`, now, 'EX', 60 * 60) //一小时过期

      ctx.pageTS = ctx.pageTS || {}
      ctx.pageTS[path] = now
    } else {
      ctx.pageTS = ctx.pageTS || {}
      ctx.pageTS[path] = await redis.get(`${openid}:pageTS:${path}`)
    }
  }

  await next()
}