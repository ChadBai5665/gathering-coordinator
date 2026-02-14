import { authStore } from '../../stores/auth';

Page({
  data: {
    userInfo: null as IUserInfo | null,
  },

  onLoad() {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }

    this.setData({
      userInfo: authStore.userInfo,
    });
  },

  onShow() {
    if (authStore.isLoggedIn) {
      this.setData({
        userInfo: authStore.userInfo,
      });
    }
  },

  onEditProfile() {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none',
    });
  },

  onDefaultTastes() {
    wx.showToast({
      title: '口味设置开发中',
      icon: 'none',
    });
  },

  onNotificationSettings() {
    wx.showToast({
      title: '通知设置开发中',
      icon: 'none',
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于聚个饭',
      content: '聚个饭 v1.0.0\n\n和朋友一起，吃点好的。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          authStore.logout();
          wx.reLaunch({
            url: '/pages/login/index',
          });
        }
      },
    });
  },
});
