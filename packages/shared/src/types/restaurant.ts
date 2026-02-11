/**
 * 餐厅/推荐相关类型
 * 对应 restaurants 表及高德 API 返回结构
 */

import type { Location } from './common.js';

/** 单个参与者的行程信息（嵌入 travel_infos JSONB） */
export interface TravelInfo {
  /** 参与者 ID */
  participant_id: string;
  /** 行程距离（米） */
  distance: number;
  /** 行程时长（秒） */
  duration: number;
}

/** 餐厅实体（对应 restaurants 表） */
export interface Restaurant {
  /** 餐厅记录 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 高德 POI ID */
  amap_id: string;
  /** 餐厅名称 */
  name: string;
  /** 餐厅类型/菜系 */
  type: string;
  /** 餐厅地址 */
  address: string;
  /** 餐厅坐标 */
  location: Location;
  /** 评分（高德评分） */
  rating: number | null;
  /** 人均消费（元） */
  cost: number | null;
  /** 综合推荐得分（算法计算） */
  score: number;
  /** 各参与者的行程信息 */
  travel_infos: TravelInfo[];
  /** 是否已确认为最终选择 */
  is_confirmed: boolean;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 餐厅搜索/推荐请求参数 */
export interface SearchRestaurantParams {
  /** 聚会 ID */
  gathering_id: string;
  /** 搜索关键词（可选） */
  keyword?: string;
}
