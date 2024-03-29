const moment = require('moment')
const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { query, openid } = ctx

  const conn = await pool.getConnection()
  const [[row]] = await conn.execute(`SELECT * FROM borrow_loan_record where id=?`, [query.id])
  const { id, loanDate, cycle, cycleUnit, loanAmount, rate, yearRate, principal, interest, afterCycle, repaymentType, loaner, debtor, sponsor, status } = row
  const loanerP = loaner ? conn.execute(`SELECT nickName, avatarUrl from wx_user where openid=?`, [loaner]) : Promise.resolve([[]])
  const debtorP = debtor ? conn.execute(`SELECT nickName, avatarUrl from wx_user where openid=?`, [debtor]) : Promise.resolve([[]])
  const [[[loanerInfo]], [[debtorInfo]]] = await Promise.all([loanerP, debtorP])
  conn.release();

  let viewer;
  if (openid === loaner) {
    viewer = 'loaner'
  } else if (openid === debtor) {
    viewer = 'debtor'
  } else if (status === 'WAIT_CONFIRM') { // 既不是loaner,也不是debtor，状态未完成，缺哪一方是哪一方
    viewer = sponsor === 'loaner' ? 'debtor' : 'loaner';
  } else {
    throw new Error('无权限查看!')
  }

  const today = moment().format('YYYY-MM-DD')
  const repaymentDate = moment(loanDate).add(cycle, cycleUnit).format('YYYY-MM-DD')

  ctx.body = {
    code: 0,
    data: {
      id,
      loanDate: moment(loanDate).format('YYYY-MM-DD'),
      cycle,
      cycleUnit,
      repaymentDate,
      overdue: today > repaymentDate && status === 'CREATED',
      loanAmount,
      rate,
      yearRate,
      totalAmount: (Number(principal) + Number(interest)).toFixed(2),
      afterCycle,
      repaymentType,
      sponsor,
      viewer,
      status, // WAIT_CONFIRM, CREATED, CLOSED
      loanerInfo,
      debtorInfo
    }
  }
}
