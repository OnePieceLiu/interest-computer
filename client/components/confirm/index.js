// components/confirm/index.js
const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    show: false,
    noCancel: false,
    title: '友情提示',
    content: '确定对方已经还款36000元吗？确定后无法再更改！'
  },

  created: function(){
    app.icConfirm = (option) => this.createConfirm(option)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    createConfirm({
      title = "友情提示",
      content,
      onOk,
      onCancel,
      noCancel
    }){
      return new Promise((resolve, reject)=>{
        this.okHandler = () => {
          this.setData({show: false})
          resolve(typeof onOk === 'function' && onOk())
        }

        this.cancelHandler = ()=>{
          this.setData({ show: false })
          resolve(typeof onCancel === 'function' && onCancel())
        }

        this.setData({
          show: true,
          title,
          content,
          noCancel: !!noCancel
        })
      })
    },

    okHandler(){
      this.setData({show: false})
    },

    cancelHandler() {
      this.setData({ show: false })
    }
  }
})
