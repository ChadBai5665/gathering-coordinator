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
    iconText: '鈩癸笍',
    messageClass: 'system',
  },

  observers: {
    message: function (message: Message) {
      if (!message) return;

      const iconMap: Record<string, string> = {
        [MessageType.SYSTEM]: '鈩癸笍',
        [MessageType.JOIN]: '馃憢',
        [MessageType.DEPART]: '馃殫',
        [MessageType.ARRIVE]: '✅',
        [MessageType.VOTE]: '🗳️',
        [MessageType.VOTE_RESULT]: '馃搳',
        [MessageType.RESTAURANT_CONFIRMED]: '馃帀',
        [MessageType.REMINDER]: '🔔',
        [MessageType.URGENT]: '馃毃',
        [MessageType.MILESTONE]: '馃弳',
      };

      this.setData({
        iconText: iconMap[message.type] || '鈩癸笍',
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

