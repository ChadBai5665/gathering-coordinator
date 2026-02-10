/**
 * 参与者相关类型
 * 对应 participants 表及相关业务逻辑
 */

import type { ParticipantStatus } from '../constants/status';
import type { Location } from './common';

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
