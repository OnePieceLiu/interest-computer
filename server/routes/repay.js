const { pool } = require('../utils/mysql')
const moment = require('moment')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx;
  const { blid, date, amount } = body

  const conn = await pool.getConnection()
  const [[blInfo]] = await conn.execute(`SELECT debtor, loanDate from borrow_loan_record where id=?`, [blid])

  if (!blInfo || blInfo.debtor !== openid) {
    conn.release()
    throw new Error('你不是该借贷单的债务人，无法发起还款！')
  }
  if (date < blInfo.loanDate || date > moment().format('YYYY-MM-DD')) {
    conn.release()
    throw new Error('还款日期不能小于借款日期,不能大于今天')
  }

  await conn.execute(
    `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest)
      VALUES(?,?,?,?,?,?,?,?)`,
    [blid, 'WAIT_CONFIRM', date, -1, '还钱', -amount, null, null]
  )
  conn.release()
  ctx.body = { code: 0, data: '发起还款成功，待好友确认！' }

}