Component({
  properties: {
    status: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: 'gathering',
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
    updateStatus(status: string, _type: string) {
      const statusMap: Record<string, { text: string; class: string }> = {
        waiting: { text: '等待中', class: 'waiting' },
        nominating: { text: '提名中', class: 'nominating' },
        voting: { text: '投票中', class: 'voting' },
        confirmed: { text: '已确认', class: 'confirmed' },
        departing: { text: '出发中', class: 'departing' },
        completed: { text: '已完成', class: 'completed' },
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