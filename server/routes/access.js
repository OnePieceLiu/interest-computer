const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { openid, sessionKey, query } = ctx;
  const { nickName = '', avatarUrl = '', gender = -1, country = '', province = '', city = '' } = query

  await pool.execute(
    `INSERT INTO wx_user (openid, sessionKey, nickName, avatarUrl, gender, country, province, city) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
      sessionKey=?, nickName=?, avatarUrl=?, gender=?, country=?, province=?, city=?;`,
    [openid, sessionKey, nickName, avatarUrl, gender, country, province, city,
      sessionKey, nickName, avatarUrl, gender, country, province, city]
  )

  ctx.body = { code: 0, data: 'access success' }
}