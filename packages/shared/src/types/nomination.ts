/**
 * 提名相关类型
 * 对应 nominations 表及提名/搜索/AI 推荐接口
 */

import type { Location } from './common.js';

/** 提名来源 */
export type NominationSource = 'manual' | 'ai';

/** 单个参与者的行程信息（嵌入 travel_infos JSONB） */
export interface TravelInfo {
  /** 参与者 ID（participants.id） */
  participant_id: string;
  /** 参与者昵称（部分接口会返回，DB 中可不存） */
  nickname?: string;
  /** 行程距离（米） */
  distance: number;
  /** 行程时长（秒） */
  duration: number;
}

/** 提名实体（对应 nominations 表） */
export interface Nomination {
  /** 提名记录 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 提名人（participants.id） */
  nominated_by: string;
  /** 高德 POI ID */
  amap_id: string;
  /** 餐厅名称 */
  name: string;
  /** 菜系类型 */
  type: string | null;
  /** 地址 */
  address: string | null;
  /** 坐标 */
  location: Location;
  /** 评分 */
  rating: number | null;
  /** 人均（元） */
  cost: number | null;
  /** 提名来源 */
  source: NominationSource;
  /** AI 推荐理由（仅 source='ai'） */
  reason: string | null;
  /** 综合评分（用于投票平票 tie-break） */
  score: number;
  /** 所有参与者到该餐厅的行程信息 */
  travel_infos: TravelInfo[];
  /** 是否为最终确认的餐厅 */
  is_confirmed: boolean;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 手动搜索餐厅返回项（POI 搜索） */
export interface SearchRestaurantResult {
  amap_id: string;
  name: string;
  type: string;
  address: string;
  location: Location;
  rating: number | null;
  cost: number | null;
  distance_to_center: number;
  photo_url: string | null;
}

/** AI 推荐返回项 */
export interface AiSuggestion {
  amap_id: string;
  name: string;
  type: string;
  address: string;
  location: Location;
  rating: number | null;
  cost: number | null;
  score: number;
  reason: string;
  travel_infos: TravelInfo[];
}

