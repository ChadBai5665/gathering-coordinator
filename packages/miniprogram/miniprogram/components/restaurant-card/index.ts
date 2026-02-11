import type { Restaurant } from '../../services/types';

Component({
  properties: {
    restaurant: {
      type: Object,
      value: {} as WechatMiniprogram.IAnyObject,
    },
    rank: {
      type: Number,
      value: 1,
    },
    showVoteBtn: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onVote() {
      this.triggerEvent('vote', {
        restaurant: this.data.restaurant,
        rank: this.data.rank,
      });
    },
  },
});
