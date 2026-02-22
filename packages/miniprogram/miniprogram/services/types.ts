/**
 * 小程序端类型定义（v2）
 */

import type {
  GatheringStatus,
  ParticipantStatus,
  VoteStatus,
  MessageType,
} from './constants';

/** 地理坐标 */
export interface Location {
  lng: number;
  lat: number;
}

/** 统一 API 响应结构 - 成功 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/** 统一 API 响应结构 - 失败 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** 统一 API 响应类型 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 用户资料（对应 profiles 表） */
export interface UserProfile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  wx_openid: string | null;
  preferences: {
    default_tastes?: string[];
    default_nickname?: string;
  };
}

/** 登录响应 */
export interface AuthResponse {
  token: string;
  user: UserProfile;
  refresh_token?: string;
}

/** 聚会实体 */
export interface Gathering {
  id: string;
  code: string;
  name: string;
  target_time: string;
  status: GatheringStatus;
  creator_id: string;
  created_at: string;
  updated_at: string;
  version: number;
}

/** 聚会详情（列表场景） */
export interface GatheringDetail extends Gathering {
  participant_count?: number;
}

/** 创建聚会请求参数 */
export interface CreateGatheringParams {
  name: string;
  target_time: string;
  creator_nickname?: string;
}

/** 加入聚会请求参数 */
export interface JoinGatheringParams {
  nickname: string;
  location?: Location;
  location_name?: string;
}

/** 参与者实体 */
export interface Participant {
  id: string;
  gathering_id: string;
  user_id: string;
  nickname: string;
  location: Location | null;
  location_name: string | null;
  tastes: string[];
  status: ParticipantStatus;
  is_creator: boolean;
  estimated_duration: number | null;
  estimated_distance: number | null;
  suggested_depart_at: string | null;
  departed_at: string | null;
  arrived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 提名来源 */
export type NominationSource = 'manual' | 'ai';

/** 行程信息 */
export interface TravelInfo {
  participant_id: string;
  nickname?: string;
  distance: number;
  duration: number;
}

/** 提名实体 */
export interface Nomination {
  id: string;
  gathering_id: string;
  nominated_by: string;
  amap_id: string;
  name: string;
  type: string | null;
  address: string | null;
  location: Location;
  rating: number | null;
  cost: number | null;
  source: NominationSource;
  reason: string | null;
  score: number;
  travel_infos: TravelInfo[];
  is_confirmed: boolean;
  created_at: string;
}

/** 兼容旧组件命名 */
export type Restaurant = Nomination;

/** POI 搜索结果 */
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

/** AI 推荐结果 */
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

/** 投票实体 */
export interface Vote {
  id: string;
  gathering_id: string;
  status: VoteStatus;
  timeout_at: string;
  total_participants: number;
  result: 'approved' | 'rejected' | null;
  created_at: string;
  resolved_at: string | null;
}

/** 投票统计项 */
export interface VoteCountItem {
  nomination_id: string;
  name: string;
  count: number;
}

/** 投票胜出结果 */
export interface VoteWinnerResult {
  winner_nomination_id: string;
  winner_name: string;
}

/** 活跃投票（聚合） */
export interface ActiveVote extends Vote {
  vote_counts: VoteCountItem[];
  total_voted: number;
  has_voted: boolean;
}

/** 兼容旧组件命名 */
export type VoteDetail = ActiveVote;

/** 消息实体 */
export interface Message {
  id: string;
  gathering_id: string;
  type: MessageType;
  content: string;
  sender_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** 聚会完整状态 */
export interface GatheringState {
  gathering: Gathering;
  participants: Participant[];
  nominations: Nomination[];
  active_vote: ActiveVote | null;
  messages: Message[];
}

/** 我的聚会返回 */
export interface MyGatheringsResponse {
  gatherings: GatheringDetail[];
  total: number;
}

/** 轮询返回 */
export interface PollResponse {
  changed: boolean;
  version: number;
  gathering?: Gathering;
  participants?: Participant[];
  nominations?: Nomination[];
  active_vote?: ActiveVote | null;
  messages?: Message[];
}