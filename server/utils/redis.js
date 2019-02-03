const Redis = require('ioredis')
const redis = new Redis({ keyPrefix: 'interest-computer:' })

module.exports = {
    redis
}