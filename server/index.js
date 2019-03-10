const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const fs = require('fs')
const path = require('path')
const error = require('./middlewares/error')
const session = require('./middlewares/session')
const canPost = require('./middlewares/canPost')
// const params = require('./middlewares/params')
const pagination = require('./middlewares/pagination')
const app = new Koa()

// 中间件
app.use(error)
app.use(session)
app.use(canPost)
// app.use(params)
app.use(pagination)
app.use(bodyParser())

// 路由
const router = new Router()
const files = fs.readdirSync(path.join(__dirname, 'routes'))
files.forEach(file => {
  // file example [login.js]
  const path = file.match('(.*).js$')[1];
  router.all(`/${path}`, require(`./routes/${file}`))
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(8765, () => {
  require('./utils/cronJobs/index') //启动定时任务
  console.log('app is running at port 8765!')
})