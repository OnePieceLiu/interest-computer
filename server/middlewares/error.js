module.exports = async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    console.error(err)
    ctx.type = "json"
    ctx.body = {
      code: err.status || 500,
      errMsg: err.message || '服务器内部错误'
    }
  }
}