/**
 * 催促提醒服务
 * 定时检查聚会状态，生成提醒消息写入 DB
 * 提醒类型：30分钟/10分钟/立即出发/超时/全员出发/到达/全员到达
 */

import { supabaseAdmin } from '../lib/supabase.js';
import {
  GatheringStatus,
  ParticipantStatus,
  MessageType,
  formatTime,
} from '@ontheway/shared';
import type { Participant, Gathering } from '@ontheway/shared';

// ── 提醒消息模板 ──

const TEMPLATES = {
  /** 距出发还有 30 分钟 */
  remind30: (p: Participant) =>
    `⏰ ${p.nickname}，距离建议出发时间还有约30分钟，请做好准备！`,

  /** 距出发还有 10 分钟 */
  remind10: (p: Participant) =>
    `🔔 ${p.nickname}，距离建议出发时间还有约10分钟，该准备出门了！`,

  /** 该出发了 */
  remindNow: (p: Participant) =>
    `🚨 ${p.nickname}，建议出发时间已到（${p.departure_time ? formatTime(p.departure_time) : '现在'}），快出发吧！`,

  /** 已超过出发时间 */
  remindOverdue: (p: Participant) =>
    `⚠️ ${p.nickname} 已超过建议出发时间，可能会迟到哦！`,

  /** 全员已出发 */
  allDeparted: () =>
    `🎉 全员已出发，大家路上注意安全！`,

  /** 某人到达 */
  arrived: (p: Participant) =>
    `📍 ${p.nickname} 已到达目的地！`,

  /** 全员到达 */
  allArrived: () =>
    `🎊 全员已到达，聚会开始！`,

  /** 某人出发 */
  departed: (p: Participant) =>
    `🚗 ${p.nickname} 已出发！`,
} as const;

// ── 引擎状态 ──

let reminderInterval: ReturnType<typeof setInterval> | null = null;
const CHECK_INTERVAL_MS = 30_000; // 30 秒检查一次

/**
 * 向聚会写入一条消息
 */
async function writeMessage(
  gatheringId: string,
  type: string,
  text: string,
  targetId?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('messages').insert({
    gathering_id: gatheringId,
    type,
    text,
    target_id: targetId || null,
  });

  if (error) {
    console.error('[Reminder] 写入消息失败:', error.message);
  }
}

/**
 * 递增聚会版本号（触发轮询客户端更新）
 */
async function bumpVersion(gatheringId: string): Promise<void> {
  // 使用 RPC 或直接 update + 1
  const { error } = await supabaseAdmin.rpc('increment_version', {
    gathering_id_input: gatheringId,
  });

  if (error) {
    // 回退方案：直接查询再更新
    const { data } = await supabaseAdmin
      .from('gatherings')
      .select('version')
      .eq('id', gatheringId)
      .single();

    if (data) {
      await supabaseAdmin
        .from('gatherings')
        .update({ version: data.version + 1 })
        .eq('id', gatheringId);
    }
  }
}

/**
 * 检查单个聚会的提醒状态
 */
export async function checkGathering(gatheringId: string): Promise<void> {
  // 查询聚会
  const { data: gathering, error: gErr } = await supabaseAdmin
    .from('gatherings')
    .select('*')
    .eq('id', gatheringId)
    .single();

  if (gErr || !gathering) return;

  const g = gathering as Gathering;

  // 只处理 confirmed 和 active 状态的聚会
  if (g.status !== GatheringStatus.CONFIRMED && g.status !== GatheringStatus.ACTIVE) {
    return;
  }

  // 查询参与者
  const { data: participants, error: pErr } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('gathering_id', gatheringId);

  if (pErr || !participants) return;

  const now = Date.now();
  let hasNewMessage = false;

  for (const p of participants as Participant[]) {
    // 已到达的不需要提醒
    if (p.status === ParticipantStatus.ARRIVED) continue;

    // 已出发但未到达的不需要出发提醒
    if (p.status === ParticipantStatus.DEPARTED) continue;

    // 没有建议出发时间的跳过
    if (!p.departure_time) continue;

    const departureMs = new Date(p.departure_time).getTime();
    const remaining = departureMs - now;
    const reminders = p.reminders_sent || {};

    // 30 分钟提醒
    if (remaining <= 30 * 60 * 1000 && remaining > 10 * 60 * 1000 && !reminders.departure) {
      await writeMessage(gatheringId, MessageType.REMINDER, TEMPLATES.remind30(p), p.id);
      await supabaseAdmin
        .from('participants')
        .update({ reminders_sent: { ...reminders, departure: true } })
        .eq('id', p.id);
      hasNewMessage = true;
    }

    // 10 分钟提醒
    if (remaining <= 10 * 60 * 1000 && remaining > 0 && !reminders.late_warning) {
      await writeMessage(gatheringId, MessageType.URGENT, TEMPLATES.remind10(p), p.id);
      await supabaseAdmin
        .from('participants')
        .update({ reminders_sent: { ...reminders, late_warning: true } })
        .eq('id', p.id);
      hasNewMessage = true;
    }

    // 该出发了（已过出发时间但还没出发）
    if (remaining <= 0 && !reminders.late_warning) {
      await writeMessage(gatheringId, MessageType.URGENT, TEMPLATES.remindNow(p), p.id);
      await supabaseAdmin
        .from('participants')
        .update({
          reminders_sent: { ...reminders, departure: true, late_warning: true },
        })
        .eq('id', p.id);
      hasNewMessage = true;
    }
  }

  if (hasNewMessage) {
    await bumpVersion(gatheringId);
  }
}

/**
 * 发送即时通知（加入/出发/到达等事件触发）
 */
export async function sendInstantNotice(
  gatheringId: string,
  type: keyof typeof TEMPLATES,
  participant: Participant,
): Promise<void> {
  const templateFn = TEMPLATES[type];
  if (!templateFn) {
    console.warn(`[Reminder] 未知模板类型: ${type}`);
    return;
  }

  // 类型安全：区分无参和有参模板
  let text: string;
  if (type === 'allDeparted' || type === 'allArrived') {
    text = (templateFn as () => string)();
  } else {
    text = (templateFn as (p: Participant) => string)(participant);
  }

  const messageType =
    type === 'allDeparted' || type === 'allArrived'
      ? MessageType.MILESTONE
      : type === 'departed'
        ? MessageType.DEPART
        : type === 'arrived'
          ? MessageType.ARRIVE
          : MessageType.REMINDER;

  await writeMessage(gatheringId, messageType, text, participant.id);
  await bumpVersion(gatheringId);
}

/**
 * 启动提醒引擎
 * 每 30 秒扫描所有活跃聚会
 */
export function startReminderEngine(): void {
  if (reminderInterval) {
    console.warn('[Reminder] 引擎已在运行');
    return;
  }

  console.log('[Reminder] 提醒引擎启动，检查间隔 30s');

  reminderInterval = setInterval(async () => {
    try {
      // 查询所有需要检查的聚会（confirmed 或 active）
      const { data: gatherings, error } = await supabaseAdmin
        .from('gatherings')
        .select('id')
        .in('status', [GatheringStatus.CONFIRMED, GatheringStatus.ACTIVE]);

      if (error || !gatherings) return;

      for (const g of gatherings) {
        await checkGathering(g.id);
      }
    } catch (err) {
      console.error('[Reminder] 检查异常:', (err as Error).message);
    }
  }, CHECK_INTERVAL_MS);
}

/**
 * 停止提醒引擎
 */
export function stopReminderEngine(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[Reminder] 提醒引擎已停止');
  }
}
