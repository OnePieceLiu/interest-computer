const { uiData, uiFuns } = require('../../utils/userInfo.js')
const { request } = require('../../utils/pify.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: 'borrow',
    borrowList: {
      offset: 0,
      limit: 10,
      end: false,
      data: []
    },
    loanList: {
      offset: 0,
      limit: 10,
      end: false,
      data: []
    },
    ...uiData
  },

  ...uiFuns,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initUserInfo()
    this.getPageData()
  },

  getPageData: function () {
    const { type } = this.data;
    const { offset, limit, end, data: oldData } = this.data[`${type}List`]
    if (end) return;

    request({
      url: '/borrowLoans',
      data: { type, offset, limit }
    }).then(({ data }) => {
      const list = data.data;

      this.setData({
        [`${type}List`]: {
          offset: offset + list.length,
          limit,
          end: list.length < limit,
          data: oldData.concat(list)
        }
      })
    })
  },

  resetPageMeta: function (type) {
    this.setData({
      type,
      [`${type}List`]: {
        offset: 0,
        limit: 10,
        end: false,
        data: []
      }
    })
  },

  selectTab(e) {
    const { type } = e.target.dataset;
    this.resetPageMeta(type)
    this.getPageData()
  },

  onReachBottom() {
    this.getPageData()
  }
})