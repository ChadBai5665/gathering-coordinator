Component({
  properties: {
    icon: {
      type: String,
      value: 'inbox',
    },
    title: {
      type: String,
      value: '暂无数据',
    },
    description: {
      type: String,
      value: '',
    },
  },

  data: {
    iconText: '📦',
  },

  observers: {
    icon: function (icon: string) {
      const iconMap: Record<string, string> = {
        inbox: '📦',
        search: '🔍',
        calendar: '📅',
        user: '👤',
        restaurant: '🍽️',
        location: '📍',
      };
      this.setData({
        iconText: iconMap[icon] || '📦',
      });
    },
  },
});
