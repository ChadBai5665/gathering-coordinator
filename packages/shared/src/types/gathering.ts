/**
 * 聚会相关类型
 * 对应 gatherings 表及相关业务逻辑
 */

import type { GatheringStatus } from '../constants/status.js';
import type { Participant } from './participant.js';
import type { Nomination } from './nomination.js';
import type { Vote, VoteCountItem } from './vote.js';
import type { Message } from './message.js';

/** 聚会实体（对应 gatherings 表） */
export interface Gathering {
  /** 聚会 ID */
  id: string;
  /** 6位邀请码 */
  code: string;
  /** 聚会名称 */
  name: string;
  /** 目标到达时间（ISO 8601） */
  target_time: string;
  /** 聚会状态 */
  status: GatheringStatus;
  /** 创建者用户 ID */
  creator_id: string;
  /** 创建时间（ISO 8601） */
  created_at: string;
  /** 更新时间（ISO 8601） */
  updated_at: string;
  /** 乐观锁版本号 */
  version: number;
}

/** 创建聚会请求参数 */
export interface CreateGatheringParams {
  /** 聚会名称（1-50字符） */
  name: string;
  /** 目标到达时间（ISO 8601） */
  target_time: string;
  /** 创建者昵称（可选） */
  creator_nickname?: string;
}

/** 加入聚会请求参数 */
export interface JoinGatheringParams {
  /** 参与者昵称 */
  nickname: string;
  /** 位置坐标（可选，前端自动获取） */
  location?: {
    lng: number;
    lat: number;
  };
  /** 位置名称（可选） */
  location_name?: string;
}

/** 聚会详情（包含参与者列表等聚合数据） */
export interface GatheringDetail extends Gathering {
  /** 参与者数量 */
  participant_count: number;
}

/** 活跃投票（API 聚合返回） */
export interface ActiveVote extends Vote {
  /** 各提名票数 */
  vote_counts: VoteCountItem[];
  /** 已投票人数 */
  total_voted: number;
  /** 当前用户是否已投票 */
  has_voted: boolean;
}

/** 聚会仪表盘状态（GET /api/gatherings/:code） */
export interface GatheringState {
  gathering: Gathering;
  participants: Participant[];
  nominations: Nomination[];
  active_vote: ActiveVote | null;
  messages: Message[];
}

/** 轮询返回（GET /api/gatherings/:code/poll） */
export interface PollState extends Partial<GatheringState> {
  changed: boolean;
  version: number;
}
