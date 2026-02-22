/**
 * 投票结算服务（v2）
 * 结算触发：全员投完 / 超时（poll 或 vote 接口触发）
 */

import { supabaseAdmin } from '../lib/supabase.js';
import {
  GatheringStatus,
  VoteStatus,
  MessageType,
} from '@ontheway/shared';
import type { Nomination, Vote, VoteRecord } from '@ontheway/shared';
import { calculateDepartureTimes } from './time-calculator.service.js';

function isVoteExpired(vote: Vote): boolean {
  return new Date(vote.timeout_at).getTime() < Date.now();
}

export function pickWinnerNomination(
  nominations: Nomination[],
  records: VoteRecord[],
): Nomination | null {
  const countMap = new Map<string, number>();
  for (const r of records) {
    countMap.set(r.nomination_id, (countMap.get(r.nomination_id) || 0) + 1);
  }

  const candidates = nominations.map((n) => ({
    n,
    count: countMap.get(n.id) || 0,
  }));

  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const bScore = typeof b.n.score === 'number' ? b.n.score : 0;
    const aScore = typeof a.n.score === 'number' ? a.n.score : 0;
    if (bScore !== aScore) return bScore - aScore;
    return new Date(a.n.created_at).getTime() - new Date(b.n.created_at).getTime();
  });

  return candidates.length > 0 ? candidates[0].n : null;
}

async function bumpVersion(gatheringId: string): Promise<void> {
  await supabaseAdmin.rpc('increment_version', { gathering_id_input: gatheringId });
}

async function writeMessage(
  gatheringId: string,
  type: string,
  content: string,
  metadata: Record<string, unknown> | null = null,
): Promise<void> {
  await supabaseAdmin.from('messages').insert({
    gathering_id: gatheringId,
    type,
    content,
    sender_id: null,
    metadata,
  });
}

export async function settleActiveVoteIfNeeded(
  gatheringId: string,
  voteId: string,
): Promise<{ winner: Nomination } | null> {
  const { data: vote, error: vErr } = await supabaseAdmin
    .from('votes')
    .select('*')
    .eq('id', voteId)
    .eq('gathering_id', gatheringId)
    .single();

  if (vErr || !vote) return null;
  const voteData = vote as Vote;
  if (voteData.status !== VoteStatus.ACTIVE) return null;

  const { data: records } = await supabaseAdmin
    .from('vote_records')
    .select('*')
    .eq('vote_id', voteId);

  const voteRecords = (records || []) as VoteRecord[];
  const shouldSettle = isVoteExpired(voteData) || voteRecords.length >= voteData.total_participants;
  if (!shouldSettle) return null;

  const { data: nominations, error: nErr } = await supabaseAdmin
    .from('nominations')
    .select('*')
    .eq('gathering_id', gatheringId);
  if (nErr) return null;

  const allNoms = (nominations || []) as Nomination[];
  const winner = pickWinnerNomination(allNoms, voteRecords);
  if (!winner) return null;

  const now = new Date().toISOString();

  // 标记确认餐厅
  await supabaseAdmin
    .from('nominations')
    .update({ is_confirmed: false })
    .eq('gathering_id', gatheringId);
  await supabaseAdmin
    .from('nominations')
    .update({ is_confirmed: true })
    .eq('id', winner.id);

  // 更新投票状态
  await supabaseAdmin
    .from('votes')
    .update({
      status: VoteStatus.RESOLVED,
      result: 'approved',
      resolved_at: now,
    })
    .eq('id', voteId);

  // 更新聚会状态
  await supabaseAdmin
    .from('gatherings')
    .update({ status: GatheringStatus.CONFIRMED })
    .eq('id', gatheringId);

  // 计算出发时间（基于确认提名）
  await calculateDepartureTimesByGatheringId(gatheringId);

  await writeMessage(
    gatheringId,
    MessageType.VOTE_PASSED,
    `投票通过！已确认餐厅：${winner.name}`,
    { winner_nomination_id: winner.id, winner_name: winner.name },
  );

  await bumpVersion(gatheringId);

  return { winner };
}

async function calculateDepartureTimesByGatheringId(gatheringId: string): Promise<void> {
  // time-calculator 入口以 code 为参数；这里先查 code 再调用
  const { data: gathering } = await supabaseAdmin
    .from('gatherings')
    .select('code')
    .eq('id', gatheringId)
    .single();
  const code = (gathering as any)?.code as string | undefined;
  if (!code) return;
  await calculateDepartureTimes(code);
}
