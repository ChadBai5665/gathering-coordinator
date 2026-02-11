import * as api from '../../services/api';
import { authStore } from '../../stores/auth';
import type { GatheringDetail } from '../../services/types';

Page({
  data: {
    nickname: '',
    // 创建聚会
    gatheringName: '',
    targetDate: '',
    targetTime: '',
    selectedTastes: [] as string[],
    // 加入聚会
    inviteCode: '',
    // 我的聚会列表
    myGatherings: [] as GatheringDetail[],
    loading: false,
  },

  onLoad() {
    // 检查登录状态
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }

    const userInfo = authStore.userInfo;
    this.setData({
      nickname: userInfo?.nickname || '朋友',
    });

    // 初始化默认时间（当前时间+2小时）
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const date = now.toISOString().split('T')[0];
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.setData({
      targetDate: date,
      targetTime: time,
    });

    this.loadMyGatherings();
  },

  onShow() {
    if (authStore.isLoggedIn) {
      this.loadMyGatherings();
    }
  },

  async loadMyGatherings() {
    try {
      const gatherings = await api.getMyGatherings();
      // 只显示进行中的聚会，最多3个
      const activeGatherings = gatherings
        .filter(g => ['waiting', 'recommending', 'voting', 'confirmed', 'active'].includes(g.status))
        .slice(0, 3);

      this.setData({
        myGatherings: activeGatherings,
      });
    } catch (error: any) {
      console.error('加载聚会列表失败:', error);
    }
  },

  // 创建聚会相关
  onGatheringNameInput(e: WechatMiniprogram.Input) {
    this.setData({
      gatheringName: e.detail.value.trim(),
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

  onTasteChange(e: any) {
    this.setData({
      selectedTastes: e.detail.selected,
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
      const targetTime = `${this.data.targetDate}T${this.data.targetTime}:00`;
      const userInfo = authStore.userInfo;

      const gathering = await api.createGathering({
        name: this.data.gatheringName,
        target_time: targetTime,
        creator_nickname: userInfo?.nickname || '我',
        creator_tastes: this.data.selectedTastes,
      });

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
