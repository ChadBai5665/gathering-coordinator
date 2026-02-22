import * as api from '../../services/api';
import { gatheringStore, type GatheringState } from '../../stores/gathering';
import { authStore } from '../../stores/auth';
import type { AiSuggestion, Nomination, SearchRestaurantResult } from '../../services/types';

Page({
  data: {
    code: '',
    state: null as GatheringState | null,
    loading: true,

    me: null as any,
    isCreator: false,
    myNominationCount: 0,
    canStartVoting: false,
    confirmedNomination: null as Nomination | null,

    searchKeyword: '',
    searchResults: [] as SearchRestaurantResult[],
    aiTasteInput: '',
    aiSuggestions: [] as AiSuggestion[],
    actionLoading: false,

    voteCounts: {} as Record<string, number>,

    mapMarkers: [] as any[],
    mapCenterLat: 39.9,
    mapCenterLng: 116.4,
  },

  unsubscribe: null as (() => void) | null,

  async onLoad(options: { code?: string }) {
    if (!authStore.isLoggedIn) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }

    const code = options.code;
    if (!code) {
      wx.showToast({ title: '缺少聚会码', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
      return;
    }

    this.setData({ code });

    this.unsubscribe = gatheringStore.subscribe((state) => {
      this.handleStoreUpdate(state);
    });

    try {
      await gatheringStore.loadGathering(code);
      await this.autoJoinWithLocation(code);
      gatheringStore.startPolling(code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onUnload() {
    gatheringStore.stopPolling();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },

  handleStoreUpdate(state: GatheringState) {
    const userId = authStore.userInfo?.id;
    const me = userId ? state.participants.find((p) => p.user_id === userId) || null : null;
    const isCreator = !!(
      (me && me.is_creator) ||
      (userId && state.gathering && state.gathering.creator_id === userId)
    );

    const myNominationCount = me
      ? state.nominations.filter((n) => n.nominated_by === me.id).length
      : 0;

    const canStartVoting = !!(
      isCreator &&
      state.gathering?.status === 'nominating' &&
      state.nominations.length >= 2
    );

    const confirmedNomination = state.nominations.find((n) => n.is_confirmed) || null;

    const voteCounts: Record<string, number> = {};
    for (const nomination of state.nominations) {
      voteCounts[nomination.id] = 0;
    }
    if (state.activeVote) {
      for (const item of state.activeVote.vote_counts) {
        voteCounts[item.nomination_id] = item.count;
      }
    }

    this.setData({
      state,
      loading: false,
      me,
      isCreator,
      myNominationCount,
      canStartVoting,
      confirmedNomination,
      voteCounts,
    });

    this.updateMapMarkers(state);
  },

  async autoJoinWithLocation(code: string) {
    try {
      const location = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
          fail: (err) => reject(err),
        });
      });

      const payload = {
        lat: location.latitude,
        lng: location.longitude,
      };

      try {
        await api.updateLocation(code, payload);
      } catch (error: any) {
        // 如果尚未加入，且聚会还在 waiting，则尝试自动加入
        if (error?.code === 'NOT_JOINED') {
          const nickname = authStore.userInfo?.nickname || '朋友';
          await api.joinGathering(code, {
            nickname,
            location: { lng: payload.lng, lat: payload.lat },
          });
        } else {
          throw error;
        }
      }

      await gatheringStore.loadGathering(code);
    } catch (error: any) {
      console.error('[Dashboard] 自动上传位置失败:', error);
    }
  },

  updateMapMarkers(state: GatheringState) {
    const markers: any[] = [];
    let totalLat = 0;
    let totalLng = 0;
    let count = 0;

    state.participants.forEach((p, index) => {
      if (!p.location) return;

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
      count += 1;
    });

    state.nominations.forEach((n, index) => {
      markers.push({
        id: 1000 + index,
        latitude: n.location.lat,
        longitude: n.location.lng,
        iconPath: '/assets/icons/restaurant-marker.png',
        width: 35,
        height: 35,
        label: {
          content: n.name,
          fontSize: 12,
          color: '#f2930d',
          bgColor: '#ffffff',
          borderRadius: 4,
          padding: 4,
        },
      });
    });

    if (count > 0) {
      this.setData({
        mapMarkers: markers,
        mapCenterLat: totalLat / count,
        mapCenterLng: totalLng / count,
      });
      return;
    }

    this.setData({ mapMarkers: markers });
  },

  onShareAppMessage() {
    const state = this.data.state;
    if (!state?.gathering) {
      return {};
    }

    return {
      title: `邀请你加入「${state.gathering.name}」`,
      path: `/pages/dashboard/index?code=${state.gathering.code}`,
    };
  },

  onCopyCode() {
    const state = this.data.state;
    if (!state?.gathering) return;

    wx.setClipboardData({
      data: state.gathering.code,
      success: () => {
        wx.showToast({ title: '邀请码已复制', icon: 'success' });
      },
    });
  },

  onSearchKeywordInput(e: WechatMiniprogram.Input) {
    this.setData({ searchKeyword: (e.detail.value || '').trim() });
  },

  async onSearchRestaurants() {
    const { code, searchKeyword } = this.data;
    if (!searchKeyword) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }

    this.setData({ actionLoading: true });
    try {
      const result = await api.searchRestaurants(code, searchKeyword, 1);
      this.setData({ searchResults: result.restaurants, actionLoading: false });
    } catch (error: any) {
      wx.showToast({ title: error.message || '搜索失败', icon: 'none' });
      this.setData({ actionLoading: false });
    }
  },

  onAiTastesInput(e: WechatMiniprogram.Input) {
    this.setData({ aiTasteInput: e.detail.value || '' });
  },

  async onAiSuggest() {
    const { code, aiTasteInput } = this.data;
    const tastes = aiTasteInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tastes.length === 0) {
      wx.showToast({ title: '请输入口味关键词', icon: 'none' });
      return;
    }

    this.setData({ actionLoading: true });
    try {
      const result = await api.aiSuggest(code, tastes);
      this.setData({ aiSuggestions: result.suggestions, actionLoading: false });
    } catch (error: any) {
      wx.showToast({ title: error.message || '推荐失败', icon: 'none' });
      this.setData({ actionLoading: false });
    }
  },

  async onNominateSearch(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.searchResults[index];
    if (!item) return;

    this.setData({ actionLoading: true });
    try {
      await api.nominate(this.data.code, {
        amap_id: item.amap_id,
        name: item.name,
        type: item.type,
        address: item.address,
        location: item.location,
        rating: item.rating || undefined,
        cost: item.cost || undefined,
        source: 'manual',
      });

      wx.showToast({ title: '提名成功', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '提名失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onNominateSuggestion(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.aiSuggestions[index];
    if (!item) return;

    this.setData({ actionLoading: true });
    try {
      await api.nominate(this.data.code, {
        amap_id: item.amap_id,
        name: item.name,
        type: item.type,
        address: item.address,
        location: item.location,
        rating: item.rating || undefined,
        cost: item.cost || undefined,
        source: 'ai',
        reason: item.reason,
      });

      wx.showToast({ title: '提名成功', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '提名失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onWithdrawNomination(e: WechatMiniprogram.BaseEvent) {
    const nominationId = String(e.currentTarget.dataset.id || '');
    if (!nominationId) return;

    this.setData({ actionLoading: true });
    try {
      await api.withdrawNomination(this.data.code, nominationId);
      wx.showToast({ title: '已撤回', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '撤回失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onStartNominating() {
    this.setData({ actionLoading: true });
    try {
      await api.startNominating(this.data.code);
      wx.showToast({ title: '已开始提名', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onStartVoting() {
    this.setData({ actionLoading: true });
    try {
      await api.startVoting(this.data.code);
      wx.showToast({ title: '已开始投票', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onCastVote(e: WechatMiniprogram.BaseEvent) {
    const nominationId = String(e.currentTarget.dataset.nominationId || '');
    const voteId = this.data.state?.activeVote?.id;
    if (!voteId || !nominationId) return;

    this.setData({ actionLoading: true });
    try {
      const result = await api.castVote(this.data.code, voteId, nominationId);
      if (result.result?.winner_name) {
        wx.showToast({ title: `结果：${result.result.winner_name}`, icon: 'none' });
      } else {
        wx.showToast({ title: '投票成功', icon: 'success' });
      }
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '投票失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onDepart() {
    this.setData({ actionLoading: true });
    try {
      await api.depart(this.data.code);
      wx.showToast({ title: '已标记出发', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
    }
  },

  async onArrive() {
    this.setData({ actionLoading: true });
    try {
      await api.arrive(this.data.code);
      wx.showToast({ title: '已标记到达', icon: 'success' });
      await gatheringStore.loadGathering(this.data.code);
    } catch (error: any) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: false });
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