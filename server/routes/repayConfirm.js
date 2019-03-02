const { pool } = require('../utils/mysql')
const { IC } = require('../utils/InterestComputer')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx;
  const { id } = body

  const conn = await pool.getConnection()
  const [[mcInfo]] = await conn.execute(`SELECT * FROM money_change_record WHERE id=?`, [id])
  const { blid } = mcInfo
  const [[blInfo]] = await conn.execute(`SELECT * FROM borrow_loan_record WHERE id=?`, [blid])

  if (!blInfo || blInfo.loaner !== openid) {
    await conn.release()
    throw new Error('你不是该借贷单的债权人，无法确认还款！')
  } else {
    await conn.beginTransaction()
    try {
      const [[lastRecord]] = await conn.execute(
        `SELECT * FROM money_change_record WHERE blid=? AND date<=? AND status=? order by changeOrder desc limit 1`,
        [blid, mcInfo.date, 'DONE']
      )

      await conn.execute(`UPDATE money_change_record SET changeOrder=?, status=? WHERE id=?`,
        [lastRecord.changeOrder + 1, 'DONE', id]
      )

      // 获取 当前借贷单 之后已经确认的 还款记录， unshift当前确认这一条
      const [repaymentRecords] = await conn.execute(
        `SELECT * FROM money_change_record WHERE blid=? AND changeOrder>? AND status=? AND event=?`,
        [blid, lastRecord.changeOrder, 'DONE', '还钱']
      )

      await IC.create({ lastRecord, blInfo, repaymentRecords, conn })
      await conn.commit()
      await conn.release()
      ctx.body = { code: 0, data: 'success!' }
    } catch (err) {
      await conn.rollback()
      await conn.release()
      throw err
    }
  }

}