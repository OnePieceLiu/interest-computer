const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { code = '' } = ctx.query

  const [[row]] = await pool.execute(`SELECT url from static_assets where code=?`, [code])

  ctx.body = { code: 0, data: row.url }
}