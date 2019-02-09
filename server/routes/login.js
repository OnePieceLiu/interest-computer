const querystring = require('querystring')
const axios = require('axios')
const { redis } = require('../utils/redis')
const config = require('../config.js')

module.exports = async (ctx, next) => {
  const query = querystring.parse(ctx.search.slice(1))
  const { data } = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
    params: {
      appid: config.appid,
      secret: config.secret,
      js_code: query.code,
      grant_type: 'authorization_code'
    }
  })

  const sessionid = `${Date.now()}_${String(Math.random()).slice(-5)}`
  const { openid, session_key } = data
  await redis.set(sessionid, JSON.stringify({ openid, session_key }), 'EX', 60 * 60)    //一小时过期

  ctx.body = { code: 0, sessionid }
}