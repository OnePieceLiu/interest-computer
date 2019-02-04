function request(options){
  let {fail, success, complete, header = {}, ...rest} = options

  const sessionid = getApp().globalData.sessionid
  if(sessionid){
    header.sessionid = sessionid
  }

  let status = 'pending'

  return new Promise((resolve, reject)=>{
    wx.request({
      ...rest,
      header,

      // 有complete, 那么complete之后改变promise状态；
      // 无complete, fail或者success改变promise状态；
      fail: res=>{
        fail && fail(res);
        complete ? (status = 'reject') : reject(res);
      },
      success: res=>{
        // 业务正常，请用code === 0
        if (res.statusCode === 200 && res.data.code === 0) {
          success && success(res);
          complete ? (status = 'resolve') : resolve(res);
        }else{
          fail && fail(res);
          complete ? (status = 'reject') : reject(res);
        }
      },
      complete: res=>{
        complete && complete(res)
        status === 'reject' ? reject(res) : resolve(res)
      }
    })
  })
}

module.exports = {request}