const { request } = require('../../utils/pify')
const { cycleUnits, afterCycles, repaymentTypes } = require('../../utils/enums')
const app = getApp();
const today = (new Date()).format()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: '',
    today,
    cycleUnits,
    afterCycles,
    repaymentTypes,

    values: {
      loanDate: today,
      cycle: undefined,
      cycleUnit: 'y',
      repaymentDate: today,

      loanAmount: undefined,
      rate: undefined,
      repaymentAmount: undefined,

      afterCycle: 'compound',
      repaymentType: 'interestFirst'
    },

    mv: {
      afterCycle: false,
      repaymentType: false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({ type: options.type || 'borrow' })
    wx.setNavigationBarTitle({
      title: options.type === 'loan' ? '记录借出' : '记录借入'
    })
  },

  bindLoanDateChange: syncFieldToData('loanDate', computeRepaymentDate),
  bindCycleChange: syncFieldToData('cycle', computeRepaymentDate),
  bindCycleUnitChange: syncFieldToData('cycleUnit', computeRepaymentDate),

  bindLoanAmountChange: syncFieldToData('loanAmount', computeRepaymentAmount),
  bindRateChange: syncFieldToData('rate', computeRepaymentAmount),

  bindAfterCycleChange: syncFieldToData('afterCycle'),
  bindRepaymentTypeChange: syncFieldToData('repaymentType'),

  formSubmit(e) {
    const { loanDate, cycle, cycleUnit,
      loanAmount, rate, afterCycle, repaymentType
    } = this.data.values

    const sponsor = this.data.type === 'loan' ? 'loaner' : 'debtor';

    if (!cycle) {
      app.icError('请填写1～100的借贷周期，可以切换单位！')
      return
    }

    if (!loanAmount) {
      app.icError('请填写>0的借贷金额，最多两位小数！')
      return
    }

    if (!rate) {
      app.icError('请填写利率，最多两位小数！')
      return
    }

    request({
      url: '/record',
      method: 'POST',
      data: {
        loanDate, cycle, cycleUnit, loanAmount, rate, afterCycle, repaymentType, sponsor
      }
    }).then(id => {
      wx.navigateTo({
        url: `../detail/index?id=${id}`,
      })
    }).catch(err => app.icError(err.errMsg))
  },

  toggleCycleEndTips() {
    const { afterCycle } = this.data.mv;
    this.setData({
      'mv.afterCycle': !afterCycle
    })
  },

  toggleRepaymentTypeTips() {
    const { repaymentType } = this.data.mv;
    this.setData({
      'mv.repaymentType': !repaymentType
    })
  },
})


function syncFieldToData(fieldName, callback) {
  const numberFields = ["cycle", "loanAmount", "rate"]

  return function (e) {
    let value = e.detail.value;
    if (value === '') return;

    // 字符串转化为数字，同时最多保留两位小数
    numberFields.some(a => a === fieldName) && (value = parseInt(value * 100) / 100)
    if (fieldName === 'cycle' && value > 100) value = 100;

    this.setData({
      [`values.${fieldName}`]: value
    }, callback)
  }
}

function computeRepaymentDate() {
  const { loanDate, cycle, cycleUnit } = this.data.values

  if (loanDate && cycle) {
    let repaymentDate = new Date(loanDate)
    switch (cycleUnit) {
      case 'y': repaymentDate.addYears(cycle); break;
      case 'M': repaymentDate.addMonths(cycle); break;
      case 'w': repaymentDate.addWeeks(cycle); break;
      case 'd': repaymentDate.addDays(cycle); break;
      default: break;
    }

    this.setData({
      'values.repaymentDate': repaymentDate.format()
    })
  }
}

function computeRepaymentAmount() {
  const { loanAmount, rate } = this.data.values
  if (loanAmount && rate) {
    this.setData({
      'values.repaymentAmount': parseInt(loanAmount * (100 + rate)) / 100
    })
  }
}