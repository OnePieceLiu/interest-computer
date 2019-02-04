const pify = function (api) {
  return function (options = {}) {
    const { fail, success, complete, ...rest } = options

    let status = 'pending'
    return new Promise((resolve, reject) => {
      wx[api]({
        ...rest,

        // 有complete, 那么complete之后改变promise状态；
        // 无complete, fail或者success改变promise状态；
        fail: res => {
          fail && fail(res);
          complete ? (status = 'reject') : reject(res);
        },
        success: res => {
          success && success(res);
          complete ? (status = 'resolve') : resolve(res);
        },
        complete: res => {
          complete && complete(res)
          status === 'reject' ? reject(res) : resolve(res)
        }
      })
    })
  }
}

const request = function (options) {
  const { header = {} } = options
  const sessionid = getApp().globalData.sessionid
  if (sessionid) {
    header.sessionid = sessionid
  }

  return pify('request')(Object.assign({}, options, header)).then(res => {
    if (res.statusCode !== 200 || res.data.code !== 0) {
      throw res
    } else {
      return res
    }
  })
}

module.exports = {
  request,
  login: pify('login'),
  getSetting: pify('getSetting'),
  getUserInfo: pify('getUserInfo')
}