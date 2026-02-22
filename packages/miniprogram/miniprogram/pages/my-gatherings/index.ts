import * as api from '../../services/api';
import type { GatheringDetail } from '../../services/types';
import { authStore } from '../../stores/auth';

Page({
  data: {
    activeTab: 'all', // all | active | completed
    gatherings: [] as GatheringDetail[],
    filteredGatherings: [] as GatheringDetail[],
    loading: false,
    refreshing: false,
  },

  onLoad() {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }
    this.loadGatherings();
  },

  onShow() {
    if (authStore.isLoggedIn) {
      this.loadGatherings();
    }
  },

  async loadGatherings() {
    this.setData({ loading: true });

    try {
      const result = await api.getMyGatherings({ limit: 100, offset: 0 });
      this.setData({
        gatherings: result.gatherings,
        loading: false,
      });
      this.filterGatherings();
    } catch (error: any) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onTabChange(e: WechatMiniprogram.BaseEvent) {
    const tab = e.currentTarget.dataset.tab as string;
    this.setData({ activeTab: tab });
    this.filterGatherings();
  },

  filterGatherings() {
    const { activeTab, gatherings } = this.data;
    let filtered = gatherings;

    if (activeTab === 'active') {
      filtered = gatherings.filter((g) =>
        ['waiting', 'nominating', 'voting', 'confirmed', 'departing'].includes(g.status),
      );
    } else if (activeTab === 'completed') {
      filtered = gatherings.filter((g) => g.status === 'completed');
    }

    this.setData({ filteredGatherings: filtered });
  },

  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    await this.loadGatherings();
    this.setData({ refreshing: false });
    wx.stopPullDownRefresh();
  },
});