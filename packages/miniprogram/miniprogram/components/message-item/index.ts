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
    iconText: 'ℹ️',
    messageClass: 'system',
  },

  observers: {
    message: function (message: Message) {
      if (!message) return;

      const iconMap: Record<string, string> = {
        [MessageType.SYSTEM]: 'ℹ️',
        [MessageType.JOIN]: '👋',
        [MessageType.DEPART]: '🚗',
        [MessageType.ARRIVE]: '✅',
        [MessageType.VOTE]: '🗳️',
        [MessageType.VOTE_RESULT]: '📊',
        [MessageType.RESTAURANT_CONFIRMED]: '🎉',
        [MessageType.REMINDER]: '⏰',
        [MessageType.URGENT]: '🚨',
        [MessageType.MILESTONE]: '🏆',
      };

      this.setData({
        iconText: iconMap[message.type] || 'ℹ️',
        messageClass: message.type,
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
