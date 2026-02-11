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
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 0,
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
