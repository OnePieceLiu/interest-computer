const app = getApp();

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
    id: 0,
    limit: 5,
    showTime: 3000,
    msgs: [
      // {id: 0, level: 'info', msg: 'abd gwer sfdsg sdfg etwer wert wert wtetr wertr'}
    ]
  },

  created: function(){
    app.icInfo = (msg)=>this.shift('info', msg)
    app.icError = (msg)=>this.shift('error', msg)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    shift(level, msg){
      let { msgs, id, showTime, limit } = this.data;
      const newMsg = {
        id: ++id,
        level,
        msg,
        timer: setTimeout(()=>this.pop(), showTime)
      };

      const newMsgs = [newMsg, ...msgs];
      while(newMsgs.length > limit){
        const oldest = newMsg.pop()
        clearTimeout(oldest.timer)
      }

      this.setData({
        id,
        msgs: newMsgs
      })
    },

    pop(){
      const {msgs} = this.data;
      const msgsLeft = msgs.slice(0, -1);
      this.setData({msgs: msgsLeft})
    }
  }
})
