/**
 * 状态枚举常量
 * 定义聚会、参与者、投票、消息等核心状态
 */

/** 聚会状态 */
export const GatheringStatus = {
  /** 等待中 - 聚会已创建，等待参与者加入 */
  WAITING: 'waiting',
  /** 提名中 - 正在提名餐厅 */
  NOMINATING: 'nominating',
  /** 投票中 - 正在投票选择餐厅 */
  VOTING: 'voting',
  /** 已确认 - 餐厅已确认，等待出发 */
  CONFIRMED: 'confirmed',
  /** 出发中 - 已有人出发 */
  DEPARTING: 'departing',
  /** 已完成 - 聚会结束 */
  COMPLETED: 'completed',
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
  /** 已结束 - 投票已结算 */
  RESOLVED: 'resolved',
} as const;

export type VoteStatus = (typeof VoteStatus)[keyof typeof VoteStatus];

/** 所有有效的投票状态值列表 */
export const VOTE_STATUS_VALUES = Object.values(VoteStatus);

/** 消息类型 */
export const MessageType = {
  /** 有人加入聚会 */
  PARTICIPANT_JOINED: 'participant_joined',
  /** 提名阶段开始 */
  NOMINATING_STARTED: 'nominating_started',
  /** 有人提名餐厅 */
  RESTAURANT_NOMINATED: 'restaurant_nominated',
  /** 提名被撤回 */
  NOMINATION_WITHDRAWN: 'nomination_withdrawn',
  /** 投票已发起 */
  VOTE_STARTED: 'vote_started',
  /** 投票通过 */
  VOTE_PASSED: 'vote_passed',
  /** 投票未通过 */
  VOTE_REJECTED: 'vote_rejected',
  /** 有人已出发 */
  DEPARTED: 'departed',
  /** 有人已到达 */
  ARRIVED: 'arrived',
  /** 催促消息 */
  NUDGE: 'nudge',
  /** 全员到达 */
  ALL_ARRIVED: 'all_arrived',
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