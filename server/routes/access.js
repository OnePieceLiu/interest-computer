const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { openid, sessionKey, query } = ctx;
  const { nickName, avatarUrl, gender, country, province, city } = query

  try {
    await pool.execute(
      `INSERT INTO wx_user (openid, sessionKey, nickName, avatarUrl, gender, country, province, city) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE 
      sessionKey=?, nickName=?, avatarUrl=?, gender=?, country=?, province=?, city=?;`,
      [openid, sessionKey, nickName = '', avatarUrl = '', gender = 1, country = '', province = '', city = '',
        sessionKey, nickName = '', avatarUrl = '', gender = 1, country = '', province = '', city = '']
    )
  } catch (err) {
    console.log('err', err)
  }

  ctx.body = { code: 0, data: 'access success' }
}