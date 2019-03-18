// pages/detail/components/repayItem/index.js
const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item: Object,
    viewer: String
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    repayConfirm(e){
      const { date, changeMoney, id} = this.data.item;
      const amount = Math.abs(changeMoney.replace(',', ''))
      wx.showModal({
        title: '提示',
        content: '确定于' + date + '收到对方的还款' + amount + '元吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('confirm', { id })
          }
        }
      })
    },
    repayClose(e){
      const { date, changeMoney, id } = this.data.item;
      const amount = Math.abs(changeMoney.replace(',', ''))
      wx.showModal({
        title: '提示',
        content: '确定' + date + '还款' + amount + '元有误，需要关闭吗？',
        success: (res)=>{
          if (res.confirm) {
            this.triggerEvent('close', { id })
          }
        }
      })
    },
    unformat(str){
      return Math.abs(str.replace(',', ''))
    }
  }
})
