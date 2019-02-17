const { pool } = require('../utils/mysql')
const querystring = require('querystring')

module.exports = async (ctx, next) => {
  const { search, openid } = ctx
  const query = querystring.parse(search.slice(1))
  const { type } = query

  const [rows] = await pool.execute(
    `SELECT * FROM borrow_loan_record where ${type === 'borrow' ? 'debtor' : 'loaner'}=?`,
    [openid]
  )

  ctx.body = { code: 0, data: rows }
}