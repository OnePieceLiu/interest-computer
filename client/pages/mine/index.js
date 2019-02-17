const { uiData, uiFuns } = require('../../utils/userInfo.js')
const { request } = require('../../utils/pify.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    borrowList: [],
    loanList: [],
    ...uiData
  },

  ...uiFuns,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initUserInfo()

    request({
      url: '/borrowLoans',
      data: { type: 'borrow' }
    }).then(({ data }) => {
      this.setData({
        borrowList: data.data
      })
    })
  }
})