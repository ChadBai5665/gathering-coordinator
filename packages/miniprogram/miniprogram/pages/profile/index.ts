import { authStore } from '../../stores/auth';

Page({
  data: {
    userInfo: null as IUserInfo | null,
    avatarText: '',
    shortUserId: '',
  },

  onLoad() {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }

    this.syncUserInfo();
  },

  onShow() {
    if (authStore.isLoggedIn) {
      this.syncUserInfo();
    }
  },

  syncUserInfo() {
    const userInfo = authStore.userInfo;
    this.setData({
      userInfo,
      avatarText: (userInfo?.nickname || '?').slice(0, 1),
      shortUserId: userInfo?.id ? userInfo.id.slice(0, 8) : '',
    });
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
