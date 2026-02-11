import * as api from '../../services/api';
import { gatheringStore, type GatheringState } from '../../stores/gathering';
import { authStore } from '../../stores/auth';
import type { Restaurant } from '../../services/types';

Page({
  data: {
    code: '',
    state: null as GatheringState | null,
    loading: true,
    mapMarkers: [] as any[],
    mapCenterLat: 39.9,
    mapCenterLng: 116.4,
  },

  unsubscribe: null as (() => void) | null,

  async onLoad(options: { code?: string }) {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/index',
      });
      return;
    }

    const code = options.code;
    if (!code) {
      wx.showToast({
        title: '缺少聚会码',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ code });

    // 订阅状态变化
    this.unsubscribe = gatheringStore.subscribe((state) => {
      this.setData({ state, loading: false });
      this.updateMapMarkers(state);
    });

    // 加载聚会数据
    try {
      await gatheringStore.loadGathering(code);
      // 开始轮询
      gatheringStore.startPolling(code);
    } catch (error: any) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onUnload() {
    // 停止轮询
    gatheringStore.stopPolling();
    // 取消订阅
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },

  updateMapMarkers(state: GatheringState) {
    const markers: any[] = [];
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    // 添加参与者标记
    state.participants.forEach((p, index) => {
      if (p.location) {
        markers.push({
          id: index,
          latitude: p.location.lat,
          longitude: p.location.lng,
          iconPath: '/assets/icons/user-marker.png',
          width: 30,
          height: 30,
          label: {
            content: p.nickname,
            fontSize: 12,
            color: '#1a1a1a',
            bgColor: '#ffffff',
            borderRadius: 4,
            padding: 4,
          },
        });
        totalLat += p.location.lat;
        totalLng += p.location.lng;
        count++;
      }
    });

    // 添加餐厅标记
    state.restaurants.forEach((r, index) => {
      markers.push({
        id: 1000 + index,
        latitude: r.location.lat,
        longitude: r.location.lng,
        iconPath: '/assets/icons/restaurant-marker.png',
        width: 35,
        height: 35,
        label: {
          content: r.name,
          fontSize: 12,
          color: '#f2930d',
          bgColor: '#ffffff',
          borderRadius: 4,
          padding: 4,
        },
      });
    });

    // 计算地图中心点
    if (count > 0) {
      this.setData({
        mapMarkers: markers,
        mapCenterLat: totalLat / count,
        mapCenterLng: totalLng / count,
      });
    } else {
      this.setData({ mapMarkers: markers });
    }
  },

  onShareAppMessage() {
    const { state } = this.data;
    if (!state?.gathering) return {};

    return {
      title: `邀请你加入「${state.gathering.name}」`,
      path: `/pages/dashboard/index?code=${state.gathering.code}`,
    };
  },

  onCopyCode() {
    const { state } = this.data;
    if (!state?.gathering) return;

    wx.setClipboardData({
      data: state.gathering.code,
      success: () => {
        wx.showToast({
          title: '邀请码已复制',
          icon: 'success',
        });
      },
    });
  },

  async onRecommend() {
    const { code } = this.data;
    wx.showLoading({ title: '获取推荐中...' });

    try {
      await api.recommend(code);
      wx.hideLoading();
      wx.showToast({
        title: '推荐成功',
        icon: 'success',
      });
    } catch (error: any) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '推荐失败',
        icon: 'none',
      });
    }
  },

  async onVoteRestaurant(e: any) {
    const { restaurant, rank } = e.detail;
    const { code } = this.data;

    wx.showModal({
      title: '发起投票',
      content: `确定要投票选择「${restaurant.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.startVote(code, rank - 1);
            wx.showToast({
              title: '投票已发起',
              icon: 'success',
            });
          } catch (error: any) {
            wx.showToast({
              title: error.message || '投票失败',
              icon: 'none',
            });
          }
        }
      },
    });
  },

  async onCastVote(agree: boolean) {
    const { code, state } = this.data;
    if (!state?.activeVote) return;

    try {
      await api.castVote(code, state.activeVote.id, agree);
      wx.showToast({
        title: agree ? '已投同意' : '已投反对',
        icon: 'success',
      });
    } catch (error: any) {
      wx.showToast({
        title: error.message || '投票失败',
        icon: 'none',
      });
    }
  },

  async onDepart() {
    const { code } = this.data;

    try {
      await api.depart(code);
      wx.showToast({
        title: '已标记出发',
        icon: 'success',
      });
    } catch (error: any) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
      });
    }
  },

  async onArrive() {
    const { code } = this.data;

    try {
      await api.arrive(code);
      wx.showToast({
        title: '已标记到达',
        icon: 'success',
      });
    } catch (error: any) {
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
      });
    }
  },

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },
});
