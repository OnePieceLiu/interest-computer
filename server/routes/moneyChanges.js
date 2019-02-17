const querystring = require('querystring')
const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { search, openid } = ctx
  const query = querystring.parse(search.slice(1))
  const { blid } = query

  const conn = await pool.getConnection()
  const [doneRecords] = await conn.execute(
    `SELECT * FROM money_change_record where blid=? AND status=? order by changeOrder desc limit 50`,
    [blid, 'DONE']
  )

  const [todoRecords] = await conn.execute(
    `SELECT * FROM money_change_record where blid=? AND status=? limit 50`,
    [blid, 'WAIT_CONFIRM']
  )

  conn.release()

  ctx.body = { code: 0, data: { doneRecords, todoRecords } }
}