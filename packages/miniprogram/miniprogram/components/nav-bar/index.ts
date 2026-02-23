Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    showBack: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    statusBarHeight: 0,
  },

  lifetimes: {
    attached() {
      const windowInfo =
        typeof wx.getWindowInfo === 'function' ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 0,
      });
    },
  },

  methods: {
    onBack() {
      this.triggerEvent('back');
      wx.navigateBack();
    },
  },
});
