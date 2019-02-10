const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id, viewer } = body

  const conn = await pool.getConnection()
  const [[row]] = await conn.execute(`SELECT status, sponsor from wx_user where id=?`, [id])

  if (row.status === 'WAIT_CONFIRM') {
    await pool.execute(`UPDATE borrow_loan_record SET status='CREATED', ${viewer}=? WHERE id=?`, [openid, id])

    ctx.body = { code: 0, data: 'success' }
  } else {
    ctx.body = { code: 1, data: '已经有人确认了这笔借款' }
  }

  conn.release();
}