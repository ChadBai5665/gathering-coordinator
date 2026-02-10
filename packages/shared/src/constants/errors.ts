/**
 * 错误码常量
 * 统一定义业务错误码，前后端共享
 */

/** 错误码枚举 */
export const ErrorCode = {
  // ── 通用错误 ──
  /** 未知错误 */
  UNKNOWN: 'ERR_UNKNOWN',
  /** 参数校验失败 */
  VALIDATION_FAILED: 'ERR_VALIDATION_FAILED',
  /** 未授权 */
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  /** 无权限 */
  FORBIDDEN: 'ERR_FORBIDDEN',
  /** 资源不存在 */
  NOT_FOUND: 'ERR_NOT_FOUND',
  /** 请求频率超限 */
  RATE_LIMITED: 'ERR_RATE_LIMITED',

  // ── 聚会相关 ──
  /** 聚会不存在 */
  GATHERING_NOT_FOUND: 'ERR_GATHERING_NOT_FOUND',
  /** 聚会已结束 */
  GATHERING_ENDED: 'ERR_GATHERING_ENDED',
  /** 聚会已取消 */
  GATHERING_CANCELLED: 'ERR_GATHERING_CANCELLED',
  /** 邀请码无效 */
  INVALID_INVITE_CODE: 'ERR_INVALID_INVITE_CODE',
  /** 聚会名称无效 */
  INVALID_GATHERING_NAME: 'ERR_INVALID_GATHERING_NAME',
  /** 乐观锁版本冲突 */
  VERSION_CONFLICT: 'ERR_VERSION_CONFLICT',

  // ── 参与者相关 ──
  /** 已加入该聚会 */
  ALREADY_JOINED: 'ERR_ALREADY_JOINED',
  /** 未加入该聚会 */
  NOT_JOINED: 'ERR_NOT_JOINED',
  /** 昵称无效 */
  INVALID_NICKNAME: 'ERR_INVALID_NICKNAME',
  /** 口味选择超限 */
  TASTE_LIMIT_EXCEEDED: 'ERR_TASTE_LIMIT_EXCEEDED',
  /** 无效的口味选项 */
  INVALID_TASTE: 'ERR_INVALID_TASTE',

  // ── 投票相关 ──
  /** 投票不存在 */
  VOTE_NOT_FOUND: 'ERR_VOTE_NOT_FOUND',
  /** 投票已结束 */
  VOTE_ENDED: 'ERR_VOTE_ENDED',
  /** 已投过票 */
  ALREADY_VOTED: 'ERR_ALREADY_VOTED',
  /** 存在进行中的投票 */
  VOTE_IN_PROGRESS: 'ERR_VOTE_IN_PROGRESS',

  // ── 餐厅相关 ──
  /** 餐厅不存在 */
  RESTAURANT_NOT_FOUND: 'ERR_RESTAURANT_NOT_FOUND',

  // ── 位置相关 ──
  /** 无效的坐标 */
  INVALID_LOCATION: 'ERR_INVALID_LOCATION',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 错误码对应的默认提示信息（中文） */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN]: '未知错误，请稍后重试',
  [ErrorCode.VALIDATION_FAILED]: '参数校验失败',
  [ErrorCode.UNAUTHORIZED]: '请先登录',
  [ErrorCode.FORBIDDEN]: '无权执行此操作',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.RATE_LIMITED]: '操作过于频繁，请稍后重试',

  [ErrorCode.GATHERING_NOT_FOUND]: '聚会不存在',
  [ErrorCode.GATHERING_ENDED]: '聚会已结束',
  [ErrorCode.GATHERING_CANCELLED]: '聚会已取消',
  [ErrorCode.INVALID_INVITE_CODE]: '邀请码无效',
  [ErrorCode.INVALID_GATHERING_NAME]: '聚会名称无效',
  [ErrorCode.VERSION_CONFLICT]: '数据已被更新，请刷新后重试',

  [ErrorCode.ALREADY_JOINED]: '你已加入该聚会',
  [ErrorCode.NOT_JOINED]: '你未加入该聚会',
  [ErrorCode.INVALID_NICKNAME]: '昵称格式无效（1-20个字符）',
  [ErrorCode.TASTE_LIMIT_EXCEEDED]: '口味选择不能超过5个',
  [ErrorCode.INVALID_TASTE]: '包含无效的口味选项',

  [ErrorCode.VOTE_NOT_FOUND]: '投票不存在',
  [ErrorCode.VOTE_ENDED]: '投票已结束',
  [ErrorCode.ALREADY_VOTED]: '你已投过票',
  [ErrorCode.VOTE_IN_PROGRESS]: '当前已有进行中的投票',

  [ErrorCode.RESTAURANT_NOT_FOUND]: '餐厅不存在',

  [ErrorCode.INVALID_LOCATION]: '无效的坐标位置',
};
