const app = getApp() // 获取全局APP对象
let that = null // 页面this指针变量
function getDistance(lat1, lng1, lat2, lng2) {  // 计算两点距离
  lat1 = lat1 || 0;
  lng1 = lng1 || 0;
  lat2 = lat2 || 0;
  lng2 = lng2 || 0;
  var rad1 = lat1 * Math.PI / 180.0;
  var rad2 = lat2 * Math.PI / 180.0;
  var a = rad1 - rad2;
  var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
  var r = 6378137;
  var distance = r * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(rad1) * Math.cos(rad2) * Math.pow(Math.sin(b / 2), 2)));
  return distance;
}

Page({
  data: { // 默认数据
    ulatitude: 39.0, // 用户纬度
    ulongitude: 116.0, // 用户经度
    latitude: 39.9836, // 地图中心纬度
    longitude: 116.3511, // 地图中心经度
    range: '', // 范围输入框
    location: '', // 经纬度输入框
    address: '', // 地址输入框
    model: 0, // 模式转换 0-正常标记点，1-公开圆圆心标记点
    marker: { // 地图当前标记点
      id: 0, // 标记点ID，不用变更
      latitude: 39.0, // 标记点所在纬度
      longitude: 116.0, // 标记点所在经度
      iconPath: '../../asset/local.png', // 标记点图标，png或jpg类型
      width: '20', // 标记点图标宽度
      height: '20' // 标记点图标高度
    },
    SecretCircle: { // 隐蔽圆（以用户为圆心的圆）
      latitude: 39.0, // 圆心维度
      longitude: 116.0, // 圆心经度
      radius: 100, // 圆半径
      color: '#48D1CC', // 描边颜色
      strokeWidth: 1, // 描边宽度
      fillColor: "#e2fcfb80", // 填充颜色
    },
    PublicCircle: { // 公开圆（以标记点为圆心的圆），同时也是ZKRP实际所用的范围
      latitude: 39.0, // 圆心维度
      longitude: 116.0, // 圆心经度
      radius: 0.1, // 圆半径
      color: '#48D1CC', // 描边颜色
      strokeWidth: 1, // 描边宽度
      fillColor: "#e2fcfb80", // 填充颜色
    },
    info: { // 地图点位信息
      // address: '-', // 常规地址
      // adinfo: '-', // 行政区
      // formatted: '-', // 推荐地址
      location: '-' // 经纬度
    }
  },
  /**
   * 页面装载回调
   */
  onLoad () {
    that = this // 设置页面this指针到全局that
    wx.getLocation({ // 获取当前位置
      type: 'gcj02', // gcj02火星坐标系，用于地图标记点位
      success (res) { // 获取成功
        that.setInfo([parseFloat(res.latitude), parseFloat(res.longitude)]) // 设置经纬度信息
        that.getLocation() // 获取当前位置点
      },
      fail (e) { // 获取失败
        if (e.errMsg.indexOf('auth deny') !== -1) { // 如果是权限拒绝
          wx.showModal({ // 显示提示
            content: '你已经拒绝了定位权限，将无法获取到你的位置信息，可以选择前往开启',
            success (res) {
              if (res.confirm) { // 确认后
                wx.openSetting() // 打开设置页，方便用户开启定位
              }
            }
          })
        }
      }
    })
  },
  /**
   * 改变标记点选择模式
   * @param {number} mode 模式 0-基础标记 1-标记公开圆圆心 2-准备提交
   */
  changemodel (mode = 0) {
    that.setData({
      model: mode
    })
  },
  /**
   * 提交范围证明参数
   */
  Commit () {
    if (that.data.model >= 2) { // 已选择公开圆圆心
      wx.setStorageSync('ulatitude', that.data.ulatitude)
      wx.setStorageSync('ulongitued', that.data.ulongitude)
      wx.setStorageSync('clatitude', that.data.PublicCircle.latitude)
      wx.setStorageSync('clongitude', that.data.PublicCircle.longitude)
      wx.setStorageSync('radius', that.data.PublicCircle.radius)
      wx.navigateTo({
        url: '../commit/commit'
      })
    } else {
      wx.showModal({
        content: '尚未选择标记点！',
        showCancel: false
      })
    }
  },
  /**
   * 点击地图
   * @param {*} e 页面载入参数
   */
  clickMap (e) {
    const { latitude, longitude } = e.detail // 获取点击的经纬度信息
    let data = {}
    if (that.data.model >= 1) { // 如果是公开圆圆心选点
      // data = { location: `${latitude.toFixed(4)},${longitude.toFixed(4)}` } // 写当前经纬度信息
      let distance = getDistance(latitude, longitude, that.data.ulatitude, that.data.ulongitude)
      if (distance >= 200)
      {
        if (distance < that.data.SecretCircle.radius) // 合法的选点
        {
          that.setCircle([latitude, longitude], true, that.data.SecretCircle.radius) // 更改隐蔽圆信息
          that.setInfo([latitude, longitude], 3, data) // 更改标记点信息
          that.getLocation({ latitude, longitude }) // 调用方法，传入经纬度，更新地址信息
          that.changemodel(2) // 更改模式，准备提交
        } else { // 公开圆圆心在隐蔽圆外
          wx.showModal({
            content: '所选标记点在隐蔽圆外！',
            showCancel: false
          })
      }
      } else {  // 公开圆圆心与隐蔽圆圆心过于接近
        wx.showModal({
          content: '所选标记点与自身太近！',
          showCancel: false
        })
      }
    } else {
      that.setInfo([latitude, longitude], 3, data) // 更改标记点信息
      that.getLocation({ latitude, longitude }) // 调用方法，传入经纬度，更新地址信息
    }
  },
  /**
   * 地图范围改变
   * @param {*} e 页面载入参数
   */
  changeMap (e) {
    if (e.causedBy === 'drag' && e.type === 'end') { // 只有在手动拖动停止时，才执行动作
      const { latitude, longitude } = e.detail.centerLocation // 获取中心点位置
      that.setInfo([latitude, longitude], 1) // 不更改标记点，更新地图中心位置
    }
  },
  /**
   * 选择服务范围，提交范围证明参数
   */
  async setRange () {
    let range = that.data.range // 取出范围输入
    if (range != null && range !== '') { // 如果输入不为空
      const rad = parseFloat(range) / 2;
      if (!isNaN(rad)) { // 如果成功数字化了
        if (rad <= 5000 && rad >= 500){ // 如果范围半径在5公里内 且在500米以上
          wx.showLoading({
            content: '提交中',
            mask: false
          })
          that.setCircle([that.data.ulatitude, that.data.ulongitude], 0, rad)
          that.setCircle([39.0, 116.0], 1, 1)
          that.setInfo([39.0, 116.0], 3)
          that.changemodel(1)
          setTimeout (function () { wx.hideLoading() }, 250)
          wx.showModal({
            content: '请在图中圆内选择一个标记点（不要与自身重合）',
            showCancel: false
          })
        } else if (rad > 5000) { // 如果范围过大
          wx.showModal({
            content: '输入数字过大，请输入10000以内的数字', // 当前美团的最大服务推荐距离为10公里
            showCancel: false
          })
        } else { // 如果范围过小
          wx.showModal({
            content: '输入数字过小，请输入1000以上的数字',
            showCancel: false
        })
      }
      } else { // 如果数字化失败
        wx.showModal({ // 提示失败
          content: '输入解析错误，请输入合法的数字',
          showCancel: false
        })
      }
    } else { // 如果输入为空
      wx.showModal({ // 提示为空
        content: '输入不可为空',
        showCancel: false
      })
    }
  },
  /**
   * 手动点击查询按钮，查询信息
   */
  async query () {
    if (that.data.model === 0) { // 如果模式为地址查询
      that.getAddress(that.data.address) // 调用地址请求方法，传入地址信息
    } else if (that.data.model === 1) { // 如果模式为经纬度查询
      let location = that.data.location // 取出经纬度输入
      if (location != null && location !== '') { // 如果经纬度不为空
        location = location.replace(/，/g, ',') // 替换中文格式的逗号
        const lldata = {
          latitude: parseFloat(location.split(',')[0]), // 分割纬度，并数字化
          longitude: parseFloat(location.split(',')[1]) // 分割经度，并数字化
        }
        if (!isNaN(lldata.latitude) && !isNaN(lldata.longitude)) { // 如果经纬度都成功数字化了
          wx.showLoading({
            title: '查询中',
            mask: false
          })
          that.setInfo([lldata.latitude, lldata.longitude]) // 更新中心点和坐标点
          that.getLocation(lldata) // 调用请求方法，传入经纬度信息，开始查询
        } else { // 如果数字化失败
          wx.showModal({ // 提示失败
            content: '经纬度解析错误',
            showCancel: false
          })
        }
      } else { // 如果填写为空
        wx.showModal({ // 提示为空
          content: '经纬度不可为空',
          showCancel: false
        })
      }
    }
  },
  /**
   * 请求获取经纬度的详细信息
   * @param {object} data 经纬度信息
   */
  async getLocation (data = null) {
    const {
      latitude,
      longitude
    } = data || that.data // 如果传入为空，则使用data内数据
    await app.call({ // 发起云函数请求
      name: 'location', // 业务为location，获取经纬度信息
      data: { // 传入经纬度信息
        location: `${latitude},${longitude}`
      },
      load: false // 不显示加载loading，静默执行
    }).then((res) => { // 请求成功后
      that.setData({ // 将信息存储data数据
        info: res
      })
    })
  },
  /**
   * 请求获取地址的详细信息
   * @param {*} address 地址信息
   */
  async getAddress (address) {
    await app.call({ // 发起云函数请求
      name: 'address', // 业务为address，获取地址信息
      data: { // 传入地址信息
        address: address
      },
      tips: '查询中' // 加载提示为查询中
    }).then((res) => { // 请求成功
      that.setInfo([res.reallocal.lat, res.reallocal.lng], 0, { // 设置信息和地图中心点以及标记点
        info: res
      })
    })
  },
  /**
   * 监听输入框
   * @param {*} e 页面载入参数
   */
  oninput (e) {
    that.setData({
      [e.currentTarget.dataset.key]: e.detail.value
    })
  },
  /**
   * 统一设置经纬度信息和额外信息
   * @param {array} pot 经纬度
   * @param {number} type 类型 0-设置中心点和用户点 1-只设置中心点 2-只设置用户点 3-只设置标记点
   * @param {*} ext 额外的其他数据，一块带入
   */
  setInfo (pot = [39.9836, 116.3511], type = 0, ext = {}) {
    let data = { ...ext }
    if (type !== 2 && type !== 3) {
      data = Object.assign(data, { // 传入中心点
        latitude: pot[0],
        longitude: pot[1]
      })
    }
    if (type !== 1 && type !== 3) {
      data = Object.assign(data, { // 传入用户点
        ulatitude: pot[0],
        ulongitude: pot[1]
      })
    }
    if (type !== 0 && type !== 1 && type !== 2) {
      data = Object.assign(data, { // 传入标记点
        'marker.latitude': pot[0],
        'marker.longitude': pot[1]
      })
    }
    that.setData(data)
  },
  /**
   * 设置隐蔽圆和公开圆
   * @param {array} pot 经纬度
   * @param {boolean} type 类型 0-隐蔽圆 1-公开圆
   * @param {*} radius 半径 
   */
  setCircle (pot = [39.0, 116.0], type=1, radius) {
    let data = {  }
    if (!type) { // 设置隐蔽圆
      data = Object.assign(data, {
        'SecretCircle.latitude': pot[0],
        'SecretCircle.longitude': pot[1],
        'SecretCircle.radius': radius
      })
    } else { // 设置公开圆
      data = Object.assign(data, {
        'PublicCircle.latitude': pot[0],
        'PublicCircle.longitude': pot[1],
        'PublicCircle.radius': radius
      })
    }
    that.setData(data)
  },
})
