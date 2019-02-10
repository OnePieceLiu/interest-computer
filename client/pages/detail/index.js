const { request } = require('../../utils/pify')
const { cycleUnits, afterCycles, repaymentTypes, getEnumName } = require('../../utils/enums')
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    errMsg: '',
    record: {},
    defaultAvatar: '../../images/profile.jpeg'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id = 1 } = options

    this.setData({ id })
    app.ctx.then(() => request({
      url: '/record',
      data: { id }
    })).then(({ data }) => {
      const record = data.data;
      record.cycleUnit = getEnumName(cycleUnits, record.cycleUnit)
      record.afterCycle = getEnumName(afterCycles, record.afterCycle)
      record.repaymentType = getEnumName(repaymentTypes, record.repaymentType)

      this.setData({ record })
    }).catch(({ data }) => {
      const errMsg = data.errMsg;
      this.setData({ errMsg })
    })
  },

  closeRecord: function () {
    request({
      url: '/close',
      data: { id: this.data.id },
      method: 'POST'
    })
  },

  confirmRecord: function () {
    request({
      url: '/confirm',
      data: {
        id: this.data.id,
        viewer: this.data.record.viewer
      },
      method: 'POST'
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    const { record } = this.data
    const { id, status, sponsor, viewer } = record
    let title = '借贷详情'

    if (id) {
      if (status === 'WAIT_CONFIRM') {
        if (sponsor === 'loaner') {
          title = viewer === 'loaner'
            ? `${app.globalData.userInfo.nickName}借给了你一笔钱，请你确认！`
            : `不是你创建的借出记录，请不要随意转发！`;
        } else if (sponsor === 'debtor') {
          title = viewer === 'debtor'
            ? `${app.globalData.userInfo.nickName}向你借了一笔钱，请你确认！`
            : `不是你创建的借入记录，请不要随意转发！`
        }
      }
    }

    return { title }
  }
})