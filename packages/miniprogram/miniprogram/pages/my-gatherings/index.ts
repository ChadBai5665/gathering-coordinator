import * as api from '../../services/api';
import type { GatheringDetail } from '../../services/types';
import { authStore } from '../../stores/auth';

Page({
  data: {
    activeTab: 'all', // all | waiting | active | completed | cancelled
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
      const gatherings = await api.getMyGatherings();
      this.setData({
        gatherings,
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

    if (activeTab === 'waiting') {
      filtered = gatherings.filter(g => g.status === 'waiting');
    } else if (activeTab === 'active') {
      filtered = gatherings.filter(g => ['recommending', 'voting', 'confirmed', 'active'].includes(g.status));
    } else if (activeTab === 'completed') {
      filtered = gatherings.filter(g => g.status === 'completed');
    } else if (activeTab === 'cancelled') {
      filtered = gatherings.filter(g => g.status === 'cancelled');
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
