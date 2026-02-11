/**
 * 状态枚举常量
 * 定义聚会、参与者、投票、消息等核心状态
 */

/** 聚会状态 */
export const GatheringStatus = {
  /** 等待中 - 聚会已创建，等待参与者加入 */
  WAITING: 'waiting',
  /** 推荐中 - 正在获取餐厅推荐 */
  RECOMMENDING: 'recommending',
  /** 投票中 - 正在投票选择餐厅 */
  VOTING: 'voting',
  /** 已确认 - 餐厅已确认，等待出发 */
  CONFIRMED: 'confirmed',
  /** 进行中 - 参与者已开始出发 */
  ACTIVE: 'active',
  /** 已完成 - 聚会结束 */
  COMPLETED: 'completed',
  /** 已取消 - 聚会被取消 */
  CANCELLED: 'cancelled',
} as const;

export type GatheringStatus = (typeof GatheringStatus)[keyof typeof GatheringStatus];

/** 所有有效的聚会状态值列表 */
export const GATHERING_STATUS_VALUES = Object.values(GatheringStatus);

/** 参与者状态 */
export const ParticipantStatus = {
  /** 已加入 - 参与者已加入聚会 */
  JOINED: 'joined',
  /** 已出发 - 参与者已出发 */
  DEPARTED: 'departed',
  /** 已到达 - 参与者已到达目的地 */
  ARRIVED: 'arrived',
} as const;

export type ParticipantStatus = (typeof ParticipantStatus)[keyof typeof ParticipantStatus];

/** 所有有效的参与者状态值列表 */
export const PARTICIPANT_STATUS_VALUES = Object.values(ParticipantStatus);

/** 投票状态 */
export const VoteStatus = {
  /** 进行中 - 投票正在进行 */
  ACTIVE: 'active',
  /** 已通过 - 投票通过 */
  PASSED: 'passed',
  /** 已否决 - 投票被否决 */
  REJECTED: 'rejected',
} as const;

export type VoteStatus = (typeof VoteStatus)[keyof typeof VoteStatus];

/** 所有有效的投票状态值列表 */
export const VOTE_STATUS_VALUES = Object.values(VoteStatus);

/** 消息类型 */
export const MessageType = {
  /** 系统消息 */
  SYSTEM: 'system',
  /** 加入通知 */
  JOIN: 'join',
  /** 出发通知 */
  DEPART: 'depart',
  /** 到达通知 */
  ARRIVE: 'arrive',
  /** 投票通知 */
  VOTE: 'vote',
  /** 投票结果 */
  VOTE_RESULT: 'vote_result',
  /** 餐厅确认 */
  RESTAURANT_CONFIRMED: 'restaurant_confirmed',
  /** 催促提醒 */
  REMINDER: 'reminder',
  /** 紧急催促 */
  URGENT: 'urgent',
  /** 里程碑（全员出发/全员到达） */
  MILESTONE: 'milestone',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

/** 所有有效的消息类型值列表 */
export const MESSAGE_TYPE_VALUES = Object.values(MessageType);

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
