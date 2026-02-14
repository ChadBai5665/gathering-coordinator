Component({
  properties: {
    icon: {
      type: String,
      value: 'inbox',
    },
    title: {
      type: String,
      value: '鏆傛棤鏁版嵁',
    },
    description: {
      type: String,
      value: '',
    },
  },

  data: {
    iconText: '馃摝',
  },

  observers: {
    icon: function (icon: string) {
      const iconMap: Record<string, string> = {
        inbox: '馃摝',
        search: '馃攳',
        calendar: '馃搮',
        user: '馃懁',
        restaurant: '🍣',
        location: '馃搷',
      };
      this.setData({
        iconText: iconMap[icon] || '馃摝',
      });
    },
  },
});

