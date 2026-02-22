/**
 * 聚会路由 /api/gatherings（v2）
 * 核心业务：创建/加入/提名/投票/出发/到达/轮询
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { supabaseAdmin } from '../lib/supabase.js';
import {
  ErrorCode,
  GatheringStatus,
  ParticipantStatus,
  VoteStatus,
  MessageType,
  generateInviteCode,
  isValidInviteCode,
  validateNickname,
  validateTastes,
  NICKNAME_MAX_LENGTH,
  MAX_TASTE_COUNT,
  calculateCenter,
  calculateDistance,
  getDefaultCenter,
} from '@ontheway/shared';
import type {
  Gathering,
  Participant,
  Nomination,
  Vote,
  VoteRecord,
  Message,
  SearchRestaurantResult,
  AiSuggestion,
  VoteCountItem,
  VoteWinnerResult,
} from '@ontheway/shared';

import { searchPOIPage } from '../services/amap.service.js';
import { buildAiSuggestions } from '../services/restaurant.service.js';
import {
  calculateTravelInfos,
  computeNominationScore,
  isValidLocation,
} from '../services/nomination.service.js';
import { settleActiveVoteIfNeeded } from '../services/vote-calculator.service.js';

const router: RouterType = Router();

// 所有聚会路由都需要认证
router.use(authMiddleware);

const MAX_PARTICIPANTS = 10;
const MAX_NOMINATIONS_PER_USER = 2;
const VOTE_TIMEOUT_MS = 10 * 60 * 1000;

// ── Zod Schemas ──

const createGatheringSchema = z.object({
  name: z.string().min(1).max(50),
  target_time: z.string().datetime({ message: '目标时间格式无效，需要 ISO 8601' }),
  creator_nickname: z.string().min(1).max(NICKNAME_MAX_LENGTH).optional(),
});

const joinGatheringSchema = z.object({
  nickname: z.string().min(1).max(NICKNAME_MAX_LENGTH),
  location: z
    .object({
      lng: z.number().min(-180).max(180),
      lat: z.number().min(-90).max(90),
    })
    .optional(),
  location_name: z.string().optional(),
});

const updateLocationSchema = z.object({
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  location_name: z.string().optional(),
});

const aiSuggestSchema = z.object({
  tastes: z.array(z.string()).min(1).max(MAX_TASTE_COUNT),
});

const nominateSchema = z.object({
  amap_id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  address: z.string().optional(),
  location: z.object({
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
  }),
  rating: z.number().min(0).max(5).optional(),
  cost: z.number().int().min(0).optional(),
  source: z.enum(['manual', 'ai']),
  reason: z.string().optional(),
});

const castVoteSchema = z.object({
  nomination_id: z.string().uuid(),
});

// ── Helpers ──

function normalizeParam(v: string | string[] | undefined): string {
  if (!v) return '';
  return Array.isArray(v) ? v[0] : v;
}

async function getGatheringByCode(codeParam: string | string[]): Promise<Gathering> {
  const code = normalizeParam(codeParam as any);
  if (!isValidInviteCode(code)) {
    throw new AppError(404, ErrorCode.NOT_FOUND, '聚会不存在');
  }

  const { data, error } = await supabaseAdmin
    .from('gatherings')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) {
    throw new AppError(404, ErrorCode.NOT_FOUND, '聚会不存在');
  }

  return data as Gathering;
}

async function getMyParticipant(
  gatheringId: string,
  userId: string,
): Promise<Participant | null> {
  const { data } = await supabaseAdmin
    .from('participants')
    .select('*')
    .eq('gathering_id', gatheringId)
    .eq('user_id', userId)
    .single();

  return (data as Participant) || null;
}

async function requireParticipant(gathering: Gathering, userId: string): Promise<Participant> {
  const p = await getMyParticipant(gathering.id, userId);
  if (!p) {
    throw new AppError(400, ErrorCode.NOT_JOINED, '你还未加入该聚会');
  }
  return p;
}

async function bumpVersion(gatheringId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('increment_version', {
    gathering_id_input: gatheringId,
  });
  if (!error) return;

  const { data } = await supabaseAdmin
    .from('gatherings')
    .select('version')
    .eq('id', gatheringId)
    .single();

  if (data) {
    await supabaseAdmin
      .from('gatherings')
      .update({ version: (data.version as number) + 1 })
      .eq('id', gatheringId);
  }
}

async function writeMessage(
  gatheringId: string,
  type: string,
  content: string,
  senderId: string | null = null,
  metadata: Record<string, unknown> | null = null,
): Promise<void> {
  await supabaseAdmin.from('messages').insert({
    gathering_id: gatheringId,
    type,
    content,
    sender_id: senderId,
    metadata,
  });
}

function isVoteExpired(vote: Vote): boolean {
  return new Date(vote.timeout_at).getTime() < Date.now();
}

// ── Routes ──

/**
 * POST /api/gatherings
 * 创建聚会：生成邀请码，创建者自动加入（is_creator=true）
 */
