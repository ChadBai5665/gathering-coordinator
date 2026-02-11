import { describe, it, expect } from 'vitest';
import { generateInviteCode, isValidInviteCode, formatInviteCode } from '../invite-code.js';

describe('invite-code', () => {
  describe('generateInviteCode', () => {
    it('应生成 6 位字符的邀请码', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
    });

    it('应只包含合法字符（排除 0, O, 1, I, L）', () => {
      const validChars = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/;
      // 多次生成以提高覆盖率
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        expect(code).toMatch(validChars);
      }
    });

    it('不应包含易混淆字符', () => {
      const ambiguous = ['0', 'O', '1', 'I', 'L'];
      for (let i = 0; i < 100; i++) {
        const code = generateInviteCode();
        for (const char of ambiguous) {
          expect(code).not.toContain(char);
        }
      }
    });

    it('每次生成的邀请码应不同（概率性验证）', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        codes.add(generateInviteCode());
      }
      // 50 次生成至少应有 40 个不同的（极低概率重复）
      expect(codes.size).toBeGreaterThan(40);
    });
  });

  describe('isValidInviteCode', () => {
    it('应接受合法的 6 位邀请码', () => {
      expect(isValidInviteCode('ABC234')).toBe(true);
      expect(isValidInviteCode('XYZHJK')).toBe(true);
      expect(isValidInviteCode('999999')).toBe(true);
      expect(isValidInviteCode('ABCDEF')).toBe(true);
    });

    it('应拒绝包含易混淆字符的邀请码', () => {
      expect(isValidInviteCode('ABCDO0')).toBe(false); // 包含 O 和 0
      expect(isValidInviteCode('1ABCDE')).toBe(false); // 包含 1
      expect(isValidInviteCode('ABCDIE')).toBe(false); // 包含 I
      expect(isValidInviteCode('LABCDE')).toBe(false); // 包含 L
    });

    it('应拒绝长度不为 6 的字符串', () => {
      expect(isValidInviteCode('')).toBe(false);
      expect(isValidInviteCode('ABC')).toBe(false);
      expect(isValidInviteCode('ABCDEFG')).toBe(false);
      expect(isValidInviteCode('AB')).toBe(false);
    });

    it('应拒绝小写字母', () => {
      expect(isValidInviteCode('abcdef')).toBe(false);
      expect(isValidInviteCode('Abc234')).toBe(false);
    });

    it('应拒绝特殊字符', () => {
      expect(isValidInviteCode('ABC-23')).toBe(false);
      expect(isValidInviteCode('ABC 23')).toBe(false);
      expect(isValidInviteCode('ABC@23')).toBe(false);
    });

    it('应拒绝非字符串输入', () => {
      // @ts-expect-error 测试非法输入
      expect(isValidInviteCode(123456)).toBe(false);
      // @ts-expect-error 测试非法输入
      expect(isValidInviteCode(null)).toBe(false);
      // @ts-expect-error 测试非法输入
      expect(isValidInviteCode(undefined)).toBe(false);
    });

    it('生成的邀请码应通过验证', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        expect(isValidInviteCode(code)).toBe(true);
      }
    });
  });

  describe('formatInviteCode', () => {
    it('应将小写转为大写', () => {
      expect(formatInviteCode('abc234')).toBe('ABC234');
      expect(formatInviteCode('xyzHJK')).toBe('XYZHJK');
    });

    it('应去除空格', () => {
      expect(formatInviteCode('ABC 234')).toBe('ABC234');
      expect(formatInviteCode(' ABC234 ')).toBe('ABC234');
      expect(formatInviteCode('A B C 2 3 4')).toBe('ABC234');
    });

    it('应同时处理大小写和空格', () => {
      expect(formatInviteCode(' abc 234 ')).toBe('ABC234');
    });

    it('空字符串应返回空字符串', () => {
      expect(formatInviteCode('')).toBe('');
    });
  });
});
