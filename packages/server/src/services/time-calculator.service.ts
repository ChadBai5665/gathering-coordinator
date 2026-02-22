/**
 * 出发时间计算服务
 * 为每个参与者计算建议出发时间：目标时间 - 行程时长 - 10分钟缓冲
 */

import { supabaseAdmin } from '../lib/supabase.js';
import { routePlan } from './amap.service.js';
import { calculateDepartureTime } from '@ontheway/shared';
import type { Participant, Nomination } from '@ontheway/shared';

/** 默认缓冲时间（分钟） */
const BUFFER_MINUTES = 10;

/**
 * 计算聚会中所有参与者的建议出发时间
 * 流程：
 * 1. 查询聚会信息（目标时间）和已确认餐厅
 * 2. 对每个有位置的参与者做路径规划
 * 3. 出发时间 = 目标时间 - 行程时长 - 10分钟缓冲
 * 4. 更新 participants 表
 *
 * @param gatheringCode - 聚会邀请码
 */
export async function calculateDepartureTimes(gatheringCode: string): Promise<void> {
  // 查询聚会
  const { data: gathering, error: gErr } = await supabaseAdmin
    .from('gatherings')
    .select('id, target_time')
    .eq('code', gatheringCode)
    .single();

  if (gErr || !gathering) {
    console.error('[TimeCalculator] 聚会不存在:', gatheringCode);
    return;
  }

  // 查询已确认餐厅
  const { data: nomination, error: rErr } = await supabaseAdmin
    .from('nominations')
    .select('*')
    .eq('gathering_id', gathering.id)
    .eq('is_confirmed', true)
    .single();

  if (rErr || !nomination) {
    console.error('[TimeCalculator] 未找到已确认提名餐厅:', gathering.id);
    return;
  }

  const nomData = nomination as Nomination;

  // 查询所有参与者
  const { data: participants, error: pErr } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('gathering_id', gathering.id);

  if (pErr || !participants) {
    console.error('[TimeCalculator] 查询参与者失败:', pErr?.message);
    return;
  }

  // 为每个有位置的参与者计算出发时间
  for (const p of participants as Participant[]) {
    if (!p.location) {
      console.warn(`[TimeCalculator] 参与者 ${p.nickname} 无位置信息，跳过`);
      continue;
    }

    let duration: number;
    let distance: number | null = null;

    // 优先使用推荐阶段已有的行程信息
    const existingInfo = nomData.travel_infos?.find(
      (t) => t.participant_id === p.id,
    );

    if (existingInfo && existingInfo.duration > 0) {
      duration = existingInfo.duration;
      distance = existingInfo.distance;
    } else {
      // 重新路径规划
      try {
        const result = await routePlan(
          `${p.location.lng},${p.location.lat}`,
          `${nomData.location.lng},${nomData.location.lat}`,
          'transit',
        );
        duration = result.duration;
        distance = result.distance;
      } catch (err) {
        console.warn(`[TimeCalculator] 路径规划失败，使用估算: ${(err as Error).message}`);
        // 粗估：直线距离 / 25km/h
        const dist = existingInfo?.distance || 5000;
        duration = Math.round(dist / (25 * 1000 / 3600));
        distance = existingInfo?.distance || dist;
      }
    }

    // 计算建议出发时间
    const departureTime = calculateDepartureTime(
      gathering.target_time,
      duration,
      BUFFER_MINUTES,
    );

    // 更新参与者（v2 字段）
    const { error: updateErr } = await supabaseAdmin
      .from('participants')
      .update({
        suggested_depart_at: departureTime.toISOString(),
        estimated_duration: duration,
        estimated_distance: distance,
      })
      .eq('id', p.id);

    if (updateErr) {
      console.error(`[TimeCalculator] 更新参与者 ${p.nickname} 失败:`, updateErr.message);
    }
  }
}
