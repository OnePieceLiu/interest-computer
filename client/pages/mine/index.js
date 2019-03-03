const { request } = require('../../utils/pify.js')
const { blStatus, getEnumName } = require("../../utils/enums.js")
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    type: 'borrow',
    status: 'CREATED',
    statusOpts: [{name: '全部', value: ''}].concat(blStatus),
    list: {
      offset: 0,
      limit: 10,
      end: false,
      data: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log('onLoad');
    this.getPageData()
  },

  onShow: function(){
    // console.log('onShow');
  },

  getPageData: function () {
    const { type, status } = this.data;
    const { offset, limit, end, data: oldData } = this.data.list
    if (end) return;

    return request({
      url: '/borrowLoans',
      data: { type, status, offset, limit }
    }).then(data => {
      const list = data.map(e => {
        e.statusZh = getEnumName(blStatus, e.status)
        return e;
      });

      this.setData({
        list: {
          offset: offset + list.length,
          limit,
          end: list.length < limit,
          data: oldData.concat(list)
        }
      })
    })
  },

  selectTab(e) {
    const { type } = e.target.dataset;
    this.setData({
      type,
      list:{
        offset: 0,
        limit: 10,
        end: false,
        data: []
      }
    }, ()=>this.getPageData())
  },

  changeStatus(e){
    const {value} = e.detail
    this.setData({
      status: value,
      list: {
        offset: 0,
        limit: 10,
        end: false,
        data: []
      }
    }, () => this.getPageData())
  },

  onPullDownRefresh(){
    this.setData({
      list: {
        offset: 0,
        limit: 10,
        end: false,
        data: []
      }
    }, () => {
      this.getPageData().then(()=>{
        wx.stopPullDownRefresh()
      })
    })
  },

  onReachBottom() {
    this.getPageData()
  }
})