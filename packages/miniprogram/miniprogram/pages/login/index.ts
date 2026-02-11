import * as api from '../../services/api';
import { authStore } from '../../stores/auth';

Page({
  data: {
    nickname: '',
    loading: false,
  },

  onNicknameInput(e: WechatMiniprogram.Input) {
    this.setData({
      nickname: e.detail.value.trim(),
    });
  },

  async onGuestLogin() {
    if (!this.data.nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const response = await api.guestLogin(this.data.nickname);

      // 保存认证信息
      authStore.login(response.access_token, response.user);

      wx.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }, 1000);
    } catch (error: any) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onWechatLogin() {
    wx.showToast({
      title: '微信登录即将上线',
      icon: 'none',
    });
  },
});
