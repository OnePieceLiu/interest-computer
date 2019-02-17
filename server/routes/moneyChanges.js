const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { openid, query } = ctx
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