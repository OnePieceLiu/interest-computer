const { pool } = require('../utils/mysql')
const querystring = require('querystring')

module.exports = async (ctx, next) => {
  const query = querystring.parse(ctx.search.slice(1))

  const [rows] = pool.execute(`SELECT * FROM money_change_record where blid=? order by changeOrder desc`, [query.blid])

  ctx.body = { code: 0, data: rows }
}