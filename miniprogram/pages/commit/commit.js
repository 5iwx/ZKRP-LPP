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
    userInfo: null,
    socketStatus: 'closed',  // 标识是否开启socket
    socketMsgQueue: [] // 发送的数据，也可以是其他形式
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
  },
  // 打开socket信道
  openSocket() {
    // 注意：通过 WebSocket 连接发送数据。需要先 wx.connectSocket，并在 wx.onSocketOpen 回调之后才能发送。
    // 创建一个 WebSocket 连接
      wx.connectSocket({
        url: 'ws://' + '10.193.166.208' + ':21456', // 如果使用http协议，url的开头应该是'ws'，这里是https协议
      })
    
        // 打开时的动作
      wx.onSocketOpen((res) => {
        console.log('WebSocket 已连接', res)
        that.data.socketStatus = 'connected'; // 标记打开
        that.data.socketMsgQueue = []
      })
    
        // 监听 WebSocket 接受到服务器的消息事件
      wx.onSocketMessage(msg => {
        //把JSONStr转为JSON
        if (typeof msg !== 'object') {
          msg = msg.replace(/\ufeff/g, "");
          var jj = JSON.parse(msg);
          msg = jj;
        }
        console.log("【websocket 监听到消息】内容如下：", msg);
      })
    
        // 断开时的动作
      wx.onSocketClose((res) => {
        console.log('WebSocket 已断开' , res)
        this.closeSocket()
        this.data.socketStatus = 'closed'
      })
    
        // 报错时的动作
      wx.onSocketError(error => {
        console.error('socket error:', error)
      })
    },
    
      // 关闭信道
    closeSocket() {
        // 注意这里有时序问题，
        // 如果 wx.connectSocket 还没回调 wx.onSocketOpen，而先调用 wx.closeSocket，那么就做不到关闭 WebSocket 的目的。
        // 必须在 WebSocket 打开期间调用 wx.closeSocket 才能关闭。
      if (this.data.socketStatus === 'connected') {
          // 关闭 WebSocket 连接
        wx.closeSocket({
          success: (res) => {
            console.log("关闭 WebSocket 连接" , res);
            this.data.socketStatus = 'closed'
          }
        })
      }
    },
    
      //发送消息函数
    sendSocketMessage(msg) {
      if (this.data.socketStatus === 'connected') {
          // 自定义的发给后台识别的参数 ，我这里发送的是数组里面的内容
        wx.sendSocketMessage({
          data: msg
        })
      } else {
        this.data.socketMsgQueue.push(msg)
      }
    },
  tcpconnect(){
    /**
   * 主动开启socket连接
   */
  that = this
  if (that.data.socketStatus === 'closed') {
    that.openSocket();
  }
  },
  tcpclose(){
  that = this
  if (that.data.socketStatus === 'connected') {
    that.closeSocket();
  }
  },
  zkrp_submit(){
    this.data.socketMsgQueue.push(this.data.PublicCircle.longitude);
    this.data.socketMsgQueue.push(this.data.PublicCircle.latitude);
    this.data.socketMsgQueue.push(this.data.PublicCircle.radius);
    for (let i = 0; i < this.data.socketMsgQueue.length; i++) {
      this.sendSocketMessage(this.data.socketMsgQueue[i])
    }
  }
})