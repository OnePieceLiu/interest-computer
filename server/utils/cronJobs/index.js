const CronJob = require("cron").CronJob;
const fs = require('fs')
const path = require('path')
const { startCompute } = require('./dailyCompute')

console.log('start cron job: daily compute at 00:00:00');
new CronJob("0 0 0 * * *", function () {
  startCompute().then(() => {
    const now = (new Date()).toLocaleString()
    const info = `daily compute end at ${now}`
    fs.writeFileSync(path.join(__dirname, 'log'), info)
  }, err => {
    fs.writeFileSync(path.join(__dirname, 'log'), err.message)
  })
}, null, true, 'Asia/Shanghai')