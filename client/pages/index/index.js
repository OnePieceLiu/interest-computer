//index.js
//获取应用实例
const { uiFuns, uiData } = require('../../utils/userInfo')

Page({
  data: {
    ...uiData
  },

  ...uiFuns,

  onLoad: function () {
    this.initUserInfo()
  }
})
