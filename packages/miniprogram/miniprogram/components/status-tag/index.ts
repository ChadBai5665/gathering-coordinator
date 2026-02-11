Component({
  properties: {
    status: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: 'gathering', // 'gathering' | 'participant'
    },
  },

  data: {
    statusText: '',
    statusClass: '',
  },

  observers: {
    'status, type': function (status: string, type: string) {
      this.updateStatus(status, type);
    },
  },

  methods: {
    updateStatus(status: string, type: string) {
      const statusMap: Record<string, { text: string; class: string }> = {
        // Gathering statuses
        waiting: { text: '等待中', class: 'waiting' },
        recommending: { text: '推荐中', class: 'recommending' },
        voting: { text: '投票中', class: 'voting' },
        confirmed: { text: '已确认', class: 'confirmed' },
        active: { text: '进行中', class: 'active' },
        completed: { text: '已完成', class: 'completed' },
        cancelled: { text: '已取消', class: 'cancelled' },
        // Participant statuses
        joined: { text: '已加入', class: 'joined' },
        departed: { text: '已出发', class: 'departed' },
        arrived: { text: '已到达', class: 'arrived' },
      };

      const config = statusMap[status] || { text: status, class: 'waiting' };
      this.setData({
        statusText: config.text,
        statusClass: config.class,
      });
    },
  },
});
