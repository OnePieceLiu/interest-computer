const { pool } = require('../utils/mysql')
const { IC } = require('../utils/InterestComputer')

module.exports = async (ctx, next) => {
  const { request: { body }, openid } = ctx;
  const { id } = body

  const conn = await pool.getConnection()
  const [[mcInfo]] = await conn.execute(`SELECT blid, date FROM money_change_record WHERE id=?`, [id])
  const { blid } = mcInfo
  const [[blInfo]] = await conn.execute(`SELECT loaner, repaymentType FROM borrow_loan_record WHERE id=?`, [blid])

  if (blInfo || blInfo.loaner !== openid) {
    conn.release()
    ctx.body = { code: 1, data: '你不是该借贷单的债权人，无法确认还款！' }
  } else {
    // 获取 当前借贷单 之后已经确认的 还款记录， unshift当前确认这一条
    const [repaymentRecords] = await conn.execute(
      `SELECT * FROM money_change_record WHERE blid=? AND date>? AND status=? AND event=?`,
      [blid, mcInfo.date, 'DONE', '还钱']
    )
    repaymentRecords.unshift(mcInfo)

    const lastRecord = await conn.execute(
      `SELECT * FROM money_change_record WHERE blid=? AND date<=? AND status=? order by changeOrder desc limit 1`,
      [blid, mcInfo.date, 'DONE']
    )

    conn.release()

    await IC.create(lastRecord, blInfo, repaymentRecords)

    ctx.body = { code: 0, data: 'success!' }
  }

}