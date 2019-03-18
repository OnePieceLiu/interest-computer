const { pool } = require('../utils/mysql')

async function compute() {
  const conn = await pool.getConnection()
  await conn.beginTransaction()

  try {
    const [rows] = await conn.execute(`SELECT * FROM borrow_loan_record`)
    console.log('before', rows)

    for (let i = 0, len = rows.length; i < len; i++) {
      const row = rows[i]
      let { id, cycle, cycleUnit, rate, afterCycle } = row
      rate = Number(rate);

      let yearAmount = 0
      let yearRate = 0
      switch (cycleUnit) {
        case 'y': yearAmount = cycle; break;
        case 'M': yearAmount = cycle / 12; break;
        case 'w': yearAmount = cycle / 52; break;
        case 'd': yearAmount = cycle / 365; break;
        default: break;
      }

      if (afterCycle === 'principal') {
        yearRate = rate / yearAmount
      } else {
        // 复利和默认还清都是算复利
        yearRate = (Math.pow(1 + rate / 100, 1 / yearAmount) - 1) * 100
      }

      await conn.execute(`UPDATE borrow_loan_record SET yearRate=? where id=?`, [yearRate, id])
    }

    await conn.commit()
    await conn.release()
  } catch (e) {
    await conn.rollback()
    await conn.release()  //其实release是一个同步函数
    throw err
  }
}

compute().then(async () => {
  const [rows] = await pool.execute(`SELECT * FROM borrow_loan_record`)
  console.log('after', rows)
})