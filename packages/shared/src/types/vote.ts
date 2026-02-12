/**
 * 投票相关类型
 * 对应 votes / vote_records 表
 */

import type { VoteStatus } from '../constants/status.js';

/** 投票实体（对应 votes 表） */
export interface Vote {
  /** 投票 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 被投票的餐厅在推荐列表中的索引 */
  restaurant_index: number;
  /** 发起投票的用户 ID（auth.users.id） */
  proposer_id: string;
  /** 投票状态 */
  status: VoteStatus;
  /** 投票超时时间（ISO 8601） */
  timeout_at: string;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 投票记录实体（对应 vote_records 表） */
export interface VoteRecord {
  /** 记录 ID */
  id: string;
  /** 所属投票 ID */
  vote_id: string;
  /** 投票用户 ID */
  user_id: string;
  /** 是否同意 */
  agree: boolean;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 发起投票请求参数 */
export interface CreateVoteParams {
  /** 聚会 ID */
  gathering_id: string;
  /** 餐厅在推荐列表中的索引 */
  restaurant_index: number;
}

/** 提交投票请求参数 */
export interface CastVoteParams {
  /** 投票 ID */
  vote_id: string;
  /** 是否同意 */
  agree: boolean;
}

/** 投票详情（包含投票记录统计） */
export interface VoteDetail extends Vote {
  /** 同意票数 */
  agree_count: number;
  /** 反对票数 */
  disagree_count: number;
  /** 总参与人数 */
  total_voters: number;
  /** 当前用户是否已投票 */
  has_voted?: boolean;
}
