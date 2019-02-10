const querystring = require('querystring')
const moment = require('moment')
const { pool } = require('../utils/mysql')

module.exports = async (ctx, next) => {
  const { method, search, request: { body }, openid } = ctx
  const query = querystring.parse(search.slice(1))

  if (method === 'POST') {
    const { loanDate, cycle, cycleUnit, loanAmount, rate, afterCycle, repaymentType, sponsor } = body
    const [res] = await pool.execute(
      `INSERT INTO borrow_loan_record (loanDate, cycle, cycleUnit, loanAmount, rate, afterCycle, repaymentType, ${sponsor}, sponsor, status) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [loanDate, cycle, cycleUnit, loanAmount, rate, afterCycle, repaymentType, openid, sponsor, 'WAIT_CONFIRM']
    )

    ctx.body = { code: 0, data: res.insertId }
  } else {
    const conn = await pool.getConnection()
    const [[row]] = await conn.execute(`SELECT * FROM borrow_loan_record where id=?`, [query.id])
    const { id, loanDate, cycle, cycleUnit, loanAmount, rate, afterCycle, repaymentType, loaner, debtor, sponsor, status } = row
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
      ctx.body = { code: 1, errMsg: '无权限查看!' }
      return;
    }

    ctx.body = {
      code: 0,
      data: {
        id,
        loanDate: moment(loanDate).format('YYYY-MM-DD'),
        cycle,
        cycleUnit,
        loanAmount,
        rate,
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
}