router.post('/', validate(createGatheringSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as z.infer<typeof createGatheringSchema>;

    // 生成唯一邀请码（重试最多 5 次）
    let code = '';
    for (let i = 0; i < 5; i++) {
      const candidate = generateInviteCode();
      const { data: existing } = await supabaseAdmin
        .from('gatherings')
        .select('id')
        .eq('code', candidate)
        .single();
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, '生成邀请码失败，请重试');
    }

    const { data: gathering, error: gErr } = await supabaseAdmin
      .from('gatherings')
      .insert({
        code,
        name: body.name.trim(),
        target_time: body.target_time,
        status: GatheringStatus.WAITING,
        creator_id: userId,
        version: 1,
      })
      .select()
      .single();

    if (gErr || !gathering) {
      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `创建聚会失败: ${gErr?.message || 'unknown'}`,
      );
    }

    // 创建者昵称（可选传入，否则用 profile）
    let nickname = body.creator_nickname?.trim() || '';
    if (!nickname) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nickname')
        .eq('id', userId)
        .single();
      nickname = (profile?.nickname as string) || '创建者';
    }

    const { data: participant, error: pErr } = await supabaseAdmin
      .from('participants')
      .insert({
        gathering_id: (gathering as any).id,
        user_id: userId,
        nickname,
        tastes: [],
        status: ParticipantStatus.JOINED,
        is_creator: true,
        reminders_sent: {},
      })
      .select()
      .single();

    if (pErr || !participant) {
      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `添加创建者失败: ${pErr?.message || 'unknown'}`,
      );
    }

    await writeMessage(
      (gathering as any).id as string,
      MessageType.PARTICIPANT_JOINED,
      `${nickname} 创建了聚会「${body.name.trim()}」`,
      userId,
      { participant_id: (participant as any).id, is_creator: true },
    );

    await bumpVersion((gathering as any).id as string);

    res.status(201).json({ success: true, data: gathering as Gathering });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/mine?status=active&limit=20&offset=0
 * 我的聚会列表
 */
