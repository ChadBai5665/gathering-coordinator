import { describe, it, expect } from 'vitest';
import {
  validateNickname,
  validateTastes,
  validateGatheringName,
  validateLocation,
  isValidTaste,
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  GATHERING_NAME_MIN_LENGTH,
  GATHERING_NAME_MAX_LENGTH,
} from '../validation';

describe('validation', () => {
  describe('validateNickname', () => {
    it('合法昵称应通过', () => {
      expect(validateNickname('小明')).toEqual({ valid: true });
      expect(validateNickname('A')).toEqual({ valid: true });
      expect(validateNickname('测试用户12345')).toEqual({ valid: true });
    });

    it('空字符串应失败', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('纯空格应失败（trim 后为空）', () => {
      const result = validateNickname('   ');
      expect(result.valid).toBe(false);
    });

    it('超过 20 个字符应失败', () => {
      const longName = '一'.repeat(NICKNAME_MAX_LENGTH + 1);
      const result = validateNickname(longName);
      expect(result.valid).toBe(false);
      expect(result.message).toContain(`${NICKNAME_MAX_LENGTH}`);
    });

    it('恰好 20 个字符应通过', () => {
      const name = '一'.repeat(NICKNAME_MAX_LENGTH);
      expect(validateNickname(name).valid).toBe(true);
    });

    it('恰好 1 个字符应通过', () => {
      expect(validateNickname('A').valid).toBe(true);
    });

    it('首尾有空格但 trim 后合法应通过', () => {
      expect(validateNickname(' 小明 ').valid).toBe(true);
    });

    it('常量值应正确', () => {
      expect(NICKNAME_MIN_LENGTH).toBe(1);
      expect(NICKNAME_MAX_LENGTH).toBe(20);
    });
  });

  describe('validateTastes', () => {
    it('空数组应通过', () => {
      expect(validateTastes([]).valid).toBe(true);
    });

    it('合法口味应通过', () => {
      expect(validateTastes(['川菜', '粤菜']).valid).toBe(true);
      expect(validateTastes(['火锅']).valid).toBe(true);
    });

    it('5 个口味应通过', () => {
      const tastes = ['川菜', '粤菜', '湘菜', '火锅', '烧烤'];
      expect(validateTastes(tastes).valid).toBe(true);
    });

    it('超过 5 个口味应失败', () => {
      const tastes = ['川菜', '粤菜', '湘菜', '火锅', '烧烤', '日料'];
      const result = validateTastes(tastes);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('5');
    });

    it('无效口味应失败', () => {
      const result = validateTastes(['川菜', '法餐']);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('法餐');
    });

    it('重复口味应失败', () => {
      const result = validateTastes(['川菜', '川菜']);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('重复');
    });

    it('非数组输入应失败', () => {
      // @ts-expect-error 测试非法输入
      const result = validateTastes('川菜');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGatheringName', () => {
    it('合法名称应通过', () => {
      expect(validateGatheringName('周五聚餐').valid).toBe(true);
      expect(validateGatheringName('A').valid).toBe(true);
    });

    it('空字符串应失败', () => {
      const result = validateGatheringName('');
      expect(result.valid).toBe(false);
    });

    it('纯空格应失败', () => {
      expect(validateGatheringName('  ').valid).toBe(false);
    });

    it('超过 50 个字符应失败', () => {
      const longName = '一'.repeat(GATHERING_NAME_MAX_LENGTH + 1);
      const result = validateGatheringName(longName);
      expect(result.valid).toBe(false);
      expect(result.message).toContain(`${GATHERING_NAME_MAX_LENGTH}`);
    });

    it('恰好 50 个字符应通过', () => {
      const name = '一'.repeat(GATHERING_NAME_MAX_LENGTH);
      expect(validateGatheringName(name).valid).toBe(true);
    });

    it('常量值应正确', () => {
      expect(GATHERING_NAME_MIN_LENGTH).toBe(1);
      expect(GATHERING_NAME_MAX_LENGTH).toBe(50);
    });
  });

  describe('validateLocation', () => {
    it('合法坐标应通过', () => {
      expect(validateLocation(116.397428, 39.90923).valid).toBe(true);
      expect(validateLocation(0, 0).valid).toBe(true);
      expect(validateLocation(-180, -90).valid).toBe(true);
      expect(validateLocation(180, 90).valid).toBe(true);
    });

    it('经度超范围应失败', () => {
      expect(validateLocation(-181, 0).valid).toBe(false);
      expect(validateLocation(181, 0).valid).toBe(false);
    });

    it('纬度超范围应失败', () => {
      expect(validateLocation(0, -91).valid).toBe(false);
      expect(validateLocation(0, 91).valid).toBe(false);
    });

    it('NaN 应失败', () => {
      expect(validateLocation(NaN, 39).valid).toBe(false);
      expect(validateLocation(116, NaN).valid).toBe(false);
    });

    it('非数字应失败', () => {
      // @ts-expect-error 测试非法输入
      expect(validateLocation('116', 39).valid).toBe(false);
      // @ts-expect-error 测试非法输入
      expect(validateLocation(116, null).valid).toBe(false);
    });
  });

  describe('isValidTaste', () => {
    it('有效口味应返回 true', () => {
      expect(isValidTaste('川菜')).toBe(true);
      expect(isValidTaste('甜品')).toBe(true);
      expect(isValidTaste('海鲜')).toBe(true);
    });

    it('无效口味应返回 false', () => {
      expect(isValidTaste('法餐')).toBe(false);
      expect(isValidTaste('')).toBe(false);
      expect(isValidTaste('随便')).toBe(false);
    });
  });
});
