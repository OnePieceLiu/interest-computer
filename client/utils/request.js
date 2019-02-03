module.exports = function(options){
  let {fail, success, withSession, header, ...rest} = options

  if(withSession){
    header.sessionid = getApp().globalData.sessionid
  }

  return new Promise((resolve, reject)=>{
    wx.request({
      ...rest,
      header,
      fail: res=>{
        fail && fail(res);
        reject(res)
      },
      success: res=>{
        // 业务正常，请用code === 0
        if (res.statusCode === 200 && res.data.code === 0) {
          success && success(res);
          resolve(res.data)
        }else{
          fail && fail(res);
          reject(res)
        }
      }
    })
  })
}