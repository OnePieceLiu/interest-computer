const { request } = require('../../utils/pify')
const { cycleUnits, afterCycles, repaymentTypes } = require('../../utils/enums')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: '',

    cycleUnits,
    afterCycles,
    repaymentTypes,
    values: {
      loanDate: (new Date()).format(),
      cycle: 0,
      cycleUnit: 0,
      repaymentDate: (new Date()).format(),

      loanAmount: 0,
      rate: 0,
      repaymentAmount: 0,

      afterCycle: 'compound',
      repaymentType: 'interestFirst'
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({ type: options.type })
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

    if (!loanDate || !cycle || typeof cycleUnit === 'undefined' || !loanAmount
      || !rate || !afterCycle || !repaymentType) {
      console.log('填写不合格，请仔细检查表单输入！')
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
    })
  }
})


function syncFieldToData(fieldName, callback) {
  const numberFields = ["cycle", "cycleUnit", "loanAmount", "rate"]

  return function (e) {
    let value = e.detail.value;
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
  console.log('cycle', cycle, typeof cycle)
  console.log('cycleUnit', cycleUnit, typeof cycleUnit)

  if (loanDate && cycle) {
    let repaymentDate = new Date(loanDate)
    switch (cycleUnit) {
      case 0: repaymentDate.addYears(cycle); break;
      case 1: repaymentDate.addMonths(cycle); break;
      case 2: repaymentDate.addWeeks(cycle); break;
      case 3: repaymentDate.addDays(cycle); break;
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