const { pool } = require("./mysql")

async function test() {
  const conn = await pool.getConnection()
  await conn.beginTransaction()

  try {
    await conn.execute(
      `INSERT INTO wx_user (openid, sessionKey, nickName, avatarUrl, gender, country, province, city) 
      VALUES(?,?,?,?,?,?,?,?)`,
      ["test", "abcd", "zpq", "http://www.zhoupengqiang.cn/123", 1, "中国", "上海", "闵行"]
    )

    await conn.execute(
      `INSERT INTO wx_user (openid, sessionKey, nickName, avatarUrl, gender, country, province, city) 
      VALUES(?,?,?,?,?,?,?,?)`,
      ["test2", "abcd2", "zpq2", "http://www.zhoupengqiang.cn/123", 1, 'china', "上海", "闵行"]
    )

    await conn.commit()
    await conn.release()

    console.log('success!!!')
  } catch (err) {
    await conn.rollback()
    await conn.release()
    console.log("catch error", err.name, err.message)
    throw err
  }
}

test().then(() => {
  console.log("test finished!")
}, () => {
  console.log(pool.pool._allConnections.length, pool.pool._freeConnections.length)
})
