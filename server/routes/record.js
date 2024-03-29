const moment = require('moment')
const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx

  const { loanDate, cycle, cycleUnit, loanAmount, rate, yearRate = null, afterCycle, repaymentType, sponsor } = body

  const [res] = await pool.execute(
    `INSERT INTO borrow_loan_record (loanDate, cycle, cycleUnit, loanAmount, rate, yearRate, principal, interest, afterCycle, repaymentType, ${sponsor}, sponsor, status) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [loanDate, cycle, cycleUnit, loanAmount, rate, yearRate, loanAmount, loanAmount * rate / 100, afterCycle, repaymentType, openid, sponsor, 'WAIT_CONFIRM']
  )

  ctx.body = { code: 0, data: res.insertId }
}