// pages/login/login.js
import request from '../../utils/request'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    phone: "", // 手机号
    password: "", // 用户密码
    qrSrc:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.login()
  },
  // 表单项内容发生改变的回调
  // handleInput(event) {
  //   // let type = event.currentTarget.id;// id传值 取值： phone || password
  //   let type = event.currentTarget.dataset.type; // data-key=value
  //   // console.log(event);
  //   this.setData({
  //     [type]: event.detail.value,
  //   });
  // },
  // async login() {
  //   // 前端校验
  //   let { phone, password } = this.data;
  //   if (!phone) {
  //     // 提示用户
  //     wx.showToast({
  //       title: "手机号不能为空",
  //       icon: "none",
  //     });
  //     return;
  //   }
  //   // 定义正则表达式
  //   let phoneReg = /^1(3|4|5|6|7|8|9)\d{9}$/;
  //   if (!phoneReg.test(phone)) {
  //     wx.showToast({
  //       title: "手机号格式错误",
  //       icon: "none",
  //     });
  //     return;
  //   }

  //   if (!password) {
  //     wx.showToast({
  //       title: "密码不能为空",
  //       icon: "none",
  //     });
  //     return;
  //   }

  //   // 后端验证
  //   let result = await request("/login/cellphone", {
  //     phone,
  //     password,
  //     isLogin: true,
  //   });
  //   if (result.code === 200) {
  //     // 登录成功
  //     wx.showToast({
  //       title: "登录成功",
  //     });
  //     // 将用户的信息存储至本地
  //     wx.setStorageSync("userInfo", JSON.stringify(result.profile));

  //     // 跳转至个人中心personal页面
  //     wx.reLaunch({
  //       url: "/pages/me/me",
  //     });
  //   } else if (result.code === 400) {
  //     wx.showToast({
  //       title: "手机号错误",
  //       icon: "none",
  //     });
  //   } else if (result.code === 502) {
  //     wx.showToast({
  //       title: "密码错误",
  //       icon: "none",
  //     });
  //   } else {
  //     wx.showToast({
  //       title: "登录失败，请重新登录",
  //       icon: "none",
  //     });
  //   }
  // },
  async login() {
    let timer
    let timestamp = Date.now()
    // const cookie = localStorage.getItem('cookie')
    // this.getLoginStatus(cookie)
    let res = await request(`/login/qr/key?timestamp=${Date.now()}`);
    const key = res.data.unikey
    let res2 = await request(`/login/qr/create?key=${key}&qrimg=true&timestamp=${Date.now()}`);
    // console.log(res2.data.qrimg);
    this.setData({
      qrSrc:res2.data.qrimg
    });

    timer = setInterval(async () => {
          const statusRes = await this.checkStatus(key)
          if (statusRes.code === 800) {
            wx.showToast({
              title: "二维码已过期,请重新获取",
            });
            clearInterval(timer)
          }
          if (statusRes.code === 803) {
            // 这一步会返回cookie
            clearInterval(timer)
            wx.showToast({
              title: "授权登录成功",
            });
            // 将用户的信息存储至本地

            let result = await this.getLoginStatus(statusRes.cookie)
               // 将用户的信息存储至本地
            wx.setStorageSync('userInfo', JSON.stringify(result.data.profile))
      
            wx.reLaunch({
              url: "/pages/me/me",
            })
    
          }
        }, 3000)
  },
  async checkStatus(key) {
    const res = await request(`/login/qr/check?key=${key}&timestamp=${Date.now()}`,{isLogin: true})
    return res
  },
  async getLoginStatus(cookie = '') {
    const res = await request(`/login/status?timestamp=${Date.now()}`,{cookie},'post',)
    return res
  },
  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
});
