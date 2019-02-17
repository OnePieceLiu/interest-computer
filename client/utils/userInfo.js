const app = getApp()

const uiFuns = {
  initUserInfo: function () {
    console.log('init user info', this.data.hasUserInfo)
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    }
  },

  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })

    app.loginP.then(() => app.recordAccess())
  }
}

const uiData = {
  userInfo: {},
  hasUserInfo: false
}


module.exports = {
  uiFuns, uiData
}