const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { query } = ctx

  const [rows] = pool.execute(`SELECT * FROM money_change_record where blid=? order by changeOrder desc`, [query.blid])

  ctx.body = { code: 0, data: rows }
}