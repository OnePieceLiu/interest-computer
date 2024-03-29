const { request } = require('../../utils/pify')
const { cycleUnits, afterCycles, repaymentTypes, blStatus, getEnumName } = require('../../utils/enums')
const app = getApp()
const today = (new Date()).format()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    errMsg: '',
    repayModal: false,
    moneyChanges: {
      done: [],
      todo: []
    },
    blInfo: {},

    today: today,
    values: {
      date: today,
      amount: undefined
    }
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id = 29 } = options
    this.setData({ id }, () => this.getBlInfo())
  },

  getBlInfo() {
    app.loginP.then(() => request({
      url: '/detail',
      data: { id: this.data.id }
    }))
      .then(blInfo => {
        blInfo.cycleUnit = getEnumName(cycleUnits, blInfo.cycleUnit)
        blInfo.afterCycle = getEnumName(afterCycles, blInfo.afterCycle)
        blInfo.repaymentType = getEnumName(repaymentTypes, blInfo.repaymentType)
        blInfo.statusZh = getEnumName(blStatus, blInfo.status)

        this.setData({ blInfo }, () => this.getMoneyChanges())
      }, ({ errMsg }) => {
        this.setData({ errMsg })
      })
  },

  getMoneyChanges() {
    const { blInfo } = this.data;
    if (blInfo.status !== 'WAIT_CONFIRM') {
      request({
        url: '/moneyChanges',
        data: { blid: blInfo.id }
      }).then(data => {
        const done = data.done.map(e => {
          e.date = e.date.slice(0, 10)
          return e;
        })
        const todo = data.todo.map(e => {
          e.date = e.date.slice(0, 10)
          return e;
        })
        this.setData({ moneyChanges: { done, todo } })
      })
    }
  },

  closeRecord: function () {
    request({
      url: '/close',
      data: { id: this.data.id },
      method: 'POST'
    }).then(() => this.getBlInfo())
  },

  confirmRecord: function () {
    request({
      url: '/confirm',
      data: {
        id: this.data.id,
        viewer: this.data.blInfo.viewer
      },
      method: 'POST'
    }).then(() => this.getBlInfo())
  },

  toggleRepayModal: function () {
    this.setData({
      repayModal: !this.data.repayModal
    })
  },

  bindDateChange: syncFieldToData('date'),
  bindAmountChange: syncFieldToData('amount'),

  repay: function () {
    const blid = this.data.id;
    const { date, amount } = this.data.values;

    if (!amount) {
      wx.showToast({ title: '还款金额必须大于0', icon: 'none' })
      return
    }

    return request({
      url: '/repay',
      data: { blid, date, amount },
      method: 'POST'
    }).then(() => {
      this.getMoneyChanges()
      this.toggleRepayModal()
    })
  },

  repayClose: function (e) {
    const { id } = e.detail
    request({
      url: '/repayClose',
      data: { id },
      method: 'POST'
    }).then(() => this.getMoneyChanges())
  },

  repayConfirm: function (e) {
    const { id } = e.detail
    return request({
      url: '/repayConfirm',
      data: { id },
      method: 'POST'
    }).then(() => this.getBlInfo())
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    const { blInfo } = this.data
    const { id, status, sponsor, viewer } = blInfo
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

    return {
      title,
      success: function (e) {
        console.log('abc', e)
        wx.redirectTo({
          url: '/pages/index/index'
        })
      },
      fail: function (e) {
        wx.showToast({
          title: '分享失败，请检查网络！',
          icon: 'none'
        })
      }
    }
  }
})



function syncFieldToData(fieldName, callback) {
  const numberFields = ["amount"]

  return function (e) {
    let value = e.detail.value;
    if (value === '') return;
    // 字符串转化为数字，同时最多保留两位小数
    numberFields.some(a => a === fieldName) && (value = parseInt(value * 100) / 100)

    this.setData({
      [`values.${fieldName}`]: value
    }, callback)
  }
}