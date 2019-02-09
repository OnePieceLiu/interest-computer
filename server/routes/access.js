const querystring = require('querystring')
const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const query = querystring.parse(ctx.search.slice(1))
  const { openid, sessionKey } = ctx;
  const { nickName, avatarUrl, gender, province, city } = query

  try {
    await pool.execute(
      `INSERT INTO wx_user (openid, sessionKey, nickName, avatarUrl, gender, province, city) 
      VALUES(?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
      sessionKey=?, nickName=?, avatarUrl=?, gender=?, province=?, city=?;`,
      [openid, sessionKey, nickName, avatarUrl, gender, province, city,
        sessionKey, nickName, avatarUrl, gender, province, city]
    )
  } catch (err) {
    console.log('err', err)
  }

  ctx.body = { code: 0, data: 'access success' }
}