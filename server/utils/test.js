const { pool } = require("./mysql")
const moment = require('moment')

async function test() {
  const [res] = await pool.execute('INSERT INTO test (tdatetime, ttimestamp) VALUES(?,?)',
    ['2017-10-10 00:00:00', '2017-10-10 00:00:00'])

  const [[testInfo]] = await pool.execute(`SELECT * FROM test where id=?`, [res.insertId])

  console.log(moment(testInfo.tdatetime).format('YYYY-MM-DD HH:mm:ss'), moment(testInfo.ttimestamp).format('YYYY-MM-DD HH:mm:ss'))
  console.log(testInfo.tdatetime, testInfo.ttimestamp)

}

// test().then(data => {
//   console.log('test finished!', moment('2017-10-10 00:00:00').format('YYYY-MM-DD HH:mm:ss'))
// }, () => {
//   console.log(pool.pool._allConnections.length, pool.pool._freeConnections.length)
// })

var a = moment()
var b = moment(a).startOf('day')
var c = moment(a).endOf('day')

console.log(a, b, c)