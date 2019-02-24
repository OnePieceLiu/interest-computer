const { pool } = require('../utils/mysql')
const moment = require('moment')

module.exports = async (ctx, next) => {
  const { openid, query } = ctx
  const { blid } = query

  const conn = await pool.getConnection()
  const [done] = await conn.execute(
    `SELECT * FROM money_change_record where blid=? AND status=? order by changeOrder desc limit 50`,
    [blid, 'DONE']
  )

  const [todo] = await conn.execute(
    `SELECT * FROM money_change_record where blid=? AND status=? order by createTime asc limit 50`,
    [blid, 'WAIT_CONFIRM']
  )

  conn.release()

  ctx.body = {
    code: 0,
    data: {
      done: done.map(formatWithDateObj),
      todo: todo.map(formatWithDateObj)
    }
  }
}

function formatWithDateObj(e) {
  e.date = moment(e.date).format('YYYY-MM-DD')
  return e
}