const { pool } = require('./mysql')
const _ = require('lodash')

// row with loaner and debtor
async function getUsers(rows, conn = pool) {
  let openids = rows.reduce((ret, row) => {
    const openids = _.at(row, ['loaner', 'debtor'])
    ret = [...ret, ...openids]
    return ret;
  }, [])

  if (openids.length === 0) return []

  openids = [...new Set(openids)].filter(a => a !== null).map(e => "'" + e + "'").join(',')

  // ? => values, 有问题，binlog也不知道查看，先用模版字符串拼接, 这些openids都是数据库里查出来，来自微信的，应该不会有安全问题
  const [users] = await conn.execute(`SELECT * FROM wx_user WHERE openid in (${openids})`)

  return users
}

function getUserById(users, openid) {
  return users.find(a => a.openid === openid) || {}
}

module.exports = {
  getUsers, getUserById
}