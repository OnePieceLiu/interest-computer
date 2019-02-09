const mysql = require('mysql2/promise')
const { mysqlUser, mysqlPwd, mysqlDb } = require('../config')

const pool = mysql.createPool({
  host: 'localhost',
  user: mysqlUser,
  password: mysqlPwd,
  database: mysqlDb
})

module.exports = {
  pool
}