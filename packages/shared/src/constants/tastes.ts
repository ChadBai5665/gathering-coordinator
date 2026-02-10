/**
 * 口味选项常量
 * 定义所有可选的口味/菜系标签
 */

/** 口味选项列表 */
export const TASTE_OPTIONS = [
  '川菜',
  '粤菜',
  '湘菜',
  '东北菜',
  '火锅',
  '烧烤',
  '日料',
  '韩餐',
  '西餐',
  '快餐',
  '面食',
  '小吃',
  '海鲜',
  '素食',
  '甜品',
] as const;

/** 口味选项类型 */
export type TasteOption = (typeof TASTE_OPTIONS)[number];

/** 每人最多可选口味数量 */
export const MAX_TASTE_COUNT = 5;

/** 每人最少可选口味数量（0 表示可不选） */
export const MIN_TASTE_COUNT = 0;
