const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { openid, query, path, pageTS } = ctx
  const { type, offset, limit } = query

  const [rows] = await pool.execute(
    `SELECT * FROM borrow_loan_record where ${type === 'borrow' ? 'debtor' : 'loaner'}=? AND createTime<? limit ?,?`,
    [openid, pageTS[path], offset, limit]
  )

  ctx.body = { code: 0, data: rows }
}