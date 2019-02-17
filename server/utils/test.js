const { pool } = require('./mysql')
const moment = require('moment');

const ts = 1550372451047
const a = moment(ts).format('YYYY-MM-DD HH:mm:ss.SSS')
console.log(a);

// pool.execute('select * from borrow_loan_record where createTime<?', [a])
pool.execute('select * from money_change_record')
  .then(([rows, fileds]) => {
    console.log('data', typeof rows[0].principal)
  })

// const moment = require('moment')

// const date1 = moment('1999-12-31')

// const date2 = moment('2000-01-01');

// console.log(date2.diff(date1, 'd'))