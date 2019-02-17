require('./utils/date')
const { login, request, getSetting, getUserInfo } = require('./utils/pify')

//app.js
App({
  onLaunch: function () {
    this.loginP = this.login();
    this.userInfoP = this.getUserInfo()

    Promise.all([this.loginP, this.userInfoP])
      .then(() => this.recordAccess(), err => console.log('err', err))
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
    }).then(res => {
      this.globalData.sessionid = res.data.sessionid
    })
  },

  // 获取用户信息，可能没有去获取，就resolve了
  getUserInfo: function () {
    return getSetting().then(res => {
      if (res.authSetting['scope.userInfo']) {
        return getUserInfo({ lang: 'zh_CN' }).then(res => {
          this.globalData.userInfo = res.userInfo;

          if (this.userInfoReadyCallback) {
            this.userInfoReadyCallback(res)
          }
        });
      }
    })
  },

  // 记录访问，如果没有获取到用户信息，调用什么都不会执行。
  recordAccess: function () {
    const { userInfo } = this.globalData
    if (userInfo && userInfo.nickName) {
      request({
        url: '/access',
        data: userInfo
      })
    }
  },

  globalData: {
    sessionid: '',
    userInfo: null
  }
})