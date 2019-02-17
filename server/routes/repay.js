const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx;
  const { blid, date, amount } = body

  const conn = await pool.getConnection()
  const [[blInfo]] = await conn.execute(`SELECT debtor, date from borrow_loan_record where id=?`, [blid])
  if (blInfo || blInfo.debtor !== openid) {
    ctx.body = { code: 1, data: '你不是该借贷单的债务人，无法发起还款！' }
  } else if (date < blInfo.date) {
    ctx.body = { code: 1, date: '还款日期不能小于借款单日期' }
  } else {
    await conn.execute(
      `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest)
      VALUES(?,?,?,?,?,?,?,?)`,
      [blid, 'WAIT_CONFIRM', date, -1, '还钱', -amount, null, null]
    )

    ctx.body = { code: 0, data: '发起还款成功，待好友确认！' }
  }

  conn.release()
}