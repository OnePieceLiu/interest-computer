// pages/detail/components/changeItem/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    item: Object,
    date: String
  },

  /**
   * 组件的初始数据
   */
  data: {
    collapse: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleCollapse: function(){
      const {collapse} = this.data
      this.setData({
        collapse: !collapse
      })
    }
  }
})
