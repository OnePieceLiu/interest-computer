const { pool } = require('./mysql')

pool.query('select * from wx_user where openid=1241').then(([rows, fileds]) => {
  console.log('data', rows)
})

// const moment = require('moment')

// const date1 = moment('1999-12-31')

// const date2 = moment('2000-01-01');

// console.log(date2.diff(date1, 'd'))