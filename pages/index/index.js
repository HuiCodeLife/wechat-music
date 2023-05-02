import request from "../../utils/request";
// pages/index/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    bannerList: [], // 轮播图数据
    recommendList: [], // 推荐歌单
    topList: [], // 排行榜数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取banner数据
    request("/banner", { type: 2 }).then((res) => {
      this.setData({
        bannerList: res.banners,
      });
    });

    // 获取推荐歌单数据
    request("/personalized", { limit: 10 }).then((res) => {
      this.setData({
        recommendList: res.result,
      });
    });

  },
 //跳转到每日推荐歌曲页面
 toRecommendSong(){
  wx.navigateTo({
    url: '/pages/recommendSong/recommendSong',
  })
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
