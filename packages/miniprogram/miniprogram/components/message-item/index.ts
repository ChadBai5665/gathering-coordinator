import type { Message } from '../../services/types';
import { MessageType } from '../../services/constants';

Component({
  properties: {
    message: {
      type: Object,
      value: {} as WechatMiniprogram.IAnyObject,
    },
  },

  data: {
    iconText: 'i',
    messageClass: 'system',
    timeText: '',
  },

  observers: {
    message: function (message: Message) {
      if (!message) return;

      const iconMap: Record<string, string> = {
        [MessageType.PARTICIPANT_JOINED]: 'J',
        [MessageType.NOMINATING_STARTED]: 'N',
        [MessageType.RESTAURANT_NOMINATED]: 'R',
        [MessageType.NOMINATION_WITHDRAWN]: 'W',
        [MessageType.VOTE_STARTED]: 'V',
        [MessageType.VOTE_PASSED]: 'P',
        [MessageType.VOTE_REJECTED]: 'X',
        [MessageType.DEPARTED]: 'D',
        [MessageType.ARRIVED]: 'A',
        [MessageType.NUDGE]: '!',
        [MessageType.ALL_ARRIVED]: 'OK',
      };

      this.setData({
        iconText: iconMap[message.type] || 'i',
        messageClass: message.type,
        timeText: this.formatTime(message.created_at),
      });
    },
  },

  methods: {
    formatTime(timeStr: string): string {
      if (!timeStr) return '';
      const date = new Date(timeStr);
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${hour}:${minute}`;
    },
  },
});
