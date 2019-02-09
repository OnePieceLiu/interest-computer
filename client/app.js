require('./utils/date')
const { login, request, getSetting, getUserInfo } = require('./utils/pify')

//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs);

    this.ctx = Promise.all([this.login(), getUserInfo()])
      .then(
        ([loginRes, userInfoRes]) => {
          console.log('loginRes', loginRes)
          this.globalData.sessionid = loginRes.data.sessionid
          this.globalData.userInfo = userInfoRes.userInfo
          const {nickName, avatarUrl, gender, province, city} = userInfoRes.userInfo

          request({ 
            url: '/access',
            data: { nickName, avatarUrl, gender, province, city }
          })
        }, e => {
          console.log('err', e.data)
        }
      )
  },

  // 登录
  login: function () {
    return login().then(res => {
      return request({
        url: '/login',
        data: {
          code: res.code
        }
      })
    })
  },

  globalData: {
    sessionid: '',
    userInfo: {}
  }
})