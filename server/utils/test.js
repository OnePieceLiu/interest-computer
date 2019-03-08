// const { pool } = require("./mysql")
const moment = require('moment')

// async function test() {
//   const [res] = await pool.execute('INSERT INTO test (tdatetime, ttimestamp) VALUES(?,?)',
//     ['2017-10-10 00:00:00', '2017-10-10 00:00:00'])

//   const [[testInfo]] = await pool.execute(`SELECT * FROM test where id=?`, [res.insertId])

//   console.log(moment(testInfo.tdatetime).format('YYYY-MM-DD HH:mm:ss'), moment(testInfo.ttimestamp).format('YYYY-MM-DD HH:mm:ss'))
//   console.log(testInfo.tdatetime, testInfo.ttimestamp)

// }

// test().then(data => {
//   console.log('test finished!', moment('2017-10-10 00:00:00').format('YYYY-MM-DD HH:mm:ss'))
// }, () => {
//   console.log(pool.pool._allConnections.length, pool.pool._freeConnections.length)
// })


// const startOfToday = moment().startOf('day')

// const loanDate = '2019-02-03'
// const cycle = 1
// const cycleUnit = 'M'

// const cycleNumber = startOfToday.diff(moment(loanDate), cycleUnit);
// let cycleEndDate = moment(loanDate).add(cycleNumber * cycle, cycleUnit)
// const isEnd = startOfToday.isSame(cycleEndDate, 'd')
// let cycleStartDate, periodDays;
// if (isEnd) {
//   cycleStartDate = moment(cycleEndDate).add(-1 * cycle, cycleUnit)
//   periodDays = cycleEndDate.diff(cycleStartDate, 'd')
// } else {
//   cycleStartDate = cycleEndDate;
//   cycleEndDate = moment(cycleEndDate).add(1 * cycle, cycleUnit)
//   periodDays = cycleEndDate.diff(cycleStartDate, 'd')
// }

// console.log(startOfToday)
// console.log(cycleNumber)
// console.log(isEnd)
// console.log(cycleStartDate)
// console.log(cycleEndDate)
// console.log(periodDays)

// console.log(a, b, c)

// const _ = require('lodash')

// var a = { a: 1, b: 2, c: 3 }

// console.log(_.at(a, ['a', 'c']))

// const { nFormatter } = require('./nFormatter')

// const a = nFormatter(Number('0.00') + Number('0.00'))
// console.log(a)


function computeInterest({ principal, rate, startDate, periodDays, endDate }) {
  console.log(startDate, endDate, periodDays)

  const interestStartDate = moment(startDate)
  const interestEndDate = moment(endDate)

  console.log(interestStartDate, interestEndDate);
  const interestDays = interestEndDate.diff(interestStartDate, 'd')
  const cycleInterest = principal * rate / 100;

  return cycleInterest * interestDays / periodDays;
}

const interest = computeInterest({
  principal: 500000,
  rate: 8.8,
  startDate: '2016-03-06',
  endDate: '2019-03-05',
  periodDays: moment('2019-03-06').diff(moment('2016-03-06'), 'd')
})

console.log('interest', interest)


// console.log(moment(moment().format('YYYY-MM-DD')), moment().startOf('day'))