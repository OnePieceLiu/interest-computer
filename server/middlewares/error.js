module.exports = async function (ctx, next) {
  const { method, path, query, request: { body } } = ctx
  try {
    await next();
  } catch (err) {
    console.error(method, path, query, body, err)
    ctx.type = "json"
    ctx.body = {
      code: err.status || 500,
      errMsg: err.message || '服务器内部错误'
    }
  }
}