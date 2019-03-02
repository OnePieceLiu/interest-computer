const { redis } = require('../utils/redis.js')

module.exports = async (ctx, next) => {
  const { method } = ctx

  const computing = await redis.get('computing')

  if (method === 'POST' && computing) {
    throw new Error('正在批量计算利息，请稍后再提交！')
  }

  await next()
}