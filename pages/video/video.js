import request from "../../utils/request";
Page({
  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [], // 导航标签数据
    navId: "", // 导航的标识
    videoList: [], // 视频列表数据
    videoId: "", // 视频id标识
    videoUpdateTime: [], // 记录video播放的时长
    isTriggered: false, // 标识下拉刷新是否被触发
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      //判断用户是否登录
      let userIinfo = wx.getStorageSync('userInfo');
      if(!userIinfo){
        wx.showToast({
          title: '请先进行登录',
          icon: 'none',
          success: ()=>{
            //跳转至登录界面
            wx.reLaunch({
              url: '/pages/login/login',
            })
          }
        })
        return
      }
    // 显示正在加载
    wx.showLoading({
      title: "正在加载",
    });
    // 获取导航数据
    this.getVideoGroupListData();
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request("/video/group/list");
    this.setData({
      videoGroupList: videoGroupListData.data.slice(0, 14),
      navId: videoGroupListData.data[0].id,
    });

    // 获取视频列表数据
    this.getVideoList(this.data.navId);
  },
  // 获取视频列表数据
  async getVideoList(navId) {
    if (!navId) {
      // 判断navId为空串的情况
      return;
    }
    let videoListData = await request("/video/group", { id: navId });
    let index = 0;
    let videoList = videoListData.datas.map(async (item) => {
      item.id = index++;
      let res = await this.getVideoUrl(item.data.vid);
      item.data.urlInfo = res.urls[0].url;
      return item;
    });

    Promise.all(videoList)
      .then((videoList) => {
        // 关闭消息提示框
        wx.hideLoading();
         this.setData({
            videoList,
            isTriggered: false, // 关闭下拉刷新
          });
      })
      .catch((error) => {
        console.error(error);
      });
   
  },

  getVideoUrl(vid) {
    let res = request("/video/url", { id: vid });
    return res;
  },

  // 点击切换导航的回调
  changeNav(event) {
    let navId = event.currentTarget.id; // 通过id向event传参的时候如果传的是number会自动转换成string
    // let navId = event.currentTarget.dataset.id;
    this.setData({
      navId: navId >>> 0,
      videoList: [],
    });
    // 显示正在加载
    wx.showLoading({
      title: "正在加载",
    });
    // 动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId);
  },

  // 点击播放/继续播放的回调
  handlePlay(event) {

    let vid = event.currentTarget.id;
    // 更新data中videoId的状态数据
    this.setData({
      videoId: vid,
    });
    // 创建控制video标签的实例对象
    this.videoContext = wx.createVideoContext(vid);
    // 判断当前的视频之前是否播放过，是否有播放记录, 如果有，跳转至指定的播放位置
    let { videoUpdateTime } = this.data;
    let videoItem = videoUpdateTime.find((item) => item.vid === vid);
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime);
    }
    this.videoContext.play();
  },

  // 监听视频播放进度的回调
  handleTimeUpdate(event) {
    let videoTimeObj = {
      vid: event.currentTarget.id,
      currentTime: event.detail.currentTime,
    };
    let { videoUpdateTime } = this.data;
    /*
     * 思路： 判断记录播放时长的videoUpdateTime数组中是否有当前视频的播放记录
     *   1. 如果有，在原有的播放记录中修改播放时间为当前的播放时间
     *   2. 如果没有，需要在数组中添加当前视频的播放对象
     *
     * */
    let videoItem = videoUpdateTime.find(
      (item) => item.vid === videoTimeObj.vid
    );
    if (videoItem) {
      // 之前有
      videoItem.currentTime = event.detail.currentTime;
    } else {
      // 之前没有
      videoUpdateTime.push(videoTimeObj);
    }
    // 更新videoUpdateTime的状态
    this.setData({
      videoUpdateTime,
    });
  },

  // 视频播放结束调用的回调
  handleEnded(event) {
    // 移除记录播放时长数组中当前视频的对象
    let { videoUpdateTime } = this.data;
    videoUpdateTime.splice(
      videoUpdateTime.findIndex((item) => item.vid === event.currentTarget.id),
      1
    );
    this.setData({
      videoUpdateTime,
    });
  },

  // 自定义下拉刷新的回调： scroll-view
  handleRefresher() {
    console.log("scroll-view 下拉刷新");
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId);
  },

  // 自定义上拉触底的回调 scroll-view
  // handleToLower() {
  //   console.log("scroll-view 上拉触底");
  //   // 数据分页： 1. 后端分页， 2. 前端分页
  //   console.log("发送请求 || 在前端截取最新的数据 追加到视频列表的后方");
  //   console.log("网易云音乐暂时没有提供分页的api");
  //   // 模拟数据
  //   let newVideoList = [
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_E02A88CF2AE65C449CADD2371C315F18",
  //         coverUrl:
  //           "https://p2.music.126.net/XIY-ggs6OMhSsrGcx4yUcw==/109951164996630305.jpg",
  //         height: 1080,
  //         width: 1920,
  //         title: "李宇春华晨宇合作好炸《西门少年》，真是神仙合作啊！",
  //         description: "李宇春华晨宇合作好炸《西门少年》，真是神仙合作啊！",
  //         commentCount: 186,
  //         shareCount: 516,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 29450044,
  //           },
  //           {
  //             resolution: 480,
  //             size: 49904667,
  //           },
  //           {
  //             resolution: 720,
  //             size: 72480174,
  //           },
  //           {
  //             resolution: 1080,
  //             size: 137540575,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 440000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/WbQbH2nMF8_30bj-wH92vg==/109951164781511113.jpg",
  //           accountStatus: 0,
  //           gender: 0,
  //           city: 445200,
  //           birthday: -2209017600000,
  //           userId: 3247598879,
  //           userType: 0,
  //           nickname: "一起爱上好音乐",
  //           signature: "",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951164781511120,
  //           backgroundImgId: 109951162868128400,
  //           backgroundUrl:
  //             "http://p1.music.126.net/2zSNIqTcpHL2jIvU6hG0EA==/109951162868128395.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: null,
  //           djStatus: 0,
  //           vipType: 0,
  //           remarkName: null,
  //           avatarImgIdStr: "109951164781511113",
  //           backgroundImgIdStr: "109951162868128395",
  //           avatarImgId_str: "109951164781511113",
  //         },
  //         urlInfo: {
  //           id: "E02A88CF2AE65C449CADD2371C315F18",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/UPF3ch3c_2981347105_uhd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=emnEcbTFOFCBkvOhDuUKTDioVBbYMoej&sign=74f043e422f309fb1f240ed7c535a9f5&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 137540575,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 1080,
  //         },
  //         videoGroup: [
  //           {
  //             id: -8013,
  //             name: "#人气飙升榜#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 23118,
  //             name: "华晨宇",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 59101,
  //             name: "华语现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 59108,
  //             name: "巡演现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "西门少年 (Live)",
  //             id: 1442842608,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 861777,
  //                 name: "华晨宇",
  //                 tns: [],
  //                 alias: [],
  //               },
  //               {
  //                 id: 8327,
  //                 name: "李宇春",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: ["原唱：李宇春"],
  //             pop: 100,
  //             st: 0,
  //             rt: "",
  //             fee: 8,
  //             v: 4,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 88421277,
  //               name: "歌手·当打之年 第12期",
  //               picUrl:
  //                 "http://p3.music.126.net/mOa6Y35QQa2-A5HArd58sQ==/109951164933975773.jpg",
  //               tns: [],
  //               pic_str: "109951164933975773",
  //               pic: 109951164933975780,
  //             },
  //             dt: 293850,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 11756205,
  //               vd: -26779,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 7053741,
  //               vd: -24264,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 4702509,
  //               vd: -22819,
  //             },
  //             a: null,
  //             cd: "01",
  //             no: 7,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 0,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 1416682,
  //             mv: 0,
  //             publishTime: 0,
  //             privilege: {
  //               id: 1442842608,
  //               fee: 8,
  //               payed: 0,
  //               st: 0,
  //               pl: 128000,
  //               dl: 0,
  //               sp: 7,
  //               cp: 1,
  //               subp: 1,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 128000,
  //               toast: false,
  //               flag: 68,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "E02A88CF2AE65C449CADD2371C315F18",
  //         durationms: 302891,
  //         playTime: 363031,
  //         praisedCount: 5362,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_510C8F5A9DA8DC23997E522B85F1FB3A",
  //         coverUrl:
  //           "https://p2.music.126.net/W_p6aX7vCFR9Lk-wV0x1Eg==/109951164666337012.jpg",
  //         height: 720,
  //         width: 1280,
  //         title: "断眉联手麻神在湖人中场表演《See you again》致敬科比",
  //         description:
  //           "Wiz Khalifa和Charlie Puth在中场休息时为科比演唱的《See you again》\n\n“It's been a long day without you my friend”\n\n#Charlie Puth#|#Wiz Khalifa#",
  //         commentCount: 139,
  //         shareCount: 317,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 17757824,
  //           },
  //           {
  //             resolution: 480,
  //             size: 28683079,
  //           },
  //           {
  //             resolution: 720,
  //             size: 36021554,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 1000000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/HjT8-LnESerQh-mC7bvXBw==/109951165359708723.jpg",
  //           accountStatus: 0,
  //           gender: 0,
  //           city: 1006600,
  //           birthday: 818804058083,
  //           userId: 391194506,
  //           userType: 200,
  //           nickname: "欧美音乐杂货铺",
  //           signature:
  //             "“环球音乐专属音乐资讯号” “电影资讯号”“欧美音乐资讯号”\n\nColdplay One Direction Paul Walker 百家影视独家资讯站，欢迎光临~\nTaylor Swift\nChris Hemsworth\nChris Evans\nSebastian Stan\n张艺兴",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951165359708720,
  //           backgroundImgId: 109951165311536080,
  //           backgroundUrl:
  //             "http://p1.music.126.net/TsZo0EMK_FECf9sHJkx8RQ==/109951165311536074.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: ["欧美"],
  //           experts: {
  //             1: "音乐视频达人",
  //             2: "音乐图文达人",
  //           },
  //           djStatus: 10,
  //           vipType: 0,
  //           remarkName: null,
  //           avatarImgIdStr: "109951165359708723",
  //           backgroundImgIdStr: "109951165311536074",
  //           avatarImgId_str: "109951165359708723",
  //         },
  //         urlInfo: {
  //           id: "510C8F5A9DA8DC23997E522B85F1FB3A",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/7NiPfon1_2893278030_shd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=rnqPXTyYCIrmKFYdotyVQgiBLQxNFMkq&sign=cbb3dc0c123693e656ec5c8aa6aa4fe8&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 36021554,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 720,
  //         },
  //         videoGroup: [
  //           {
  //             id: -8003,
  //             name: "#点赞榜#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 16194,
  //             name: "Charlie Puth",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "See You Again",
  //             id: 401722227,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 90331,
  //                 name: "Charlie Puth",
  //                 tns: [],
  //                 alias: [],
  //               },
  //               {
  //                 id: 46006,
  //                 name: "Wiz Khalifa",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: ["电影《速度与激情7》片尾曲"],
  //             pop: 100,
  //             st: 0,
  //             rt: null,
  //             fee: 1,
  //             v: 16,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 3270972,
  //               name: "Nine Track Mind",
  //               picUrl:
  //                 "http://p3.music.126.net/OVHar05vedbWFEWHuArbGA==/3295236348738229.jpg",
  //               tns: [],
  //               pic: 3295236348738229,
  //             },
  //             dt: 229564,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 9184696,
  //               vd: -11799,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 5510834,
  //               vd: -9300,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 3673904,
  //               vd: -7799,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 13,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 1,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 7002,
  //             mv: 393006,
  //             publishTime: 1454254457074,
  //             privilege: {
  //               id: 401722227,
  //               fee: 1,
  //               payed: 0,
  //               st: 0,
  //               pl: 0,
  //               dl: 0,
  //               sp: 0,
  //               cp: 0,
  //               subp: 0,
  //               cs: false,
  //               maxbr: 320000,
  //               fl: 0,
  //               toast: false,
  //               flag: 1284,
  //               preSell: false,
  //             },
  //           },
  //           {
  //             name: "See You Again",
  //             id: 30953009,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 46006,
  //                 name: "Wiz Khalifa",
  //                 tns: [],
  //                 alias: [],
  //               },
  //               {
  //                 id: 90331,
  //                 name: "Charlie Puth",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: ["电影《速度与激情7》致敬保罗沃克插曲"],
  //             pop: 100,
  //             st: 0,
  //             rt: null,
  //             fee: 1,
  //             v: 289,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 3104138,
  //               name: "Furious 7 (Original Motion Picture Soundtrack)",
  //               picUrl:
  //                 "http://p3.music.126.net/JIc9X91OSH-7fUZqVfQXAQ==/7731765766799133.jpg",
  //               tns: [],
  //               pic: 7731765766799133,
  //             },
  //             dt: 230520,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 9223358,
  //               vd: -17300,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 5534032,
  //               vd: -14800,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 3689369,
  //               vd: -13400,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 7,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 2,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 7002,
  //             mv: 393006,
  //             publishTime: 1426521600007,
  //             tns: ["有缘再见"],
  //             privilege: {
  //               id: 30953009,
  //               fee: 1,
  //               payed: 0,
  //               st: 0,
  //               pl: 0,
  //               dl: 0,
  //               sp: 0,
  //               cp: 0,
  //               subp: 0,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 0,
  //               toast: false,
  //               flag: 1284,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "510C8F5A9DA8DC23997E522B85F1FB3A",
  //         durationms: 228739,
  //         playTime: 418612,
  //         praisedCount: 3532,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_A54AEB1C28CCD7990E7E6EAB56ECA485",
  //         coverUrl:
  //           "https://p2.music.126.net/nj51zvc7TQHbg_dCZKDerg==/109951165037815775.jpg",
  //         height: 486,
  //         width: 864,
  //         title: "动漫《你的名字》插曲《スパークル》，现场版太好听！",
  //         description: null,
  //         commentCount: 21,
  //         shareCount: 18,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 13805898,
  //           },
  //           {
  //             resolution: 480,
  //             size: 13565707,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 440000,
  //           authStatus: 1,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/N0NpmREOm_yb0w_X5zLO5w==/7795537441726101.jpg",
  //           accountStatus: 0,
  //           gender: 1,
  //           city: 440100,
  //           birthday: 953136000000,
  //           userId: 247337423,
  //           userType: 4,
  //           nickname: "椰汁超甜",
  //           signature: "来不及.",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 7795537441726101,
  //           backgroundImgId: 18641120139551856,
  //           backgroundUrl:
  //             "http://p1.music.126.net/4ZlZ1W4gaf6UwR1wFVA0XQ==/18641120139551855.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: {
  //             1: "二次元视频达人",
  //           },
  //           djStatus: 10,
  //           vipType: 11,
  //           remarkName: null,
  //           avatarImgIdStr: "7795537441726101",
  //           backgroundImgIdStr: "18641120139551855",
  //         },
  //         urlInfo: {
  //           id: "A54AEB1C28CCD7990E7E6EAB56ECA485",
  //           url: "http://vodkgeyttp9.vod.126.net/cloudmusic/e6eed2962315dc66cdcef781e1e83211.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=LZiZsPiFzqLGysfTDEPypqyNqKRbyyDi&sign=fe210fb85ba1f8b88ff7ddceb30f8016&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 13565707,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 480,
  //         },
  //         videoGroup: [
  //           {
  //             id: 60101,
  //             name: "日语现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 59108,
  //             name: "巡演现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57108,
  //             name: "流行现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 3102,
  //             name: "二次元",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "A54AEB1C28CCD7990E7E6EAB56ECA485",
  //         durationms: 360000,
  //         playTime: 29579,
  //         praisedCount: 392,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_C4299C0654762635964C1EDE4CED60BB",
  //         coverUrl:
  //           "https://p2.music.126.net/E_1PyKAfru_fMuujOcs2XQ==/109951163787833870.jpg",
  //         height: 720,
  //         width: 1280,
  //         title: "Bigbang能把颁奖礼办成演唱会，这互动好有趣！",
  //         description: "Bigbang能把颁奖礼办成演唱会，这互动好有趣！",
  //         commentCount: 896,
  //         shareCount: 642,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 14694445,
  //           },
  //           {
  //             resolution: 480,
  //             size: 24822776,
  //           },
  //           {
  //             resolution: 720,
  //             size: 38022088,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 350000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/p0xg8RpP9ohc3xjDCiePfA==/109951163781470122.jpg",
  //           accountStatus: 0,
  //           gender: 0,
  //           city: 350100,
  //           birthday: -2209017600000,
  //           userId: 1701877461,
  //           userType: 0,
  //           nickname: "莫想聆听",
  //           signature: "",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951163781470130,
  //           backgroundImgId: 109951162868126480,
  //           backgroundUrl:
  //             "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: null,
  //           djStatus: 0,
  //           vipType: 0,
  //           remarkName: null,
  //           avatarImgIdStr: "109951163781470122",
  //           backgroundImgIdStr: "109951162868126486",
  //           avatarImgId_str: "109951163781470122",
  //         },
  //         urlInfo: {
  //           id: "C4299C0654762635964C1EDE4CED60BB",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/pD0Vohdf_2246837624_shd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=zlbjKhVVyQUDwIDdtIovWhUisRaExFVz&sign=8d58b0847a8e9e3cf6453c7635182925&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 38022088,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 720,
  //         },
  //         videoGroup: [
  //           {
  //             id: -33206,
  //             name: "#BIGBANG（빅뱅）#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 10114,
  //             name: "BIGBANG",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 14255,
  //             name: "颁奖晚会盛典",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 103111,
  //             name: "韩语资讯",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 25137,
  //             name: "音乐资讯",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 12100,
  //             name: "流行",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "FANTASTIC BABY",
  //             id: 30854090,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 126339,
  //                 name: "BIGBANG",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: ["Japanese Ver."],
  //             pop: 100,
  //             st: 0,
  //             rt: null,
  //             fee: 1,
  //             v: 236,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 3104651,
  //               name: "THE BEST OF BIGBANG 2006-2014",
  //               picUrl:
  //                 "http://p4.music.126.net/l6BwLqjtNjMr2surmIOufg==/109951163199340826.jpg",
  //               tns: [],
  //               pic_str: "109951163199340826",
  //               pic: 109951163199340830,
  //             },
  //             dt: 231626,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 9267244,
  //               vd: -34000,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 5560364,
  //               vd: -31500,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 3706924,
  //               vd: -30100,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 12,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 2,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 457010,
  //             mv: 0,
  //             publishTime: 1416931200007,
  //             privilege: {
  //               id: 30854090,
  //               fee: 1,
  //               payed: 0,
  //               st: 0,
  //               pl: 0,
  //               dl: 0,
  //               sp: 0,
  //               cp: 0,
  //               subp: 0,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 0,
  //               toast: false,
  //               flag: 1093,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "C4299C0654762635964C1EDE4CED60BB",
  //         durationms: 99114,
  //         playTime: 3411106,
  //         praisedCount: 15985,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_21ED2223ADDAA5FC9DD5FA596ADF9A11",
  //         coverUrl:
  //           "https://p2.music.126.net/0AMmrU7zVrUHKFMrnG3DlQ==/109951163811950820.jpg",
  //         height: 1080,
  //         width: 1920,
  //         title: "李宗盛 《为你我受冷风吹》现场版",
  //         description:
  //           "李宗盛 《为你我受冷风吹》现场版 II 若是爱已不可为，你明白说吧无所谓。\n\n但愿我会就此放下往事，忘了过去有多美\n不盼缘尽仍留慈悲，虽然我曾经这样以为，我真的这样以为",
  //         commentCount: 973,
  //         shareCount: 5423,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 18230031,
  //           },
  //           {
  //             resolution: 480,
  //             size: 34373102,
  //           },
  //           {
  //             resolution: 720,
  //             size: 51666648,
  //           },
  //           {
  //             resolution: 1080,
  //             size: 92646784,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 350000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/GtIXN9Bpk7eGcGtXwMZfRA==/6634453162191982.jpg",
  //           accountStatus: 0,
  //           gender: 1,
  //           city: 350500,
  //           birthday: 680198400000,
  //           userId: 34652764,
  //           userType: 201,
  //           nickname: "乌托邦电台",
  //           signature:
  //             "知名音乐自媒体，新浪微博@乌托邦电台 （宣传、品牌合作请私信）",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 6634453162191982,
  //           backgroundImgId: 109951163156242990,
  //           backgroundUrl:
  //             "http://p1.music.126.net/x2MDv3VHl-59oDc1MTYmPQ==/109951163156242986.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: {
  //             1: "音乐视频达人",
  //             2: "华语音乐资讯达人",
  //           },
  //           djStatus: 10,
  //           vipType: 11,
  //           remarkName: null,
  //           avatarImgIdStr: "6634453162191982",
  //           backgroundImgIdStr: "109951163156242986",
  //         },
  //         urlInfo: {
  //           id: "21ED2223ADDAA5FC9DD5FA596ADF9A11",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/GqyxO6ox_2271663003_uhd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=FWdhShbgJMLHExhqpgvURhgdlLEDOodn&sign=edf69fa09a057febadb312d5f95f5d54&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 92646784,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 1080,
  //         },
  //         videoGroup: [
  //           {
  //             id: -8001,
  //             name: "#热搜榜#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 14133,
  //             name: "李宗盛",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 254120,
  //             name: "滚石唱片行",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57110,
  //             name: "饭拍现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 59101,
  //             name: "华语现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57108,
  //             name: "流行现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "为你我受冷风吹",
  //             id: 257098,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 8336,
  //                 name: "林忆莲",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: [],
  //             pop: 100,
  //             st: 0,
  //             rt: "600902000007915837",
  //             fee: 8,
  //             v: 37,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 25645,
  //               name: "Love, Sandy",
  //               picUrl:
  //                 "http://p3.music.126.net/5qWWTetRGYBc-ktiJLZsCw==/109951163076136658.jpg",
  //               tns: [],
  //               pic_str: "109951163076136658",
  //               pic: 109951163076136660,
  //             },
  //             dt: 259666,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 10389464,
  //               vd: -27828,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 6233696,
  //               vd: -25262,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 4155812,
  //               vd: -23640,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 6,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 0,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 684010,
  //             mv: 10929162,
  //             publishTime: 788889600000,
  //             privilege: {
  //               id: 257098,
  //               fee: 8,
  //               payed: 0,
  //               st: 0,
  //               pl: 128000,
  //               dl: 0,
  //               sp: 7,
  //               cp: 1,
  //               subp: 1,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 128000,
  //               toast: false,
  //               flag: 68,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "21ED2223ADDAA5FC9DD5FA596ADF9A11",
  //         durationms: 226788,
  //         playTime: 3291453,
  //         praisedCount: 16422,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_FBDD3F96E31C31E34553A5D06EC72DD7",
  //         coverUrl:
  //           "https://p2.music.126.net/06lpFHx43xpOtn6OWhvOVw==/109951163956043222.jpg",
  //         height: 720,
  //         width: 1280,
  //         title: "姚贝娜 - 惊鸿舞 & 菩萨蛮",
  //         description:
  //           "姚贝娜 - 惊鸿舞 & 菩萨蛮\n这是什么人啊 现场唱成这样 而且每个现场都能唱成这样\n声音实在太美了 无暇的美",
  //         commentCount: 147,
  //         shareCount: 296,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 22971644,
  //           },
  //           {
  //             resolution: 480,
  //             size: 38609043,
  //           },
  //           {
  //             resolution: 720,
  //             size: 55890087,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 1000000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/veHKeJvsBRJcbWqSLDTadg==/109951164592779530.jpg",
  //           accountStatus: 0,
  //           gender: 1,
  //           city: 1001600,
  //           birthday: 2190902400000,
  //           userId: 43772457,
  //           userType: 0,
  //           nickname: "野三坡坡坡",
  //           signature: "wassup babe?",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951164592779540,
  //           backgroundImgId: 109951165046711330,
  //           backgroundUrl:
  //             "http://p1.music.126.net/Jv20bPhLhiayfk1JNnlczw==/109951165046711333.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: null,
  //           djStatus: 0,
  //           vipType: 11,
  //           remarkName: null,
  //           avatarImgIdStr: "109951164592779530",
  //           backgroundImgIdStr: "109951165046711333",
  //           avatarImgId_str: "109951164592779530",
  //         },
  //         urlInfo: {
  //           id: "FBDD3F96E31C31E34553A5D06EC72DD7",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/X0ooTNGS_2392962177_shd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=mhDBserywvdUZZAhEJKQGaKrPVuLvEQG&sign=0adb09a3773e79555aa2891ef70fd8f5&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 55890087,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 720,
  //         },
  //         videoGroup: [
  //           {
  //             id: -31741,
  //             name: "#『中华诗文』诗词浅唱，请君为我倾耳听…#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 9102,
  //             name: "演唱会",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 59101,
  //             name: "华语现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57108,
  //             name: "流行现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "FBDD3F96E31C31E34553A5D06EC72DD7",
  //         durationms: 238762,
  //         playTime: 295066,
  //         praisedCount: 1984,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_DCFAFE6105D21B4A6D4530DBF923B939",
  //         coverUrl:
  //           "https://p2.music.126.net/u9DiG5l16itCXQ-FSGh5WA==/109951164735069085.jpg",
  //         height: 720,
  //         width: 1280,
  //         title: "胡彦斌 于文文吵架式演唱《爱之初体验》 嗓音满是洒脱与不羁！",
  //         description:
  //           "胡彦斌  于文文吵架式演唱《爱之初体验》 嗓音满是洒脱与不羁！",
  //         commentCount: 355,
  //         shareCount: 2581,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 43626769,
  //           },
  //           {
  //             resolution: 480,
  //             size: 71560563,
  //           },
  //           {
  //             resolution: 720,
  //             size: 101293564,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 650000,
  //           authStatus: 0,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/jGaSqoYu_r1ICvky2dimGw==/109951165391125525.jpg",
  //           accountStatus: 0,
  //           gender: 1,
  //           city: 650100,
  //           birthday: 923760000000,
  //           userId: 113164676,
  //           userType: 200,
  //           nickname: "苏奕杰",
  //           signature: "及时行乐. Vx:ways2050",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951165391125520,
  //           backgroundImgId: 109951165381738600,
  //           backgroundUrl:
  //             "http://p1.music.126.net/gAD73rVHk2bdps4LkLHblw==/109951165381738588.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: ["华语", "流行", "欧美"],
  //           experts: {
  //             2: "生活图文达人",
  //           },
  //           djStatus: 10,
  //           vipType: 11,
  //           remarkName: null,
  //           avatarImgIdStr: "109951165391125525",
  //           backgroundImgIdStr: "109951165381738588",
  //           avatarImgId_str: "109951165391125525",
  //         },
  //         urlInfo: {
  //           id: "DCFAFE6105D21B4A6D4530DBF923B939",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/HaQO68Lf_2914703451_shd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=wNMYRAHxSkfLdXyPxEzIXcgwpVWGpmkd&sign=c8fe34edebf3f08120bc0e7411626dbd&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 101293564,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 720,
  //         },
  //         videoGroup: [
  //           {
  //             id: -8005,
  //             name: "#收藏榜#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 3101,
  //             name: "综艺",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 4101,
  //             name: "娱乐",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 72116,
  //             name: "短片",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 23116,
  //             name: "音乐推荐",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "爱之初体验",
  //             id: 185792,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 6453,
  //                 name: "张震岳",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: [],
  //             pop: 100,
  //             st: 0,
  //             rt: "",
  //             fee: 8,
  //             v: 35,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 18885,
  //               name: "滚石香港黄金十年 张震岳精选",
  //               picUrl:
  //                 "http://p4.music.126.net/vxuO3LiU9M6U-6kmvV33XA==/109951163240612176.jpg",
  //               tns: [],
  //               pic_str: "109951163240612176",
  //               pic: 109951163240612180,
  //             },
  //             dt: 243441,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 9740582,
  //               vd: -22218,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 5844367,
  //               vd: -19650,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 3896259,
  //               vd: -18031,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 1,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 0,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 684010,
  //             mv: 10929999,
  //             publishTime: 1036080000000,
  //             privilege: {
  //               id: 185792,
  //               fee: 8,
  //               payed: 0,
  //               st: 0,
  //               pl: 128000,
  //               dl: 0,
  //               sp: 7,
  //               cp: 1,
  //               subp: 1,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 128000,
  //               toast: false,
  //               flag: 68,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "DCFAFE6105D21B4A6D4530DBF923B939",
  //         durationms: 311728,
  //         playTime: 1205309,
  //         praisedCount: 7077,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //     {
  //       type: 1,
  //       displayed: false,
  //       alg: "onlineHotGroup",
  //       extAlg: null,
  //       data: {
  //         alg: "onlineHotGroup",
  //         scm: "1.music-video-timeline.video_timeline.video.181017.-295043608",
  //         threadId: "R_VI_62_A8DC4F82473F218B6F4A7560110BDF72",
  //         coverUrl:
  //           "https://p2.music.126.net/54CsmlqzBwnGW3xUGI4ahw==/109951163804307053.jpg",
  //         height: 1080,
  //         width: 1920,
  //         title: "本可成为张学友，却一心想当周星驰",
  //         description:
  //           "本可成为张学友，却一心想当周星驰，他的这首歌，唱哭无数人",
  //         commentCount: 1072,
  //         shareCount: 988,
  //         resolutions: [
  //           {
  //             resolution: 240,
  //             size: 39751840,
  //           },
  //           {
  //             resolution: 480,
  //             size: 69914355,
  //           },
  //           {
  //             resolution: 720,
  //             size: 110467469,
  //           },
  //           {
  //             resolution: 1080,
  //             size: 129835812,
  //           },
  //         ],
  //         creator: {
  //           defaultAvatar: false,
  //           province: 110000,
  //           authStatus: 1,
  //           followed: false,
  //           avatarUrl:
  //             "http://p1.music.126.net/ANPz4SzgZsnR69qHSMtz_w==/109951164270832395.jpg",
  //           accountStatus: 0,
  //           gender: 1,
  //           city: 110101,
  //           birthday: 720353563017,
  //           userId: 106810354,
  //           userType: 4,
  //           nickname: "中国音乐人",
  //           signature: "我是偷影子的人，\n随风化成一朵云。",
  //           description: "",
  //           detailDescription: "",
  //           avatarImgId: 109951164270832400,
  //           backgroundImgId: 109951164271452850,
  //           backgroundUrl:
  //             "http://p1.music.126.net/erbAKtwUefQuR1CJdEverQ==/109951164271452845.jpg",
  //           authority: 0,
  //           mutual: false,
  //           expertTags: null,
  //           experts: null,
  //           djStatus: 10,
  //           vipType: 11,
  //           remarkName: null,
  //           avatarImgIdStr: "109951164270832395",
  //           backgroundImgIdStr: "109951164271452845",
  //           avatarImgId_str: "109951164270832395",
  //         },
  //         urlInfo: {
  //           id: "A8DC4F82473F218B6F4A7560110BDF72",
  //           url: "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/MIsdYPUt_2258957983_uhd.mp4?ts=1602902982&rid=3009063014E119FC636C42FBC02D0085&rl=3&rs=SwzlGFIuaohHgbEQMUILxWTJpVDNoSRW&sign=dc2ef4fa5c5481ce1b984569b5e713aa&ext=f0xw0mOJqGcf8yfMQn4khLo0vOAZ2Oret6FDS9VvANIOB778zOa0GNkWKbpJigsUUQr5jG+TbSVFBopWbJqfxOMWz6qSwzClvQwG9aI/msQPte7+2SQ2gGKFPduzNhXy/81Ne8nvhkod6vr0JXFqCRZ2dpI6sWzVchry/GdmoJaRw2s1XDLSAyQ1oqJLHpSvPOrqeMkLsgG48vej5u25h9Xk4Oz5m3oL3T7bKoVzbcDl3L+mCrSoqLHT+K/n0tyB",
  //           size: 129835812,
  //           validityTime: 1200,
  //           needPay: false,
  //           payInfo: null,
  //           r: 1080,
  //         },
  //         videoGroup: [
  //           {
  //             id: -22293,
  //             name: "#「粤语」简单情歌，深情粤语#",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57105,
  //             name: "粤语现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57110,
  //             name: "饭拍现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 57108,
  //             name: "流行现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 1100,
  //             name: "音乐现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 58100,
  //             name: "现场",
  //             alg: "groupTagRank",
  //           },
  //           {
  //             id: 5100,
  //             name: "音乐",
  //             alg: "groupTagRank",
  //           },
  //         ],
  //         previewUrl: null,
  //         previewDurationms: 0,
  //         hasRelatedGameAd: false,
  //         markTypes: null,
  //         relateSong: [
  //           {
  //             name: "无赖",
  //             id: 191171,
  //             pst: 0,
  //             t: 0,
  //             ar: [
  //               {
  //                 id: 6473,
  //                 name: "郑中基",
  //                 tns: [],
  //                 alias: [],
  //               },
  //             ],
  //             alia: [],
  //             pop: 100,
  //             st: 0,
  //             rt: "600902000005652669",
  //             fee: 8,
  //             v: 108,
  //             crbt: null,
  //             cf: "",
  //             al: {
  //               id: 19313,
  //               name: "正宗K",
  //               picUrl:
  //                 "http://p4.music.126.net/2vFBKWUmF_jiWGaBgO6RaA==/17648261137761966.jpg",
  //               tns: [],
  //               pic_str: "17648261137761966",
  //               pic: 17648261137761966,
  //             },
  //             dt: 243827,
  //             h: {
  //               br: 320000,
  //               fid: 0,
  //               size: 9756256,
  //               vd: -18600,
  //             },
  //             m: {
  //               br: 192000,
  //               fid: 0,
  //               size: 5853771,
  //               vd: -16000,
  //             },
  //             l: {
  //               br: 128000,
  //               fid: 0,
  //               size: 3902528,
  //               vd: -14500,
  //             },
  //             a: null,
  //             cd: "1",
  //             no: 3,
  //             rtUrl: null,
  //             ftype: 0,
  //             rtUrls: [],
  //             djId: 0,
  //             copyright: 1,
  //             s_id: 0,
  //             rtype: 0,
  //             rurl: null,
  //             mst: 9,
  //             cp: 7002,
  //             mv: 0,
  //             publishTime: 1143849600000,
  //             privilege: {
  //               id: 191171,
  //               fee: 8,
  //               payed: 0,
  //               st: 0,
  //               pl: 128000,
  //               dl: 0,
  //               sp: 7,
  //               cp: 1,
  //               subp: 1,
  //               cs: false,
  //               maxbr: 999000,
  //               fl: 128000,
  //               toast: false,
  //               flag: 256,
  //               preSell: false,
  //             },
  //           },
  //         ],
  //         relatedInfo: null,
  //         videoUserLiveInfo: null,
  //         vid: "A8DC4F82473F218B6F4A7560110BDF72",
  //         durationms: 291834,
  //         playTime: 3701754,
  //         praisedCount: 10838,
  //         praised: false,
  //         subscribed: false,
  //       },
  //     },
  //   ];
  //   let videoList = this.data.videoList;
  //   // 将视频最新的数据更新原有视频列表数据中
  //   videoList.push(...newVideoList);
  //   this.setData({
  //     videoList,
  //   });
  // },
  // 跳转至搜索界面
  toSearch() {
    wx.navigateTo({
      url: "/pages/search/search",
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("页面的下拉刷新");
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // console.log("页面的上拉触底");
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({ from }) {
    console.log(from);
    // if (from === "button") {
    //   return {
    //     title: "来自button的转发",
    //     page: "/pages/video/video",
    //     imageUrl: "/static/images/nvsheng.jpg",
    //   };
    // } else {
    //   return {
    //     title: "来自menu的转发",
    //     page: "/pages/video/video",
    //     imageUrl: "/static/images/nvsheng.jpg",
    //   };
    // }
  },
});
