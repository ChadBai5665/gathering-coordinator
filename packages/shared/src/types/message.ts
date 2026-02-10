/**
 * 消息相关类型
 * 对应 messages 表，用于聚会内的实时消息流
 */

import type { MessageType } from '../constants/status';

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
