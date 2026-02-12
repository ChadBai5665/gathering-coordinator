/**
 * 通用类型定义
 * Location、ApiResponse、分页等基础类型
 */

/** 地理坐标 */
export interface Location {
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/** 带名称的地理位置 */
export interface NamedLocation extends Location {
  /** 位置名称（如地址、POI名） */
  name: string;
}

/** 统一 API 响应结构 - 成功 */
export interface ApiSuccessResponse<T = unknown> {
  /** 是否成功 */
  success: true;
  /** 响应数据 */
  data: T;
}

/** 统一 API 响应结构 - 失败 */
export interface ApiErrorResponse {
  /** 是否成功 */
  success: false;
  /** 错误码 */
  code: string;
  /** 错误信息 */
  message: string;
}

/** 统一 API 响应类型 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/** 分页请求参数 */
export interface PaginationParams {
  /** 页码（从 1 开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 分页响应数据 */
export interface PaginatedData<T> {
  /** 数据列表 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/** 时间戳字段（ISO 8601 字符串） */
export interface Timestamps {
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at: string;
}

/** 提取可选字段为 Partial */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 认证相关类型
 * 用户 Profile、登录参数等
 */

/** 用户资料（对应 profiles 表） */
export interface UserProfile {
  /** 用户 ID（关联 auth.users.id） */
  id: string;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar_url: string | null;
  /** 微信 OpenID */
  wx_openid: string | null;
  /** 用户偏好设置 */
  preferences: UserPreferences;
}

/** 用户偏好设置（JSONB） */
export interface UserPreferences {
  /** 默认口味偏好 */
  default_tastes?: string[];
  /** 默认昵称 */
  default_nickname?: string;
}

/** 微信登录参数 */
export interface WxLoginParams {
  /** 微信临时登录凭证 */
  code: string;
}

/** 登录响应 */
export interface AuthResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 用户资料 */
  user: UserProfile;
}

/**
 * 聚会相关类型
 * 对应 gatherings 表及相关业务逻辑
 */

import type { GatheringStatus } from './constants';

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

/**
 * 参与者相关类型
 * 对应 participants 表及相关业务逻辑
 */

import type { ParticipantStatus } from './constants';

/** 提醒发送记录（JSONB） */
export interface RemindersSent {
  /** 出发提醒是否已发送 */
  departure?: boolean;
  /** 即将迟到提醒是否已发送 */
  late_warning?: boolean;
}

/** 参与者实体（对应 participants 表） */
export interface Participant {
  /** 参与者记录 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 用户 ID（游客为 null） */
  user_id: string | null;
  /** 昵称 */
  nickname: string;
  /** 当前位置 */
  location: Location | null;
  /** 位置名称 */
  location_name: string | null;
  /** 口味偏好 */
  tastes: string[];
  /** 参与者状态 */
  status: ParticipantStatus;
  /** 建议出发时间（ISO 8601） */
  departure_time: string | null;
  /** 预计行程时长（秒） */
  travel_duration: number | null;
  /** 实际出发时间（ISO 8601） */
  departed_at: string | null;
  /** 实际到达时间（ISO 8601） */
  arrived_at: string | null;
  /** 提醒发送记录 */
  reminders_sent: RemindersSent;
}

/** 更新参与者位置参数 */
export interface UpdateLocationParams {
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
  /** 位置名称 */
  location_name?: string;
}

/** 更新参与者口味参数 */
export interface UpdateTastesParams {
  /** 口味列表（0-5 个） */
  tastes: string[];
}

/**
 * 餐厅/推荐相关类型
 * 对应 restaurants 表及高德 API 返回结构
 */

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

/**
 * 投票相关类型
 * 对应 votes / vote_records 表
 */

import type { VoteStatus } from './constants';

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

/**
 * 消息相关类型
 * 对应 messages 表，用于聚会内的实时消息流
 */

import type { MessageType } from './constants';

/** 消息实体（对应 messages 表） */
export interface Message {
  /** 消息 ID */
  id: string;
  /** 所属聚会 ID */
  gathering_id: string;
  /** 消息类型 */
  type: MessageType;
  /** 消息文本内容 */
  text: string;
  /** 关联目标 ID（如参与者 ID、投票 ID 等） */
  target_id: string | null;
  /** 创建时间（ISO 8601） */
  created_at: string;
}

/** 实时消息推送载荷（Supabase Realtime） */
export interface RealtimeMessagePayload {
  /** 事件类型 */
  event: 'INSERT';
  /** 新消息数据 */
  new: Message;
}