router.get('/mine', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
    const status = (req.query.status as string | undefined)?.trim();

    const { data: myParts, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('gathering_id')
      .eq('user_id', userId);

    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    const gatheringIds = (myParts || []).map((p) => p.gathering_id as string);
    if (gatheringIds.length === 0) {
      res.json({ success: true, data: { gatherings: [], total: 0 } });
      return;
    }

    let q = supabaseAdmin
      .from('gatherings')
      .select('*', { count: 'exact' })
      .in('id', gatheringIds);

    if (status) {
      if (status === 'active') {
        q = q.neq('status', GatheringStatus.COMPLETED);
      } else {
        q = q.eq('status', status);
      }
    }

    const { data: gatherings, error: gErr, count } = await q
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (gErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, gErr.message);
    }

    res.json({
      success: true,
      data: {
        gatherings: gatherings || [],
        total: count || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/:code
 * 获取聚会详情（含 participants/nominations/active_vote/messages）
 */
router.get('/:code', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const supabase = req.supabase!;

    await requireParticipant(gathering, userId);

    const [participantsRes, nominationsRes, voteRes, messagesRes] = await Promise.all([
      supabase.from('participants').select('*').eq('gathering_id', gathering.id),
      supabase
        .from('nominations')
        .select('*')
        .eq('gathering_id', gathering.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('votes')
        .select('*')
        .eq('gathering_id', gathering.id)
        .eq('status', VoteStatus.ACTIVE)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('messages')
        .select('*')
        .eq('gathering_id', gathering.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (participantsRes.error) {
      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `查询参与者失败: ${participantsRes.error.message}`,
      );
    }
    if (nominationsRes.error) {
      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `查询提名失败: ${nominationsRes.error.message}`,
      );
    }
    if (voteRes.error) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `查询投票失败: ${voteRes.error.message}`);
    }
    if (messagesRes.error) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `查询消息失败: ${messagesRes.error.message}`);
    }

    const nominations = (nominationsRes.data || []) as Nomination[];

    let activeVote:
      | (Vote & { vote_counts: VoteCountItem[]; total_voted: number; has_voted: boolean })
      | null = null;
    if (voteRes.data && voteRes.data.length > 0) {
      const vote = voteRes.data[0] as Vote;
      const { data: records, error: rErr } = await supabase
        .from('vote_records')
        .select('*')
        .eq('vote_id', vote.id);
      if (rErr) {
        throw new AppError(500, ErrorCode.INTERNAL_ERROR, `查询投票记录失败: ${rErr.message}`);
      }
      const voteRecords = (records || []) as VoteRecord[];
      const counts = new Map<string, number>();
      for (const r of voteRecords) {
        counts.set(r.nomination_id, (counts.get(r.nomination_id) || 0) + 1);
      }
      activeVote = {
        ...vote,
        vote_counts: nominations.map((n) => ({
          nomination_id: n.id,
          name: n.name,
          count: counts.get(n.id) || 0,
        })),
        total_voted: voteRecords.length,
        has_voted: voteRecords.some((r) => r.user_id === userId),
      };
    }

    res.json({
      success: true,
      data: {
        gathering,
        participants: (participantsRes.data || []) as Participant[],
        nominations,
        active_vote: activeVote,
        messages: ((messagesRes.data || []) as Message[]).reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/join
 * 加入聚会（waiting 状态）
 */
router.post('/:code/join', validate(joinGatheringSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const body = req.body as z.infer<typeof joinGatheringSchema>;

    if (gathering.status !== GatheringStatus.WAITING) {
      throw new AppError(400, ErrorCode.INVALID_STATE, '当前状态不允许加入');
    }

    const existing = await getMyParticipant(gathering.id, userId);
    if (existing) {
      throw new AppError(400, ErrorCode.ALREADY_JOINED);
    }

    const { data: allParticipants, error: countErr } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('gathering_id', gathering.id);
    if (countErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, countErr.message);
    }
    if ((allParticipants?.length || 0) >= MAX_PARTICIPANTS) {
      throw new AppError(400, ErrorCode.GATHERING_FULL);
    }

    const nicknameResult = validateNickname(body.nickname);
    if (!nicknameResult.valid) {
      throw new AppError(400, ErrorCode.INVALID_NICKNAME, nicknameResult.message);
    }

    const { data: participant, error: pErr } = await supabaseAdmin
      .from('participants')
      .insert({
        gathering_id: gathering.id,
        user_id: userId,
        nickname: body.nickname.trim(),
        location: body.location || null,
        location_name: body.location_name || null,
        tastes: [],
        status: ParticipantStatus.JOINED,
        is_creator: false,
        reminders_sent: {},
      })
      .select()
      .single();

    if (pErr || !participant) {
      if (pErr?.code === '23505') {
        throw new AppError(400, ErrorCode.ALREADY_JOINED);
      }
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `加入失败: ${pErr?.message || 'unknown'}`);
    }

    await writeMessage(
      gathering.id,
      MessageType.PARTICIPANT_JOINED,
      `${body.nickname.trim()} 加入了聚会`,
      userId,
      { participant_id: (participant as any).id },
    );

    await bumpVersion(gathering.id);

    res.status(201).json({ success: true, data: participant as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/gatherings/:code/location
 * 更新当前用户的位置信息
 */
router.patch('/:code/location', validate(updateLocationSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const body = req.body as z.infer<typeof updateLocationSchema>;

    const myParticipant = await requireParticipant(gathering, userId);

    const { data: updated, error: uErr } = await supabaseAdmin
      .from('participants')
      .update({
        location: { lng: body.lng, lat: body.lat },
        location_name: body.location_name || null,
      })
      .eq('id', myParticipant.id)
      .select()
      .single();

    if (uErr || !updated) {
      throw new AppError(
        500,
        ErrorCode.INTERNAL_ERROR,
        `更新位置失败: ${uErr?.message || 'unknown'}`,
      );
    }

    await bumpVersion(gathering.id);
    res.json({ success: true, data: updated as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/start-nominating
 * 开始提名阶段（发起人）
 */
router.post('/:code/start-nominating', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    if (gathering.creator_id !== userId) {
      throw new AppError(403, ErrorCode.FORBIDDEN);
    }
    if (gathering.status !== GatheringStatus.WAITING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const { data: participants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }
    if ((participants?.length || 0) < 2) {
      throw new AppError(400, ErrorCode.TOO_FEW_PARTICIPANTS);
    }

    const { error: uErr } = await supabaseAdmin
      .from('gatherings')
      .update({ status: GatheringStatus.NOMINATING })
      .eq('id', gathering.id);
    if (uErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, uErr.message);
    }

    await writeMessage(gathering.id, MessageType.NOMINATING_STARTED, '提名阶段开始');
    await bumpVersion(gathering.id);

    res.json({ success: true, data: { status: GatheringStatus.NOMINATING } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/:code/search-restaurants?keyword=xxx&page=1
 * POI 搜索（参与者）
 */
router.get('/:code/search-restaurants', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    await requireParticipant(gathering, userId);

    const keyword = String(req.query.keyword || '').trim();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    if (!keyword) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, 'keyword 不能为空');
    }

    const { data: participants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('location')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    const locations = (participants || [])
      .map((p) => (p as any).location)
      .filter((loc) => isValidLocation(loc));
    const center = locations.length > 0 ? calculateCenter(locations) : getDefaultCenter();

    const { pois, total } = await searchPOIPage(
      `${center.lng},${center.lat}`,
      keyword,
      3000,
      page,
      20,
    );

    const restaurants: SearchRestaurantResult[] = pois.map((poi) => ({
      amap_id: poi.id,
      name: poi.name,
      type: poi.type,
      address: poi.address,
      location: poi.location,
      rating: poi.rating,
      cost: poi.cost,
      distance_to_center: calculateDistance(center, poi.location),
      photo_url: null,
    }));

    res.json({
      success: true,
      data: {
        restaurants,
        total,
        page,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/ai-suggest
 * AI 推荐（规则算法 P0）
 */
router.post('/:code/ai-suggest', validate(aiSuggestSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const body = req.body as z.infer<typeof aiSuggestSchema>;

    if (gathering.status !== GatheringStatus.NOMINATING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const myParticipant = await requireParticipant(gathering, userId);
    if (!isValidLocation(myParticipant.location)) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, '需要先上传位置信息');
    }

    const tastesResult = validateTastes(body.tastes);
    if (!tastesResult.valid) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, tastesResult.message);
    }

    const { data: participants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    const suggestions: AiSuggestion[] = await buildAiSuggestions(
      participants as Participant[],
      body.tastes,
    );

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/nominate
 * 提名餐厅（每人最多 2 个）
 */
router.post('/:code/nominate', validate(nominateSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const body = req.body as z.infer<typeof nominateSchema>;

    if (gathering.status !== GatheringStatus.NOMINATING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const myParticipant = await requireParticipant(gathering, userId);

    const { data: myNoms, error: myErr } = await supabaseAdmin
      .from('nominations')
      .select('id, amap_id')
      .eq('gathering_id', gathering.id)
      .eq('nominated_by', myParticipant.id);
    if (myErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, myErr.message);
    }
    if ((myNoms?.length || 0) >= MAX_NOMINATIONS_PER_USER) {
      throw new AppError(400, ErrorCode.NOMINATION_LIMIT);
    }
    if (myNoms?.some((n) => n.amap_id === body.amap_id)) {
      throw new AppError(400, ErrorCode.DUPLICATE_NOMINATION);
    }

    const { data: participants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    const travelInfos = await calculateTravelInfos(
      participants as Participant[],
      body.location,
    );

    const score = computeNominationScore({
      travel_infos: travelInfos,
      rating: body.rating ?? null,
      cost: body.cost ?? null,
    });

    const { data: nomination, error: nErr } = await supabaseAdmin
      .from('nominations')
      .insert({
        gathering_id: gathering.id,
        nominated_by: myParticipant.id,
        amap_id: body.amap_id,
        name: body.name,
        type: body.type || null,
        address: body.address || null,
        location: body.location,
        rating: body.rating ?? null,
        cost: body.cost ?? null,
        source: body.source,
        reason: body.source === 'ai' ? (body.reason || null) : null,
        score,
        travel_infos: travelInfos,
        is_confirmed: false,
      })
      .select()
      .single();

    if (nErr || !nomination) {
      if (nErr?.code === '23505') {
        throw new AppError(400, ErrorCode.DUPLICATE_NOMINATION);
      }
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `提名失败: ${nErr?.message || 'unknown'}`);
    }

    await writeMessage(
      gathering.id,
      MessageType.RESTAURANT_NOMINATED,
      `${myParticipant.nickname} 提名了「${body.name}」`,
      userId,
      { nomination_id: (nomination as any).id, nominated_by: myParticipant.id },
    );

    await bumpVersion(gathering.id);

    res.status(201).json({
      success: true,
      data: {
        ...(nomination as Nomination),
        nominator_nickname: myParticipant.nickname,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/gatherings/:code/nominate/:id
 * 撤回提名（仅提名人）
 */
router.delete('/:code/nominate/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const nominationId = normalizeParam(req.params.id);

    if (gathering.status !== GatheringStatus.NOMINATING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const myParticipant = await requireParticipant(gathering, userId);

    const { data: nomination, error: nErr } = await supabaseAdmin
      .from('nominations')
      .select('*')
      .eq('id', nominationId)
      .eq('gathering_id', gathering.id)
      .single();
    if (nErr || !nomination) {
      throw new AppError(404, ErrorCode.NOT_FOUND);
    }

    const nom = nomination as Nomination;
    if (nom.nominated_by !== myParticipant.id) {
      throw new AppError(403, ErrorCode.FORBIDDEN);
    }

    const { error: dErr } = await supabaseAdmin
      .from('nominations')
      .delete()
      .eq('id', nominationId);
    if (dErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, dErr.message);
    }

    await writeMessage(
      gathering.id,
      MessageType.NOMINATION_WITHDRAWN,
      `${myParticipant.nickname} 撤回了提名「${nom.name}」`,
      userId,
      { nomination_id: nominationId },
    );

    await bumpVersion(gathering.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/start-voting
 * 开始投票（发起人）
 */
router.post('/:code/start-voting', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    if (gathering.creator_id !== userId) {
      throw new AppError(403, ErrorCode.FORBIDDEN);
    }
    if (gathering.status !== GatheringStatus.NOMINATING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const { data: nominations, error: nErr } = await supabaseAdmin
      .from('nominations')
      .select('id')
      .eq('gathering_id', gathering.id);
    if (nErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, nErr.message);
    }
    if ((nominations?.length || 0) < 2) {
      throw new AppError(400, ErrorCode.TOO_FEW_NOMINATIONS);
    }

    const { data: participants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    // 检查是否已有进行中的投票
    const { data: activeVotes } = await supabaseAdmin
      .from('votes')
      .select('id, timeout_at')
      .eq('gathering_id', gathering.id)
      .eq('status', VoteStatus.ACTIVE)
      .limit(1);
    if (activeVotes && activeVotes.length > 0) {
      const active = activeVotes[0] as any as Vote;
      if (!isVoteExpired(active)) {
        throw new AppError(400, ErrorCode.INVALID_STATE, '已有进行中的投票');
      }
    }

    const timeoutAt = new Date(Date.now() + VOTE_TIMEOUT_MS).toISOString();
    const { data: vote, error: vErr } = await supabaseAdmin
      .from('votes')
      .insert({
        gathering_id: gathering.id,
        status: VoteStatus.ACTIVE,
        timeout_at: timeoutAt,
        total_participants: participants?.length || 1,
        result: null,
        resolved_at: null,
      })
      .select()
      .single();
    if (vErr || !vote) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, `创建投票失败: ${vErr?.message || 'unknown'}`);
    }

    const { error: uErr } = await supabaseAdmin
      .from('gatherings')
      .update({ status: GatheringStatus.VOTING })
      .eq('id', gathering.id);
    if (uErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, uErr.message);
    }

    await writeMessage(gathering.id, MessageType.VOTE_STARTED, '投票开始', null, {
      vote_id: (vote as any).id,
      timeout_at: timeoutAt,
    });

    await bumpVersion(gathering.id);

    res.json({
      success: true,
      data: {
        vote: {
          ...(vote as Vote),
          nominations: (nominations || []).map((n) => n.id as string),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/vote/:voteId
 * 投票（选择制）
 */
router.post('/:code/vote/:voteId', validate(castVoteSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const voteId = normalizeParam(req.params.voteId);
    const { nomination_id } = req.body as z.infer<typeof castVoteSchema>;

    await requireParticipant(gathering, userId);

    if (gathering.status !== GatheringStatus.VOTING) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const { data: vote, error: vErr } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('id', voteId)
      .eq('gathering_id', gathering.id)
      .single();
    if (vErr || !vote) {
      throw new AppError(404, ErrorCode.NOT_FOUND);
    }

    const voteData = vote as Vote;
    if (voteData.status !== VoteStatus.ACTIVE) {
      throw new AppError(400, ErrorCode.VOTE_ENDED);
    }
    if (isVoteExpired(voteData)) {
      await settleActiveVoteIfNeeded(gathering.id, voteData.id);
      throw new AppError(400, ErrorCode.VOTE_ENDED);
    }

    const { data: nomination, error: nErr } = await supabaseAdmin
      .from('nominations')
      .select('id')
      .eq('id', nomination_id)
      .eq('gathering_id', gathering.id)
      .single();
    if (nErr || !nomination) {
      throw new AppError(400, ErrorCode.INVALID_NOMINATION);
    }

    const { data: existing } = await supabaseAdmin
      .from('vote_records')
      .select('id')
      .eq('vote_id', voteId)
      .eq('user_id', userId)
      .single();
    if (existing) {
      throw new AppError(400, ErrorCode.ALREADY_VOTED);
    }

    const { error: iErr } = await supabaseAdmin.from('vote_records').insert({
      vote_id: voteId,
      user_id: userId,
      nomination_id,
    });
    if (iErr) {
      if (iErr.code === '23505') {
        throw new AppError(400, ErrorCode.ALREADY_VOTED);
      }
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, iErr.message);
    }

    const { data: records, error: rErr } = await supabaseAdmin
      .from('vote_records')
      .select('*')
      .eq('vote_id', voteId);
    if (rErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, rErr.message);
    }
    const voteRecords = (records || []) as VoteRecord[];

    const { data: nominations, error: nomsErr } = await supabaseAdmin
      .from('nominations')
      .select('*')
      .eq('gathering_id', gathering.id);
    if (nomsErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, nomsErr.message);
    }
    const allNoms = (nominations || []) as Nomination[];

    const counts = new Map<string, number>();
    for (const r of voteRecords) {
      counts.set(r.nomination_id, (counts.get(r.nomination_id) || 0) + 1);
    }
    const voteCounts: VoteCountItem[] = allNoms.map((n) => ({
      nomination_id: n.id,
      name: n.name,
      count: counts.get(n.id) || 0,
    }));

    let result: VoteWinnerResult | null = null;
    if (voteRecords.length >= voteData.total_participants) {
      const settled = await settleActiveVoteIfNeeded(gathering.id, voteData.id);
      if (settled?.winner) {
        result = {
          winner_nomination_id: settled.winner.id,
          winner_name: settled.winner.name,
        };
      }
    }

    await bumpVersion(gathering.id);

    res.json({
      success: true,
      data: {
        vote_counts: voteCounts,
        total_voted: voteRecords.length,
        total_participants: voteData.total_participants,
        result,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/depart
 * 标记出发（confirmed/departing）
 */
router.post('/:code/depart', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    if (
      gathering.status !== GatheringStatus.CONFIRMED &&
      gathering.status !== GatheringStatus.DEPARTING
    ) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const myParticipant = await requireParticipant(gathering, userId);
    if (myParticipant.status !== ParticipantStatus.JOINED) {
      throw new AppError(400, ErrorCode.INVALID_STATE, '当前状态不允许标记出发');
    }

    const now = new Date().toISOString();
    const { data: updated, error: uErr } = await supabaseAdmin
      .from('participants')
      .update({ status: ParticipantStatus.DEPARTED, departed_at: now })
      .eq('id', myParticipant.id)
      .select()
      .single();
    if (uErr || !updated) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, uErr?.message || '更新失败');
    }

    // 第一个人出发：confirmed -> departing
    if (gathering.status === GatheringStatus.CONFIRMED) {
      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.DEPARTING })
        .eq('id', gathering.id);
    }

    await writeMessage(
      gathering.id,
      MessageType.DEPARTED,
      `${myParticipant.nickname} 已出发`,
      userId,
      { participant_id: myParticipant.id },
    );

    await bumpVersion(gathering.id);
    res.json({ success: true, data: updated as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/arrive
 * 标记到达（confirmed/departing）
 */
router.post('/:code/arrive', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    if (
      gathering.status !== GatheringStatus.CONFIRMED &&
      gathering.status !== GatheringStatus.DEPARTING
    ) {
      throw new AppError(400, ErrorCode.INVALID_STATE);
    }

    const myParticipant = await requireParticipant(gathering, userId);
    if (myParticipant.status !== ParticipantStatus.DEPARTED) {
      throw new AppError(400, ErrorCode.INVALID_STATE, '请先标记出发');
    }

    const now = new Date().toISOString();
    const { data: updated, error: uErr } = await supabaseAdmin
      .from('participants')
      .update({ status: ParticipantStatus.ARRIVED, arrived_at: now })
      .eq('id', myParticipant.id)
      .select()
      .single();
    if (uErr || !updated) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, uErr?.message || '更新失败');
    }

    await writeMessage(
      gathering.id,
      MessageType.ARRIVED,
      `${myParticipant.nickname} 已到达`,
      userId,
      { participant_id: myParticipant.id },
    );

    const { data: allParticipants, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('status')
      .eq('gathering_id', gathering.id);
    if (pErr) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, pErr.message);
    }

    const allArrived = (allParticipants || []).every(
      (p) => (p as any).status === ParticipantStatus.ARRIVED,
    );

    if (allArrived) {
      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.COMPLETED })
        .eq('id', gathering.id);

      await writeMessage(gathering.id, MessageType.ALL_ARRIVED, '全员到达');
    }

    await bumpVersion(gathering.id);
    res.json({ success: true, data: { participant: updated as Participant, allArrived } });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/:code/poll?version=N
 * 轮询更新：版本未变则 changed=false；变更则返回完整状态
 */
router.get('/:code/poll', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const clientVersion = parseInt(req.query.version as string, 10) || 0;

    let gathering = await getGatheringByCode(req.params.code);
    await requireParticipant(gathering, userId);

    // 超时投票结算（poll 触发）
    const { data: activeVotes } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('gathering_id', gathering.id)
      .eq('status', VoteStatus.ACTIVE)
      .order('created_at', { ascending: false })
      .limit(1);

    if (activeVotes && activeVotes.length > 0) {
      const activeVoteId = (activeVotes[0] as any).id as string;
      await settleActiveVoteIfNeeded(gathering.id, activeVoteId);
      gathering = await getGatheringByCode(req.params.code);
    }

    if (gathering.version <= clientVersion) {
      res.json({ success: true, data: { changed: false, version: gathering.version } });
      return;
    }

    const supabase = req.supabase!;
    const [participantsRes, nominationsRes, voteRes, messagesRes] = await Promise.all([
      supabase.from('participants').select('*').eq('gathering_id', gathering.id),
      supabase
        .from('nominations')
        .select('*')
        .eq('gathering_id', gathering.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('votes')
        .select('*')
        .eq('gathering_id', gathering.id)
        .eq('status', VoteStatus.ACTIVE)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('messages')
        .select('*')
        .eq('gathering_id', gathering.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (participantsRes.error || nominationsRes.error || voteRes.error || messagesRes.error) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, '轮询查询失败');
    }

    const nominations = (nominationsRes.data || []) as Nomination[];

    let activeVote: any = null;
    if (voteRes.data && voteRes.data.length > 0) {
      const vote = voteRes.data[0] as Vote;
      const { data: records } = await supabaseAdmin
        .from('vote_records')
        .select('*')
        .eq('vote_id', vote.id);
      const voteRecords = (records || []) as VoteRecord[];
      const counts = new Map<string, number>();
      for (const r of voteRecords) {
        counts.set(r.nomination_id, (counts.get(r.nomination_id) || 0) + 1);
      }
      activeVote = {
        ...vote,
        vote_counts: nominations.map((n) => ({
          nomination_id: n.id,
          name: n.name,
          count: counts.get(n.id) || 0,
        })),
        total_voted: voteRecords.length,
        has_voted: voteRecords.some((r) => r.user_id === userId),
      };
    }

    res.json({
      success: true,
      data: {
        changed: true,
        version: gathering.version,
        gathering,
        participants: (participantsRes.data || []) as Participant[],
        nominations,
        active_vote: activeVote,
        messages: ((messagesRes.data || []) as Message[]).reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
