const moment = require('moment')
const { pool } = require('../utils/mysql')
const { cycle2char } = require('../utils/enums')
const { IC } = require('../utils/InterestComputer')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id: blid } = body

  const [[blInfo]] = await pool.execute(`SELECT * from borrow_loan_record where id=?`, [blid])
  const { status, loanDate, cycle, cycleUnit, loanAmount, sponsor, afterCycle, rate } = blInfo

  if (status === 'WAIT_CONFIRM') {
    const conn = await pool.getConnection()
    await conn.beginTransaction()

    try {
      // 先把确认人填入 记录中
      await conn.execute(`UPDATE borrow_loan_record SET ${sponsor === 'loaner' ? 'debtor' : 'loaner'}=? where id=?`, [openid, blid])

      // 插入 该借贷单 首条 money_change_record 记录
      const [res] = await conn.execute(
        `INSERT INTO money_change_record (blid, status, changeOrder, date, event, changeMoney, principal, interest) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
        [blid, 'DONE', 1, loanDate, '借钱', loanAmount, loanAmount, 0]
      )

      // 准备 利息计算器的参数
      const lastRecord = {
        id: res.insertId,
        blid,
        status: 'DONE',
        changeOrder: 1,
        date: loanDate,
        event: '借钱',
        changeMoney: loanAmount,
        principal: loanAmount,
        interest: 0
      }

      const cycleEndDate = moment(loanDate).add(cycle, cycle2char[cycleUnit])
      const startOfToday = moment().startOf('day');
      const repaymentRecords = []
      if (afterCycle === 'payoff' && !cycleEndDate.isAfter(startOfToday)) {
        repaymentRecords.push({
          changeMoney: - loanAmount * (100 + Number(rate)) / 100,
          date: cycleEndDate.format('YYYY-MM-DD')
        })
      }

      await IC.create({ lastRecord, blInfo, repaymentRecords, conn })
      await conn.commit()
      await conn.release()

      ctx.body = { code: 0, data: 'success' }
    } catch (err) {
      await conn.rollback()
      await conn.release()  //其实release是一个同步函数
      throw err
    }
  } else if (status === 'CREATED') {
    ctx.body = { code: 1, data: '已经有人确认了这笔借款！' }
  } else if (status === 'CLOSED') {
    ctx.body = { code: 1, data: '借款已经被关闭，请联系好友确认！' }
  } else {
    ctx.body = { code: 1, data: '借款单状态不对！' }
  }

}