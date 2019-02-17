
module.exports = async (ctx, next) => {
  const { method, url, path, search, query, request: { body }, openid } = ctx

  // console.log('method', method)
  // console.log('url', url)
  // console.log('path', path)
  // console.log('search', search);
  // console.log('query', query)
  // console.log('body', body)
  // console.log('openid', openid)

  await next()
}