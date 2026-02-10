/**
 * 邀请码工具
 * 生成和验证 6 位大写字母+数字邀请码
 * 排除易混淆字符：0/O, 1/I/L
 */

/** 可用字符集（排除 0, O, 1, I, L） */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** 邀请码长度 */
const CODE_LENGTH = 6;

/** 邀请码正则（仅允许 CHARSET 中的字符） */
const CODE_REGEX = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/**
 * 生成随机邀请码
 * @returns 6 位大写字母+数字组成的邀请码
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * CHARSET.length);
    code += CHARSET[index];
  }
  return code;
}

/**
 * 验证邀请码格式是否合法
 * @param code - 待验证的邀请码
 * @returns 是否为合法的 6 位邀请码
 */
export function isValidInviteCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  return CODE_REGEX.test(code);
}

/**
 * 格式化用户输入的邀请码（转大写、去空格）
 * @param input - 用户输入的原始字符串
 * @returns 格式化后的邀请码
 */
export function formatInviteCode(input: string): string {
  return input.replace(/\s/g, '').toUpperCase();
}
