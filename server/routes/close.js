const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id } = body

  const conn = await pool.getConnection()
  const [[blInfo]] = await conn.execute(`SELECT * from borrow_loan_record where id=?`, [id])
  if (blInfo.status !== 'WAIT_CONFIRM') {
    conn.release()
    throw new Error('借贷单状态不对！')
  }
  if (blInfo[blInfo.sponsor] !== openid) {
    conn.release()
    throw new Error('你不是借贷单发起人，无法关闭')
  }

  await conn.execute(
    `UPDATE borrow_loan_record SET status='CLOSED' WHERE id=? && ${blInfo.sponsor}=?`,
    [id, openid]
  )
  conn.release()

  ctx.body = { code: 0, data: 'success' }
}