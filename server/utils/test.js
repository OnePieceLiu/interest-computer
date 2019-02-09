const { pool } = require('./mysql')

pool.query('select * from wx_user').then(([rows, fileds]) => {
  console.log('data', rows, fileds)
})