/**
 * 输入验证工具
 * 昵称、口味、聚会名称等业务规则校验
 */

import { TASTE_OPTIONS, MAX_TASTE_COUNT } from '../constants/tastes.js';
import type { TasteOption } from '../constants/tastes.js';

/** 昵称最小长度 */
export const NICKNAME_MIN_LENGTH = 1;

/** 昵称最大长度 */
export const NICKNAME_MAX_LENGTH = 20;

/** 聚会名称最小长度 */
export const GATHERING_NAME_MIN_LENGTH = 1;

/** 聚会名称最大长度 */
export const GATHERING_NAME_MAX_LENGTH = 50;

/** 验证结果 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 错误信息（验证失败时） */
  message?: string;
}

/**
 * 验证昵称是否合法
 * 规则：1-20 个字符，去除首尾空格后判断
 * @param nickname - 待验证的昵称
 * @returns 验证结果
 */
export function validateNickname(nickname: string): ValidationResult {
  const trimmed = nickname.trim();

  if (trimmed.length < NICKNAME_MIN_LENGTH) {
    return { valid: false, message: '昵称不能为空' };
  }

  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return { valid: false, message: `昵称不能超过${NICKNAME_MAX_LENGTH}个字符` };
  }

  return { valid: true };
}

/**
 * 验证口味选择是否合法
 * 规则：0-5 个，且必须是预定义选项
 * @param tastes - 待验证的口味列表
 * @returns 验证结果
 */
export function validateTastes(tastes: string[]): ValidationResult {
  if (!Array.isArray(tastes)) {
    return { valid: false, message: '口味参数格式错误' };
  }

  if (tastes.length > MAX_TASTE_COUNT) {
    return { valid: false, message: `口味选择不能超过${MAX_TASTE_COUNT}个` };
  }

  const validTastes = new Set<string>(TASTE_OPTIONS);
  const invalid = tastes.filter((t) => !validTastes.has(t));

  if (invalid.length > 0) {
    return { valid: false, message: `包含无效的口味选项：${invalid.join('、')}` };
  }

  // 检查重复
  const unique = new Set(tastes);
  if (unique.size !== tastes.length) {
    return { valid: false, message: '口味选项不能重复' };
  }

  return { valid: true };
}

/**
 * 验证聚会名称是否合法
 * 规则：1-50 个字符，去除首尾空格后判断
 * @param name - 待验证的聚会名称
 * @returns 验证结果
 */
export function validateGatheringName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < GATHERING_NAME_MIN_LENGTH) {
    return { valid: false, message: '聚会名称不能为空' };
  }

  if (trimmed.length > GATHERING_NAME_MAX_LENGTH) {
    return { valid: false, message: `聚会名称不能超过${GATHERING_NAME_MAX_LENGTH}个字符` };
  }

  return { valid: true };
}

/**
 * 验证经纬度坐标是否合法
 * @param lng - 经度（-180 ~ 180）
 * @param lat - 纬度（-90 ~ 90）
 * @returns 验证结果
 */
export function validateLocation(lng: number, lat: number): ValidationResult {
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return { valid: false, message: '坐标必须为数字' };
  }

  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return { valid: false, message: '坐标不能为 NaN' };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, message: '经度范围为 -180 ~ 180' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, message: '纬度范围为 -90 ~ 90' };
  }

  return { valid: true };
}

/**
 * 判断字符串是否为有效的口味选项
 * @param taste - 待判断的字符串
 * @returns 是否为有效口味选项
 */
export function isValidTaste(taste: string): taste is TasteOption {
  return (TASTE_OPTIONS as readonly string[]).includes(taste);
}
