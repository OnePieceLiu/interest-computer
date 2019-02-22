// pages/test/index.js
const app = getApp();

Component({

  properties: {
    errMsg: String,
    type: String,
  },

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */

  methods: {
    onLoad: function (options) {
      console.log(this.data.type, this.data.errMsg)
    },

    throwError: function(){
      app.icError('throw error' + Math.random())
    },

    giveInfo: function(){
      app.icInfo('give info' + Math.random())
    },

    confirm: function(){
      app.icConfirm({
        title: '哈哈哈',
        content: '你欠我两千元',
        onOk: function(){
          return new Promise((resolve, reject)=>{
            resolve('不急，过两天还！')
          })
        },
        onCancel: function(){
          throw new Error('还不起了！')
        }
      }).then(data=>{
        console.log('弹窗已经关闭', data)
      }, err=>{
        console.error(err.message)
      })
    },

    confirmOk: function(){
      app.icConfirm({
        content: '没有取消的提示',
        noCancel: true
      }).then(data=>{
        console.log('弹窗已关闭')
      })
      
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
  }

})