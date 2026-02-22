import * as api from '../../services/api';
import { authStore } from '../../stores/auth';

Page({
  data: {
    nickname: '',

    // 创建聚会
    gatheringName: '',
    targetDate: '',
    targetTime: '',
    loading: false,

    // 加入聚会
    inviteCode: '',

    // 我的聚会列表
    myGatherings: [] as any[],
    loadingGatherings: false,
  },

  onLoad() {
    // 默认时间：明天中午 12 点
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
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }

    this.setData({
      nickname: authStore.userInfo?.nickname || '朋友',
    });

    this.loadMyGatherings();
  },

  async loadMyGatherings() {
    this.setData({ loadingGatherings: true });
    try {
      const result = await api.getMyGatherings({ status: 'active', limit: 3, offset: 0 });
      this.setData({ myGatherings: result.gatherings || [], loadingGatherings: false });
    } catch {
      this.setData({ loadingGatherings: false });
    }
  },

  // 创建聚会相关
  onGatheringNameInput(e: WechatMiniprogram.Input) {
    this.setData({ gatheringName: e.detail.value.trim() });
  },

  onDateChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ targetDate: e.detail.value as string });
  },

  onTimeChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ targetTime: e.detail.value as string });
  },

  async onCreateGathering() {
    if (!this.data.gatheringName) {
      wx.showToast({ title: '请输入聚会名称', icon: 'none' });
      return;
    }

    if (!this.data.targetDate || !this.data.targetTime) {
      wx.showToast({ title: '请选择目标时间', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const localDate = new Date(`${this.data.targetDate}T${this.data.targetTime}:00`);
      const targetTime = localDate.toISOString();
      const userInfo = authStore.userInfo;

      const gathering = await api.createGathering({
        name: this.data.gatheringName,
        target_time: targetTime,
        creator_nickname: userInfo?.nickname || '我',
      });

      // 上传位置信息（失败不阻塞）
      try {
        const location = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          wx.getLocation({
            type: 'gcj02',
            success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
            fail: (err) => reject(err),
          });
        });

        await api.updateLocation(gathering.code, {
          lat: location.latitude,
          lng: location.longitude,
        });
      } catch {
        // ignore location failures
      }

      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/dashboard/index?code=${gathering.code}` });
      }, 700);

      this.setData({ gatheringName: '', loading: false });
    } catch (error: any) {
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  // 加入聚会相关
  onInviteCodeInput(e: WechatMiniprogram.Input) {
    const raw = (e.detail.value || '').toUpperCase();
    this.setData({ inviteCode: raw.replace(/[^A-Z0-9-]/g, '') });
  },

  async onJoinGathering() {
    const normalizedCode = this.data.inviteCode.replace(/-/g, '').trim().toUpperCase();
    if (!normalizedCode || normalizedCode.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const userInfo = authStore.userInfo;
      const payload: { nickname: string; location?: { lng: number; lat: number } } = {
        nickname: userInfo?.nickname || '朋友',
      };

      try {
        const location = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          wx.getLocation({
            type: 'gcj02',
            success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
            fail: (err) => reject(err),
          });
        });

        payload.location = { lng: location.longitude, lat: location.latitude };
      } catch {
        // ignore location failures
      }

      await api.joinGathering(normalizedCode, payload);

      wx.showToast({ title: '加入成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateTo({ url: `/pages/dashboard/index?code=${normalizedCode}` });
      }, 700);

      this.setData({ inviteCode: '', loading: false });
    } catch (error: any) {
      wx.showToast({ title: error.message || '加入失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onViewAllGatherings() {
    wx.switchTab({ url: '/pages/my-gatherings/index' });
  },
});