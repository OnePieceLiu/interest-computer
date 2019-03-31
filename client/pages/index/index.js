const { request } = require('../../utils/pify')

Page({
  data: {
    url: '',
  },

  onLoad: function () {
    request({
      url: '/getAssets',
      data: { code: 'WECHAT_GROUP' }
    }).then(data => {
      console.log('data')
      this.setData({ url: data })
    })
  },
})
