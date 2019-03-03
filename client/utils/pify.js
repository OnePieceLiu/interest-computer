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
  if (options.url.startsWith('/')) {
    // options.url = `https://tencent.zhoupengqiang.cn${options.url}`
    options.url = `http://192.168.1.5:8765${options.url}`
  }

  const { header = {} } = options
  const app = getApp()
  const sessionid = app.globalData.sessionid
  if (sessionid) {
    header.sessionid = sessionid
  }

  return pify('request')(Object.assign({}, options, { header })).then(res => {
    if (res.statusCode !== 200) {
      throw { errMsg: res.data }
    } else if (res.data.code !== 0) {
      throw { errMsg: res.data.errMsg }
    } else {
      return res.data.data
    }
  }).catch(err => {
    app.icError(err.errMsg)
    throw err;
  })
}

module.exports = {
  request,
  login: pify('login'),
  getSetting: pify('getSetting'),
  getUserInfo: pify('getUserInfo')
}