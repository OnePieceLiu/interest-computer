const { pool } = require('../utils/mysql')
const moment = require('moment')
const { cycle2char } = require('../utils/enums')
const { nFormatter } = require('../utils/nFormatter')
const { getUsers, getUserById } = require('../utils/getUserInfo')

module.exports = async (ctx, next) => {
  const { openid, query, path, pageTS } = ctx
  const { type, status, offset, limit } = query

  console.log(pageTS, path);

  const conn = await pool.getConnection()

  const [rows] = await conn.execute(
    `SELECT * FROM borrow_loan_record where ${type === 'borrow' ? 'debtor' : 'loaner'}=? AND status${status === '' ? '!=' : '='}? AND createTime<? limit ?,?`,
    [openid, status, pageTS[path], offset, limit]
  )

  const users = await getUsers(rows, conn)

  conn.release()

  ctx.body = {
    code: 0, data: rows.map(e => {
      const { id, loanDate, cycle, cycleUnit, principal, interest, status, loaner, debtor, sponsor } = e;
      const today = moment().format('YYYY-MM-DD')
      const repaymentDate = moment(loanDate).add(cycle, cycle2char[cycleUnit]).format('YYYY-MM-DD')
      const targetId = sponsor === 'loaner' ? debtor : loaner;

      const blInfo = {
        id,
        repaymentDate,
        overdue: today > repaymentDate && status === 'CREATED',
        totalAmount: nFormatter(Number(principal) + Number(interest)),
        targetName: getUserById(users, targetId).nickName,
        status: status
      }

      return blInfo;
    })
  }
}