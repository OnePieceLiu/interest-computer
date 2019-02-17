const { request } = require('../../utils/pify')
const { cycleUnits, afterCycles, repaymentTypes, getEnumName } = require('../../utils/enums')
const { uiFuns, uiData } = require('../../utils/userInfo')
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
      done: undefined,
      todo: undefined
    },
    blInfo: {},
    defaultAvatar: '../../images/profile.jpeg',

    today: today,
    values: {
      date: today,
      amount: 0
    },

    ...uiData
  },

  ...uiFuns,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initUserInfo();

    const { id = 1 } = options

    this.setData({ id })
    app.loginP.then(() => request({
      url: '/record',
      data: { id }
    })).then(({ data }) => {
      const blInfo = data.data;
      blInfo.cycleUnit = getEnumName(cycleUnits, blInfo.cycleUnit)
      blInfo.afterCycle = getEnumName(afterCycles, blInfo.afterCycle)
      blInfo.repaymentType = getEnumName(repaymentTypes, blInfo.repaymentType)

      this.setData({ blInfo })

      if (blInfo.status !== 'WAIT_CONFIRM') {
        return request({
          url: '/moneyChanges',
          data: { blid: blInfo.id }
        })
      } else {
        return { data: undefined }
      }
    }).then(({ data }) => {
      if (data) {
        this.setData({ moneyChanges: data.data })
      }
    }).catch(({ data }) => {
      const errMsg = data.errMsg ? data.errMsg : data;
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
        viewer: this.data.blInfo.viewer
      },
      method: 'POST'
    })
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
    this.toggleRepayModal();
    console.log(blid, date, amount);
    if (amount <= 0) {
      console.error('wrong amount!')
      return
    }
    // return request({
    //   url: '/repay',
    //   data: {blid, date, amount},
    //   method: 'POST'
    // })
  },

  repayConfirm: function (e) {
    console.log('repayConfirm', e.target.dataset)
    // return request({
    //   url: '/repayConfirm',
    //   data: {id},
    //   method: 'POST'
    // })
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

    return { title }
  }
})



function syncFieldToData(fieldName, callback) {
  const numberFields = ["amount"]

  return function (e) {
    let value = e.detail.value;
    // 字符串转化为数字，同时最多保留两位小数
    numberFields.some(a => a === fieldName) && (value = parseInt(value * 100) / 100)

    this.setData({
      [`values.${fieldName}`]: value
    }, callback)
  }
}