import * as api from '../../services/api';
import { authStore } from '../../stores/auth';

Page({
  data: {
    // 创建聚会相关
    gatheringName: '',
    selectedTastes: [] as string[],
    targetDate: '',
    targetTime: '',
    loading: false,

    // 加入聚会相关
    inviteCode: '',

    // 我的聚会列表
    myGatherings: [] as any[],
    loadingGatherings: false,
  },

  onLoad() {
    // 设置默认日期时间为明天中午12点
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hour = String(tomorrow.getHours()).padStart(2, '0');
    const minute = String(tomorrow.getMinutes()).padStart(2, '0');

    this.setData({
      targetDate: `${year}-${month}-${day}`,
      targetTime: `${hour}:${minute}`,
    });
  },

  onShow() {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }

    this.loadMyGatherings();
  },

  async loadMyGatherings() {
    this.setData({ loadingGatherings: true });
    try {
      const gatherings = await api.getMyGatherings();
      this.setData({
        myGatherings: gatherings.slice(0, 3),
        loadingGatherings: false,
      });
    } catch (error) {
      this.setData({ loadingGatherings: false });
    }
  },

  // 创建聚会相关
  onGatheringNameInput(e: WechatMiniprogram.Input) {
    this.setData({
      gatheringName: e.detail.value.trim(),
    });
  },

  onTasteChange(e: any) {
    this.setData({
      selectedTastes: e.detail.selected,
    });
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      targetDate: e.detail.value as string,
    });
  },

  onTimeChange(e: WechatMiniprogram.PickerChange) {
    this.setData({
      targetTime: e.detail.value as string,
    });
  },

  async onCreateGathering() {
    if (!this.data.gatheringName) {
      wx.showToast({
        title: '请输入聚会名称',
        icon: 'none',
      });
      return;
    }

    if (!this.data.targetDate || !this.data.targetTime) {
      wx.showToast({
        title: '请选择目标时间',
        icon: 'none',
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 先获取位置
      const location = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
          fail: (err) => {
            console.error('[Create] 获取位置失败:', err);
            reject(err);
          },
        });
      });

      // 构造 ISO 8601 时间格式
      const localDate = new Date(`${this.data.targetDate}T${this.data.targetTime}:00`);
      const targetTime = localDate.toISOString();
      const userInfo = authStore.userInfo;

      // 创建聚会
      const gathering = await api.createGathering({
        name: this.data.gatheringName,
        target_time: targetTime,
        creator_nickname: userInfo?.nickname || '我',
        creator_tastes: this.data.selectedTastes,
      });

      // 立即上传位置信息
      try {
        await api.updateLocation(gathering.code, {
          lat: location.latitude,
          lng: location.longitude,
        });
        console.log('[Create] 已上传位置信息');
      } catch (updateError: any) {
        console.error('[Create] 上传位置失败:', updateError);
        // 位置上传失败不阻塞流程，用户可以稍后在 dashboard 上传
      }

      wx.showToast({
        title: '创建成功',
        icon: 'success',
      });

      // 跳转到聚会仪表盘
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/dashboard/index?code=${gathering.code}`,
        });
      }, 1000);

      // 重置表单
      this.setData({
        gatheringName: '',
        selectedTastes: [],
        loading: false,
      });
    } catch (error: any) {
      console.error('[Create] 创建失败:', error);
      wx.showToast({
        title: error.message || '创建失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  // 加入聚会相关
  onInviteCodeInput(e: WechatMiniprogram.Input) {
    this.setData({
      inviteCode: e.detail.value.trim().toUpperCase(),
    });
  },

  async onJoinGathering() {
    if (!this.data.inviteCode || this.data.inviteCode.length !== 6) {
      wx.showToast({
        title: '请输入6位邀请码',
        icon: 'none',
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const userInfo = authStore.userInfo;
      await api.joinGathering(this.data.inviteCode, {
        nickname: userInfo?.nickname || '朋友',
        tastes: userInfo?.preferences?.default_tastes || [],
      });

      wx.showToast({
        title: '加入成功',
        icon: 'success',
      });

      // 跳转到聚会仪表盘
      setTimeout(() => {
        wx.navigateTo({
          url: `/pages/dashboard/index?code=${this.data.inviteCode}`,
        });
      }, 1000);

      // 重置表单
      this.setData({
        inviteCode: '',
        loading: false,
      });
    } catch (error: any) {
      wx.showToast({
        title: error.message || '加入失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onViewAllGatherings() {
    wx.switchTab({
      url: '/pages/my-gatherings/index',
    });
  },
});
