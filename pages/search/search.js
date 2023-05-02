// pages/search/search.js
import request from '../../utils/request'
let isSend = false;//函数节流使用
Page({

  /**
   * 页面的初始数据
   */
  data: {
    placeholderContent: '',//placeholder内容
    hotList:[],//热搜榜数组
    searchContent: '',//表单项内容
    searchList: [],//匹配到的数据
    historyList: [],//历史搜索记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //获取初始化数据
    this.getInitData();
    //获取本地历史记录
    this.getSearchHistory();
  },

  //获取初始化数据
  async getInitData(){
    let placeholderContentData = await request('/search/default');
    let hostListData = await request('/search/hot/detail');
    this.setData({
      placeholderContent: placeholderContentData.data.showKeyword,
      hotList: hostListData.data
    })
  },

  //获取本地历史记录
  getSearchHistory(){
    let historyList =  wx.getStorageSync('searchHistory');
    if(historyList){
      this.setData({
        historyList: historyList
      })
    }
  },

  //表单项内容发生改变
  handleInputChange(event){
    this.setData({
      searchContent: event.detail.value.trim()
    })
    
    if(isSend){
      return;
    }
    isSend = true;
    
    //发请求获取搜索匹配到的数据
    this.getSearchListData();

    //函数节流
    setTimeout(() => {
      isSend = false;
    }, 500);
  },

  //发请求获取搜索匹配到的数据
  async getSearchListData(){
    //当搜索内容为空时就不发送请求并清空内容
    if(!this.data.searchContent){
      this.setData({
        searchList: []
      })
      return;
    }

    let {searchContent, historyList} = this.data;

    let searchListData = await request('/search', {keywords: searchContent, limit: 10});
    this.setData({
      searchList: searchListData.result.songs    
    })

    //将搜索关键字添加到历史记录
    if(historyList.indexOf(searchContent) !== -1){
      historyList.splice(historyList.indexOf(searchContent), 1)
    }
    historyList.unshift(searchContent);
    
    this.setData({
      historyList: historyList
    })

    //存储到本地
    wx.setStorageSync('searchHistory', historyList)
  },
  //清空搜索内容
  handleClear(){
    this.setData({
      searchContent: '',
      searchList: []
    })
  },
  //删除搜索历史记录
  handleDelete(){
    //是否确认清空
    wx.showModal({
      content: '确认清空记录吗?',
      success: (res)=>{
        if(res.confirm){
          this.setData({
            historyList: []
          })
          wx.removeStorageSync('searchHistory');
        }
      }
    })
  },

  //点击热搜榜进行搜索
  searchHotSong(event){
    this.setData({
      searchContent: event.currentTarget.dataset.hotwords
    })

    //发请求获取搜索匹配到的数据
    this.getSearchListData();
  },
  //点击历史记录进行搜索
  searchHistory(event){
    this.setData({
      searchContent: event.currentTarget.dataset.historyword
    })

    this.getSearchListData();
  },

  //跳转到歌曲详情页面
  toSongDetail(event){
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?song=' + event.currentTarget.id
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})