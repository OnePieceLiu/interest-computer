const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id } = body


  const conn = await pool.getConnection()
  const [[mcInfo]] = await conn.execute(`SELECT * from money_change_record where id=?`, [id])
  const [[blInfo]] = await conn.execute(`SELECT * from borrow_loan_record where id=?`, [mcInfo.blid])
  if (mcInfo.status !== 'WAIT_CONFIRM') {
    conn.release()
    throw new Error('还款单状态不对！')
  }
  if (blInfo[blInfo.sponsor] !== openid) {
    conn.release()
    throw new Error('你不是还款单发起人，无法关闭')
  }

  await conn.execute(`UPDATE money_change_record SET status='CLOSED' WHERE id=? `, [id])
  conn.release()

  ctx.body = { code: 0, data: 'success' }
}