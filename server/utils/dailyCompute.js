const { redis } = require('./redis.js')
const { pool } = require('./mysql')
const { IC } = require('./InterestComputer')

async function startCompute() {
  await redis.set('computing', true, 'EX', 24 * 60 * 60)    //每天都要跑定时任务，这个tag每天都刷新，一直存在

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [blInfos] = await conn.execute(`SELECT * FROM borrow_loan_record where status=?`, ['WAIT_CONFIRM'])

    for (const i = 0, len = blInfos.length; i < len; i++) {
      const blInfo = blInfos[i];
      const [mcInfos] = await conn.execute(`SELECT * FROM money_change_record where blid=? order by changeOrder desc limit 2`, [blInfo.id])

      if (mcInfos[0].event === '按天生息') {
        await IC.create({ lastRecord: mcInfos[1], blInfo, conn })
      } else {
        await IC.create({ lastRecord: mcInfos[0], blInfo, conn })
      }
    }

    await conn.commit()
    await conn.release()
  } catch (e) {
    await conn.rollback()
    await conn.release()
  }

  await redis.set('computing', false, 'EX', 24 * 60 * 60)
}