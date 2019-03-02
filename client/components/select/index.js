// components/select/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    options: Array,
    value: {
      type: null,
      observer: function(newV, oldV){
        const opt = this.properties.options.find(a=>a.value == newV) || {}
        this.setData({
          valueName: opt.name || ''
        })
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    valueName: '',
    expand: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChange(e){
      console.log(e.target.dataset)
      this.triggerEvent('change', e.target.dataset)
    },

    onBlur(e){
      console.log('on blur', e);
    },

    toggleExpand(){
      const {expand} = this.data;
      this.setData({
        expand: !expand
      })
    }
  }
})
