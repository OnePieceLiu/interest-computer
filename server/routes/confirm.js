const moment = require('moment')
const { pool } = require('../utils/mysql')
const { cycle2char } = require('../utils/enums')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx
  const { id: blid } = body

  const conn = await pool.getConnection()
  const [[blInfo]] = await conn.execute(`SELECT * from borrow_loan_record where id=?`, [blid])
  const { status, loanDate, cycle, cycleUnit, loanAmount, sponsor, afterCycle, rate } = blInfo

  if (status === 'WAIT_CONFIRM') {
    let date = moment(loanDate);
    let cycleEndDate = date.add(cycle, cycle2char[cycleUnit])
    const now = moment();
    let principal = loanAmount;
    let interest = 0;
    let changeMoney = 0;
    let finalStatus = 'CREATED';
    let changeOrder = 1;

    await pool.execute(
      `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
      VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
      [blid, 'DONE', loanDate, changeOrder, '借钱', loanAmount, principal, interest]
    )

    if (afterCycle === 'compound') {
      // 如果是复利， 当前确认时间 离 借款时间 已经过去几个周期，本金就有多少次变化
      while (cycleEndDate.isBefore(now)) {
        changeMoney = principal * rate / 100;
        principal = principal + changeMoney;
        interest = interest;
        changeOrder += 1;

        await pool.execute(
          `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', cycleEndDate.format('YYYY-MM-DD'), changeOrder, '利息转本金', changeMoney, principal, interest]
        )

        date = cycleEndDate;
        cycleEndDate = date.add(cycle, cycle2char[cycleUnit])
      }

      //最后一次算息
      changeMoney = computeInterest(principal, rate, date, cycleEndDate)
      interest = interest + changeMoney;
      changeOrder += 1;
      await pool.execute(
        `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
        [blid, 'DONE', now.format('YYYY-MM-DD'), changeOrder, '本金生息', changeMoney, principal, interest]
      )

    } else if (afterCycle === 'principal') {
      // 本金生息，当前确认时间 离 借款时间 已经过去几个周期，利息就有多少次变化
      while (cycleEndDate.isBefore(now)) {
        changeMoney = principal * rate / 100;
        principal = principal;
        interest = interest + changeMoney;
        changeOrder += 1;

        await pool.execute(
          `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', cycleEndDate.format('YYYY-MM-DD'), changeOrder, '周期结息', changeMoney, principal, interest]
        )

        date = cycleEndDate;
        cycleEndDate = date.add(cycle, cycle2char[cycleUnit])
      }

      //最后一次算息
      changeMoney = computeInterest(principal, rate, date, cycleEndDate)
      interest = interest + changeMoney;
      changeOrder += 1;
      await pool.execute(
        `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
        VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
        [blid, 'DONE', now.format('YYYY-MM-DD'), changeOrder, '本金生息', changeMoney, principal, interest]
      )

    } else {
      // 默认还清，那到期就直接结束 借款单
      if (cycleEndDate.isBefore(now)) {
        changeMoney = principal * rate / 100;
        principal = principal;
        interest = interest + changeMoney;
        changeOrder += 1;

        await pool.execute(
          `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', cycleEndDate.format('YYYY-MM-DD'), changeOrder, '周期结息', changeMoney, principal, interest]
        )

        changeMoney = -(principal + interest);
        principal = 0;
        interest = 0;
        finalStatus = 'FINISHED'
        changeOrder += 1;

        await pool.execute(
          `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', cycleEndDate.format('YYYY-MM-DD'), changeOrder, '还钱', changeMoney, principal, interest]
        )

      } else {
        //最后一次算息
        changeMoney = computeInterest(principal, rate, date, cycleEndDate)
        interest = interest + changeMoney;
        changeOrder += 1;
        await pool.execute(
          `INSERT INTO money_change_record (blid, status, date, changeOrder, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', now.format('YYYY-MM-DD'), changeOrder, '本金生息', changeMoney, principal, interest]
        )
      }
    }

    pool.execute(
      `UPDATE borrow_loan_record SET status=?, principal=?, interest=?, 
      ${sponsor === 'loaner' ? 'debtor' : 'loaner'}=? WHERE id=?`, [finalStatus, principal, interest, openid, id]
    )

    ctx.body = { code: 0, data: 'success' }
  } else if (status === 'CREATED') {
    ctx.body = { code: 1, data: '已经有人确认了这笔借款！' }
  } else if (status === 'CLOSED') {
    ctx.body = { code: 1, data: '借款已经被关闭，请联系好友确认！' }
  } else {
    ctx.body = { code: 1, data: '借款单状态不对！' }
  }

  conn.release();
}


function computeInterest(principal, rate, startDate, cycleEndDate) {
  const cycleInterest = principal * rate / 100;

  if (startDate && cycleEndDate) {
    const now = moment()
    const diffDay2now = startDate.diff(now, 'd')
    const diffDay2CycleEnd = startDate.diff(cycleEndDate, 'd')
    return diffDay2CycleEnd === 0 ? 0 : cycleInterest * diffDay2now / diffDay2CycleEnd;
  }

  return cycleInterest;
}