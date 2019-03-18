require('./utils/date')
const { login, request, getSetting, getUserInfo } = require('./utils/pify')

//app.js
App({
  onLaunch: function () {
    this.checkUpdate();
    this.loginP = this.login();
    this.userInfoP = this.getUserInfo()

    Promise.all([this.loginP, this.userInfoP])
      .then(() => this.recordAccess())
  },

  checkUpdate: function () {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log(res.hasUpdate)
    })

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败',
        showCancel: false
      });
    })
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
    }).then(sessionid => {
      this.globalData.sessionid = sessionid
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