/**
 * 错误码常量
 * 统一定义业务错误码，前后端共享
 */

/** 错误码枚举 */
export const ErrorCode = {
  // ── v2 通用错误（PRD-v2 附录 B） ──
  /** 未登录 */
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  /** 无权限 */
  FORBIDDEN: 'FORBIDDEN',
  /** 资源不存在 */
  NOT_FOUND: 'NOT_FOUND',
  /** 参数校验失败 */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** 服务器内部错误 */
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // ── 聚会相关 ──
  /** 聚会人数已满（上限 10 人） */
  GATHERING_FULL: 'GATHERING_FULL',
  /** 状态不允许此操作 */
  INVALID_STATE: 'INVALID_STATE',
  /** 参与者不足 */
  TOO_FEW_PARTICIPANTS: 'TOO_FEW_PARTICIPANTS',
  /** 提名不足 */
  TOO_FEW_NOMINATIONS: 'TOO_FEW_NOMINATIONS',

  // ── 参与者相关 ──
  /** 已加入该聚会 */
  ALREADY_JOINED: 'ALREADY_JOINED',
  /** 未加入该聚会 */
  NOT_JOINED: 'NOT_JOINED',
  /** 昵称格式不正确 */
  INVALID_NICKNAME: 'INVALID_NICKNAME',

  // ── 提名相关 ──
  /** 提名已达上限（2 个） */
  NOMINATION_LIMIT: 'NOMINATION_LIMIT',
  /** 重复提名同一餐厅 */
  DUPLICATE_NOMINATION: 'DUPLICATE_NOMINATION',

  // ── 投票相关 ──
  /** 已投过票 */
  ALREADY_VOTED: 'ALREADY_VOTED',
  /** 投票已结束 */
  VOTE_ENDED: 'VOTE_ENDED',
  /** 无效的提名 ID */
  INVALID_NOMINATION: 'INVALID_NOMINATION',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** 错误码对应的默认提示信息（中文） */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_REQUIRED]: '请先登录',
  [ErrorCode.FORBIDDEN]: '无权限',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [ErrorCode.INTERNAL_ERROR]: '服务器内部错误',

  [ErrorCode.GATHERING_FULL]: '聚会人数已满',
  [ErrorCode.INVALID_STATE]: '当前状态不允许此操作',
  [ErrorCode.TOO_FEW_PARTICIPANTS]: '参与者不足',
  [ErrorCode.TOO_FEW_NOMINATIONS]: '提名不足',

  [ErrorCode.ALREADY_JOINED]: '你已加入该聚会',
  [ErrorCode.NOT_JOINED]: '你还未加入该聚会',
  [ErrorCode.INVALID_NICKNAME]: '昵称格式不正确（1-20个字符）',

  [ErrorCode.NOMINATION_LIMIT]: '提名已达上限（2个）',
  [ErrorCode.DUPLICATE_NOMINATION]: '重复提名同一餐厅',

  [ErrorCode.ALREADY_VOTED]: '你已投过票',
  [ErrorCode.VOTE_ENDED]: '投票已结束',
  [ErrorCode.INVALID_NOMINATION]: '无效的提名',
};
