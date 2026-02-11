import { describe, it, expect } from 'vitest';
import {
  calculateDepartureTime,
  getTimeRemaining,
  formatCountdown,
  formatDuration,
  formatTime,
  isExpired,
  shouldRemindDeparture,
} from '../time.js';

describe('time', () => {
  describe('calculateDepartureTime', () => {
    it('应正确计算出发时间（默认 10 分钟缓冲）', () => {
      const targetTime = new Date('2025-01-15T18:00:00Z');
      const travelDuration = 1800; // 30 分钟
      const departure = calculateDepartureTime(targetTime, travelDuration);

      // 18:00 - 30min - 10min = 17:20
      expect(departure.toISOString()).toBe('2025-01-15T17:20:00.000Z');
    });

    it('应支持自定义缓冲时间', () => {
      const targetTime = new Date('2025-01-15T18:00:00Z');
      const travelDuration = 1800; // 30 分钟
      const departure = calculateDepartureTime(targetTime, travelDuration, 5);

      // 18:00 - 30min - 5min = 17:25
      expect(departure.toISOString()).toBe('2025-01-15T17:25:00.000Z');
    });

    it('应支持 0 缓冲时间', () => {
      const targetTime = new Date('2025-01-15T18:00:00Z');
      const travelDuration = 3600; // 60 分钟
      const departure = calculateDepartureTime(targetTime, travelDuration, 0);

      // 18:00 - 60min - 0min = 17:00
      expect(departure.toISOString()).toBe('2025-01-15T17:00:00.000Z');
    });

    it('应支持 ISO 字符串输入', () => {
      const departure = calculateDepartureTime('2025-01-15T18:00:00Z', 1800);
      expect(departure.toISOString()).toBe('2025-01-15T17:20:00.000Z');
    });

    it('行程时长为 0 时只减去缓冲时间', () => {
      const targetTime = new Date('2025-01-15T18:00:00Z');
      const departure = calculateDepartureTime(targetTime, 0);

      // 18:00 - 0min - 10min = 17:50
      expect(departure.toISOString()).toBe('2025-01-15T17:50:00.000Z');
    });

    it('出发时间可能早于当天（跨天场景）', () => {
      const targetTime = new Date('2025-01-15T00:10:00Z');
      const travelDuration = 3600; // 60 分钟
      const departure = calculateDepartureTime(targetTime, travelDuration);

      // 00:10 - 60min - 10min = 前一天 23:00
      expect(departure.toISOString()).toBe('2025-01-14T23:00:00.000Z');
    });
  });

  describe('getTimeRemaining', () => {
    it('未来时间应返回正数', () => {
      const future = new Date('2099-01-01T00:00:00Z');
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      const remaining = getTimeRemaining(future, now);
      expect(remaining).toBeGreaterThan(0);
    });

    it('过去时间应返回 0', () => {
      const past = new Date('2020-01-01T00:00:00Z');
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(getTimeRemaining(past, now)).toBe(0);
    });

    it('当前时间应返回 0', () => {
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(getTimeRemaining(new Date(now), now)).toBe(0);
    });

    it('应正确计算剩余毫秒数', () => {
      const target = new Date('2025-01-01T01:00:00Z');
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      // 1 小时 = 3600000 ms
      expect(getTimeRemaining(target, now)).toBe(3600000);
    });

    it('应支持 ISO 字符串输入', () => {
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(getTimeRemaining('2025-01-01T01:00:00Z', now)).toBe(3600000);
    });
  });

  describe('formatCountdown', () => {
    it('0 或负数应返回"已到时间"', () => {
      expect(formatCountdown(0)).toBe('已到时间');
      expect(formatCountdown(-1000)).toBe('已到时间');
    });

    it('应正确格式化小时和分钟', () => {
      // 2 小时 30 分钟
      expect(formatCountdown(2 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('2小时30分钟');
    });

    it('整小时应省略分钟', () => {
      expect(formatCountdown(2 * 60 * 60 * 1000)).toBe('2小时');
    });

    it('不足 1 小时应只显示分钟', () => {
      expect(formatCountdown(45 * 60 * 1000)).toBe('45分钟');
    });

    it('不足 1 分钟应显示"不到1分钟"', () => {
      expect(formatCountdown(30 * 1000)).toBe('不到1分钟');
      expect(formatCountdown(1)).toBe('不到1分钟');
    });

    it('恰好 1 分钟', () => {
      expect(formatCountdown(60 * 1000)).toBe('1分钟');
    });

    it('恰好 1 小时', () => {
      expect(formatCountdown(60 * 60 * 1000)).toBe('1小时');
    });
  });

  describe('formatDuration', () => {
    it('0 或负数应返回"0分钟"', () => {
      expect(formatDuration(0)).toBe('0分钟');
      expect(formatDuration(-100)).toBe('0分钟');
    });

    it('应正确格式化秒数为时长', () => {
      expect(formatDuration(1800)).toBe('约30分钟');
      expect(formatDuration(5400)).toBe('约1小时30分钟');
    });

    it('整小时应省略分钟', () => {
      expect(formatDuration(3600)).toBe('约1小时');
    });

    it('不足 1 分钟应向上取整为 1 分钟', () => {
      expect(formatDuration(30)).toBe('约1分钟');
      expect(formatDuration(1)).toBe('约1分钟');
    });

    it('非整分钟应向上取整', () => {
      // 91 秒 → ceil = 2 分钟
      expect(formatDuration(91)).toBe('约2分钟');
    });
  });

  describe('formatTime', () => {
    it('应格式化为 HH:mm', () => {
      const date = new Date('2025-01-15T08:05:00Z');
      const result = formatTime(date);
      // 注意：结果取决于运行环境的时区，这里用 UTC 构造
      // 在 UTC 环境下应为 "08:05"
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('应支持 ISO 字符串输入', () => {
      const result = formatTime('2025-01-15T08:05:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('小时和分钟应补零', () => {
      // 创建一个本地时间为 01:02 的 Date
      const date = new Date(2025, 0, 15, 1, 2, 0);
      expect(formatTime(date)).toBe('01:02');
    });
  });

  describe('isExpired', () => {
    it('过去时间应返回 true', () => {
      const now = new Date('2025-06-01T00:00:00Z').getTime();
      expect(isExpired('2025-01-01T00:00:00Z', now)).toBe(true);
    });

    it('未来时间应返回 false', () => {
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(isExpired('2025-06-01T00:00:00Z', now)).toBe(false);
    });

    it('当前时间应返回 true（边界）', () => {
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(isExpired('2025-01-01T00:00:00Z', now)).toBe(true);
    });

    it('应支持 Date 对象输入', () => {
      const target = new Date('2020-01-01T00:00:00Z');
      const now = new Date('2025-01-01T00:00:00Z').getTime();
      expect(isExpired(target, now)).toBe(true);
    });
  });

  describe('shouldRemindDeparture', () => {
    it('出发时间已到应返回 true', () => {
      const departureTime = '2025-01-15T17:20:00Z';
      const now = new Date('2025-01-15T17:25:00Z').getTime();
      expect(shouldRemindDeparture(departureTime, now)).toBe(true);
    });

    it('出发时间未到应返回 false', () => {
      const departureTime = '2025-01-15T17:20:00Z';
      const now = new Date('2025-01-15T17:00:00Z').getTime();
      expect(shouldRemindDeparture(departureTime, now)).toBe(false);
    });

    it('恰好到出发时间应返回 true', () => {
      const departureTime = '2025-01-15T17:20:00Z';
      const now = new Date('2025-01-15T17:20:00Z').getTime();
      expect(shouldRemindDeparture(departureTime, now)).toBe(true);
    });
  });
});
