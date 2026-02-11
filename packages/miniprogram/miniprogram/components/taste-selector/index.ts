import { TASTE_OPTIONS } from '../../services/constants';

Component({
  properties: {
    selected: {
      type: Array,
      value: [],
    },
    max: {
      type: Number,
      value: 5,
    },
  },

  data: {
    tasteOptions: TASTE_OPTIONS,
  },

  methods: {
    isSelected(taste: string): boolean {
      return (this.data.selected as string[]).includes(taste);
    },

    onTasteToggle(e: WechatMiniprogram.BaseEvent) {
      const taste = e.currentTarget.dataset.taste as string;
      const selected = [...(this.data.selected as string[])];
      const index = selected.indexOf(taste);

      if (index > -1) {
        // 取消选择
        selected.splice(index, 1);
      } else {
        // 添加选择
        if (selected.length >= this.data.max) {
          wx.showToast({
            title: `最多选择${this.data.max}个口味`,
            icon: 'none',
          });
          return;
        }
        selected.push(taste);
      }

      this.triggerEvent('change', { selected });
    },
  },
});
