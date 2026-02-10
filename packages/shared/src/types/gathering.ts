/**
 * 聚会相关类型
 * 对应 gatherings 表及相关业务逻辑
 */

import type { GatheringStatus } from '../constants/status';

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
  /** 创建者昵称 */
  creator_nickname: string;
  /** 创建者口味偏好 */
  creator_tastes?: string[];
}

/** 加入聚会请求参数 */
export interface JoinGatheringParams {
  /** 6位邀请码 */
  code: string;
  /** 参与者昵称 */
  nickname: string;
  /** 口味偏好 */
  tastes?: string[];
}

/** 聚会详情（包含参与者列表等聚合数据） */
export interface GatheringDetail extends Gathering {
  /** 参与者数量 */
  participant_count: number;
}
