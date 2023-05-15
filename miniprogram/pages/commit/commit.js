const app = getApp() // 获取全局APP对象
let that = null // 页面this指针变量

Page({
  data: {
    ulatitude: 39.0, // 用户纬度
    ulongitude: 116.0, // 用户经度
    PublicCircle: { // 公开圆（以标记点为圆心的圆），同时也是ZKRP实际所用的范围
      latitude: 39.0, // 圆心维度
      longitude: 116.0, // 圆心经度
      radius: 0.1, // 圆半径
      color: '#48D1CC', // 描边颜色
      strokeWidth: 1, // 描边宽度
      fillColor: "#e2fcfb80", // 填充颜色
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad () {
    that = this
    that.initValue()
  },
  /**
   * 接受上一页传来的值
   */
  initValue () {
    that.setData({
      ulatitude: wx.getStorageSync('ulatitude'),
      ulongitude: wx.getStorageSync('ulongitude'),
      'PublicCircle.latitude': wx.getStorageSync('clatitude'),
      'PublicCircle.longitude': wx.getStorageSync('clongitude'),
      'PublicCircle.radius': wx.getStorageSync('radius'),
    })
  }
})