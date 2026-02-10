import { describe, it, expect } from 'vitest';
import { calculateCenter, calculateDistance, getDefaultCenter, isInChina } from '../geo';
import type { Location } from '../../types/common';

describe('geo', () => {
  describe('calculateCenter', () => {
    it('空数组应返回北京默认坐标', () => {
      const center = calculateCenter([]);
      expect(center.lng).toBeCloseTo(116.397428, 5);
      expect(center.lat).toBeCloseTo(39.90923, 5);
    });

    it('单个坐标应返回该坐标本身', () => {
      const locations: Location[] = [{ lng: 121.4737, lat: 31.2304 }];
      const center = calculateCenter(locations);
      expect(center.lng).toBeCloseTo(121.4737, 4);
      expect(center.lat).toBeCloseTo(31.2304, 4);
    });

    it('两个坐标应返回中点', () => {
      const locations: Location[] = [
        { lng: 116.0, lat: 40.0 },
        { lng: 118.0, lat: 42.0 },
      ];
      const center = calculateCenter(locations);
      expect(center.lng).toBeCloseTo(117.0, 4);
      expect(center.lat).toBeCloseTo(41.0, 4);
    });

    it('多个坐标应返回算术平均值', () => {
      const locations: Location[] = [
        { lng: 116.0, lat: 39.0 },
        { lng: 117.0, lat: 40.0 },
        { lng: 118.0, lat: 41.0 },
      ];
      const center = calculateCenter(locations);
      expect(center.lng).toBeCloseTo(117.0, 4);
      expect(center.lat).toBeCloseTo(40.0, 4);
    });

    it('返回值应保留 6 位小数', () => {
      const locations: Location[] = [
        { lng: 116.1, lat: 39.1 },
        { lng: 116.2, lat: 39.2 },
        { lng: 116.3, lat: 39.3 },
      ];
      const center = calculateCenter(locations);
      const lngStr = center.lng.toString();
      const latStr = center.lat.toString();
      // 小数位数不超过 6 位
      const lngDecimals = lngStr.includes('.') ? lngStr.split('.')[1].length : 0;
      const latDecimals = latStr.includes('.') ? latStr.split('.')[1].length : 0;
      expect(lngDecimals).toBeLessThanOrEqual(6);
      expect(latDecimals).toBeLessThanOrEqual(6);
    });

    it('不应修改原始数组', () => {
      const locations: Location[] = [
        { lng: 116.0, lat: 39.0 },
        { lng: 117.0, lat: 40.0 },
      ];
      const original = JSON.parse(JSON.stringify(locations));
      calculateCenter(locations);
      expect(locations).toEqual(original);
    });
  });

  describe('calculateDistance', () => {
    it('同一点距离应为 0', () => {
      const point: Location = { lng: 116.397428, lat: 39.90923 };
      expect(calculateDistance(point, point)).toBe(0);
    });

    it('北京到上海约 1060-1070 公里', () => {
      const beijing: Location = { lng: 116.397428, lat: 39.90923 };
      const shanghai: Location = { lng: 121.4737, lat: 31.2304 };
      const distance = calculateDistance(beijing, shanghai);
      // 直线距离约 1060-1070 km
      expect(distance).toBeGreaterThan(1050000);
      expect(distance).toBeLessThan(1080000);
    });

    it('短距离计算应合理（约 1 公里）', () => {
      // 北京天安门到故宫北门，约 1 公里
      const from: Location = { lng: 116.397428, lat: 39.90923 };
      const to: Location = { lng: 116.397428, lat: 39.91823 };
      const distance = calculateDistance(from, to);
      expect(distance).toBeGreaterThan(800);
      expect(distance).toBeLessThan(1200);
    });

    it('距离应为对称的（A→B = B→A）', () => {
      const a: Location = { lng: 116.397428, lat: 39.90923 };
      const b: Location = { lng: 121.4737, lat: 31.2304 };
      expect(calculateDistance(a, b)).toBe(calculateDistance(b, a));
    });

    it('返回值应为整数（米）', () => {
      const a: Location = { lng: 116.397428, lat: 39.90923 };
      const b: Location = { lng: 116.5, lat: 40.0 };
      const distance = calculateDistance(a, b);
      expect(Number.isInteger(distance)).toBe(true);
    });
  });

  describe('getDefaultCenter', () => {
    it('应返回北京天安门坐标', () => {
      const center = getDefaultCenter();
      expect(center.lng).toBeCloseTo(116.397428, 5);
      expect(center.lat).toBeCloseTo(39.90923, 5);
    });

    it('应返回新对象（非引用）', () => {
      const a = getDefaultCenter();
      const b = getDefaultCenter();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('isInChina', () => {
    it('北京应在中国范围内', () => {
      expect(isInChina({ lng: 116.397428, lat: 39.90923 })).toBe(true);
    });

    it('上海应在中国范围内', () => {
      expect(isInChina({ lng: 121.4737, lat: 31.2304 })).toBe(true);
    });

    it('乌鲁木齐应在中国范围内', () => {
      expect(isInChina({ lng: 87.617733, lat: 43.792818 })).toBe(true);
    });

    it('东京不在中国范围内', () => {
      expect(isInChina({ lng: 139.6917, lat: 35.6895 })).toBe(false);
    });

    it('伦敦不在中国范围内', () => {
      expect(isInChina({ lng: -0.1276, lat: 51.5074 })).toBe(false);
    });

    it('边界值测试', () => {
      expect(isInChina({ lng: 73.5, lat: 3.8 })).toBe(true);   // 左下角
      expect(isInChina({ lng: 135.1, lat: 53.6 })).toBe(true);  // 右上角
      expect(isInChina({ lng: 73.4, lat: 3.8 })).toBe(false);   // 超出左边界
      expect(isInChina({ lng: 135.2, lat: 53.6 })).toBe(false);  // 超出右边界
    });
  });
});
