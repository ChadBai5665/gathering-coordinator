/**
 * 投票相关类型
 * 对应 votes / vote_records 表
 */

import type { VoteStatus } from '../constants/status.js';

/** 投票结果（votes.result） */
export type VoteResult = 'approved' | 'rejected';

/** 投票实体（对应 votes 表） */
export interface Vote {
  /** 投票 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 投票状态 */
  status: VoteStatus;
  /** 投票超时时间（ISO 8601） */
  timeout_at: string;
  /** 参与者总数 */
  total_participants: number;
  /** 投票结果（active 时为 null） */
  result: VoteResult | null;
  /** 创建时间（ISO 8601） */
  created_at: string;
  /** 结算时间（ISO 8601） */
  resolved_at: string | null;
}

/** 投票记录实体（对应 vote_records 表） */
export interface VoteRecord {
  /** 记录 ID */
  id: string;
  /** 所属投票 ID */
  vote_id: string;
  /** 投票用户 ID */
  user_id: string;
  /** 选择的提名 ID */
  nomination_id: string;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 提交投票请求参数 */
export interface CastVoteParams {
  /** 投票 ID */
  vote_id: string;
  /** 选择的提名 ID */
  nomination_id: string;
}

/** 投票统计（API 返回） */
export interface VoteCountItem {
  nomination_id: string;
  name: string;
  count: number;
}

/** 投票结算结果（API 返回） */
export interface VoteWinnerResult {
  winner_nomination_id: string;
  winner_name: string;
}
