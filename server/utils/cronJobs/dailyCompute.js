const { redis } = require('../redis.js')
const { pool } = require('../mysql')
const moment = require('moment')

async function startCompute() {
  await redis.set('computing', 'true', 'EX', 24 * 60 * 60)    //每天都要跑定时任务，这个tag每天都刷新，一直存在

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const startOfToday = moment().startOf('day')
    const [blInfos] = await conn.execute(`SELECT * FROM borrow_loan_record where status=?`, ['CREATED'])


    for (let i = 0, len = blInfos.length; i < len; i++) {
      const blInfo = blInfos[i];
      const { loanDate, cycle, cycleUnit, rate, afterCycle } = blInfo;

      // 获取当前周期的天数，今天是否是周期结束日
      const cycleNumber = startOfToday.diff(moment(loanDate), cycleUnit) / cycle | 0;
      let cycleEndDate = moment(loanDate).add(cycleNumber * cycle, cycleUnit)
      const isEnd = startOfToday.isSame(cycleEndDate, 'd')
      let cycleStartDate, periodDays;
      if (isEnd) {
        cycleStartDate = moment(cycleEndDate).add(-1 * cycle, cycleUnit)
        periodDays = cycleEndDate.diff(cycleStartDate, 'd')
      } else {
        cycleStartDate = cycleEndDate;
        cycleEndDate = moment(cycleEndDate).add(1 * cycle, cycleUnit)
        periodDays = cycleEndDate.diff(cycleStartDate, 'd')
      }
      //----- periodDays, isEnd ----------//

      // 每天凌晨结算利息的时候，不应该有date >= today 的 money_change_record, 这里去 = ，防止重算当天已有还款记录。
      const [mcInfos] = await conn.execute(
        `SELECT * FROM money_change_record where blid=? AND status=? AND date<=? order by changeOrder desc limit 2`,
        [blInfo.id, 'DONE', startOfToday.format('YYYY-MM-DD')]
      )

      if (moment(mcInfos[0].date).isSame(startOfToday, 'd')) {
        // 啥也不做，金额变动记录中，有今天的记录，说明已经 计过息了
        console.log(`blInfo ${blInfo.id} daily compute ,but lastest mcInfo happens today, id is ${mcInfos[0].id}`)
      } else if (mcInfos[0].event === '按天生息') { // 昨天只发生了生息行为

        // 获取当前周期的天数，mcInfos[1]作为lastRecord, 计算到今天的利息。 根据afterCycle，今天是不是周期末，决定event。 更新 mcInfos[0]
        let { principal, interest, date } = mcInfos[1]
        const changeMoney = computeInterest({ principal, rate, periodDays, startDate: date, endDate: startOfToday })

        let event = '按天生息'
        if (isEnd) {
          if (afterCycle === 'compound') {
            event = '周期结息转本金'
            principal = Number(principal) + Number(changeMoney) + Number(interest);
            interest = 0;
          } else {
            event = '周期结息';
            interest = Number(interest) + Number(changeMoney);
          }
        } else {
          event = '按天生息';
          interest = Number(interest) + Number(changeMoney);
        }

        await conn.execute(
          `UPDATE money_change_record SET date=?, event=?, changeMoney=?, principal=?, interest=? WHERE id=?`,
          [startOfToday.format('YYYY-MM-DD'), event, changeMoney, principal, interest, mcInfos[0].id]
        )

        await conn.execute(
          `UPDATE borrow_loan_record SET principal=?, interest=? WHERE id=?`,
          [principal, interest, blInfo.id]
        )

      } else {  // 昨天有还款，结息之类的场景

        // 获取当前周期的天数，mcInfos[0]作为lastRecord, 计算到今天的利息。 根据afterCycle，今天是不是周期末，决定event。 插入 mcInfo
        let { blid, changeOrder, principal, interest, date } = mcInfos[0]
        const changeMoney = computeInterest({ principal, rate, periodDays, startDate: date, endDate: startOfToday })

        let event = '按天生息'
        if (isEnd) {
          if (afterCycle === 'compound') {
            event = '周期结息转本金'
            principal = Number(principal) + Number(changeMoney) + Number(interest);
            interest = 0;
          } else {
            event = '周期结息';
            interest = Number(interest) + Number(changeMoney);
          }
        } else {
          event = '按天生息';
          interest = Number(interest) + Number(changeMoney);
        }

        await conn.execute(
          `INSERT INTO money_change_record (blid, status, changeOrder, date, event, changeMoney, principal, interest) 
          VALUES(?, ?, ?, ?, ?, ?, ?, ?);`,
          [blid, 'DONE', changeOrder + 1, startOfToday.format('YYYY-MM-DD'), event, changeMoney, principal, interest]
        )

        await conn.execute(
          `UPDATE borrow_loan_record SET principal=?, interest=? WHERE id=?`,
          [principal, interest, blInfo.id]
        )
      }
    }

    await conn.commit()
    await conn.release()
  } catch (e) {
    console.log(e)
    await conn.rollback()
    await conn.release()
  }

  await redis.set('computing', 'false', 'EX', 24 * 60 * 60)
}

function computeInterest({ principal, rate, startDate, periodDays, endDate }) {
  console.log(startDate, endDate, periodDays)

  const interestStartDate = moment(startDate)
  const interestEndDate = moment(endDate)

  console.log(interestStartDate, interestEndDate);

  const interestDays = interestEndDate.diff(interestStartDate, 'd')
  const cycleInterest = principal * rate / 100;

  return cycleInterest * interestDays / periodDays;
}

module.exports = {
  startCompute
}
