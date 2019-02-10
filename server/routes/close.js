const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id } = body

  await pool.execute(
    `UPDATE borrow_loan_record SET status='CLOSED' 
    WHERE id=? && ((sponsor='debtor' && debtor=?)||(sponsor='loaner' && loaner=?))`,
    [id, openid, openid]
  )

  ctx.body = { code: 0, data: 'success' }
}