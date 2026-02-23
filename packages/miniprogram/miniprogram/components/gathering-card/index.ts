import type { GatheringDetail } from '../../services/types';

Component({
  properties: {
    gathering: {
      type: Object,
      value: {} as WechatMiniprogram.IAnyObject,
    },
  },

  data: {
    targetTimeText: '',
    participantCountText: '-',
    statusText: '',
  },

  observers: {
    gathering(gathering: WechatMiniprogram.IAnyObject) {
      if (!gathering) return;

      const participantCountText =
        typeof gathering.participant_count === 'number'
          ? String(gathering.participant_count)
          : '-';

      this.setData({
        targetTimeText: this.formatTime(gathering.target_time as string),
        participantCountText,
        statusText: typeof gathering.status === 'string' ? gathering.status : '',
      });
    },
  },

  methods: {
    formatTime(timeStr: string): string {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${hour}:${minute}`;
    },

    onCardTap() {
      const gathering = this.data.gathering as GatheringDetail;
      if (gathering && gathering.code) {
        wx.navigateTo({
          url: `/pages/dashboard/index?code=${gathering.code}`,
        });
      }
    },
  },
});
