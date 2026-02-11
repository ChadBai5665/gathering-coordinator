/**
 * 聚会路由 /api/gatherings
 * 核心业务：创建/加入/推荐/投票/出发/到达/轮询
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
} from '@ontheway/shared';
import type {
  Gathering,
  Participant,
  Restaurant,
  Vote,
  VoteRecord,
} from '@ontheway/shared';
import { recommend } from '../services/restaurant.service.js';
import { calculateDepartureTimes } from '../services/time-calculator.service.js';
import { sendInstantNotice } from '../services/reminder.service.js';

const router: RouterType = Router();

// 所有聚会路由都需要认证
router.use(authMiddleware);

// ── Zod Schemas ──

const createGatheringSchema = z.object({
  name: z.string().min(1).max(50),
  target_time: z.string().datetime({ message: '目标时间格式无效，需要 ISO 8601' }),
  creator_nickname: z.string().min(1).max(NICKNAME_MAX_LENGTH).optional(),
  creator_tastes: z
    .array(z.string())
    .max(MAX_TASTE_COUNT)
    .optional()
    .default([]),
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
  tastes: z
    .array(z.string())
    .max(MAX_TASTE_COUNT)
    .optional()
    .default([]),
});

const startVoteSchema = z.object({
  restaurant_index: z.number().int().min(0),
});

const castVoteSchema = z.object({
  agree: z.boolean(),
});

// ── 工具函数 ──

/**
 * 根据邀请码查询聚会，不存在则抛 404
 */
async function getGatheringByCode(codeParam: string | string[]): Promise<Gathering> {
  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  if (!isValidInviteCode(code)) {
    throw new AppError(400, ErrorCode.INVALID_INVITE_CODE);
  }

  const { data, error } = await supabaseAdmin
    .from('gatherings')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !data) {
    throw new AppError(404, ErrorCode.GATHERING_NOT_FOUND);
  }

  return data as Gathering;
}

/**
 * 查询当前用户在聚会中的参与者记录
 */
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

/**
 * 递增聚会版本号
 */
async function bumpVersion(gatheringId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('increment_version', {
    gathering_id_input: gatheringId,
  });

  if (error) {
    // 回退：手动 +1
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
}

/**
 * 写入消息
 */
async function writeMessage(
  gatheringId: string,
  type: string,
  text: string,
  targetId?: string,
): Promise<void> {
  await supabaseAdmin.from('messages').insert({
    gathering_id: gatheringId,
    type,
    text,
    target_id: targetId || null,
  });
}

// ── 路由 ──

/**
 * POST /api/gatherings
 * 创建聚会：生成邀请码，创建者自动成为第一个参与者
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
      throw new AppError(500, ErrorCode.UNKNOWN, '生成邀请码失败，请重试');
    }

    // 创建聚会
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
      throw new AppError(500, ErrorCode.UNKNOWN, `创建聚会失败: ${gErr?.message}`);
    }

    // 获取创建者昵称（优先用传入的，否则查 profile）
    let nickname = body.creator_nickname?.trim() || '';
    if (!nickname) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nickname')
        .eq('id', userId)
        .single();
      nickname = (profile?.nickname as string) || '创建者';
    }

    // 创建者作为第一个参与者
    const { error: pErr } = await supabaseAdmin.from('participants').insert({
      gathering_id: gathering.id,
      user_id: userId,
      nickname,
      tastes: body.creator_tastes,
      status: ParticipantStatus.JOINED,
      reminders_sent: {},
    });

    if (pErr) {
      throw new AppError(500, ErrorCode.UNKNOWN, `添加创建者失败: ${pErr.message}`);
    }

    // 写入系统消息
    await writeMessage(
      gathering.id,
      MessageType.SYSTEM,
      `${nickname} 创建了聚会「${body.name.trim()}」`,
    );

    res.status(201).json({
      success: true,
      data: gathering as Gathering,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/mine
 * 查询我参与的所有聚会
 */
router.get('/mine', async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // 查询我参与的聚会 ID
    const { data: myParts, error: pErr } = await supabaseAdmin
      .from('participants')
      .select('gathering_id')
      .eq('user_id', userId);

    if (pErr) {
      throw new AppError(500, ErrorCode.UNKNOWN, pErr.message);
    }

    if (!myParts || myParts.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const gatheringIds = myParts.map((p) => p.gathering_id);

    // 查询聚会详情
    const { data: gatherings, error: gErr } = await supabaseAdmin
      .from('gatherings')
      .select('*')
      .in('id', gatheringIds)
      .order('created_at', { ascending: false });

    if (gErr) {
      throw new AppError(500, ErrorCode.UNKNOWN, gErr.message);
    }

    res.json({ success: true, data: gatherings || [] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/:code
 * 获取聚会详情（含参与者、餐厅、活跃投票、最近消息）
 */
router.get('/:code', async (req, res, next) => {
  try {
    const gathering = await getGatheringByCode(req.params.code);

    // 并行查询关联数据
    const [participantsRes, restaurantsRes, voteRes, messagesRes] =
      await Promise.all([
        supabaseAdmin
          .from('participants')
          .select('*')
          .eq('gathering_id', gathering.id),
        supabaseAdmin
          .from('restaurants')
          .select('*')
          .eq('gathering_id', gathering.id)
          .order('score', { ascending: false }),
        supabaseAdmin
          .from('votes')
          .select('*')
          .eq('gathering_id', gathering.id)
          .eq('status', VoteStatus.ACTIVE)
          .order('created_at', { ascending: false })
          .limit(1),
        supabaseAdmin
          .from('messages')
          .select('*')
          .eq('gathering_id', gathering.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

    // 如果有活跃投票，查询投票记录
    let voteDetail = null;
    if (voteRes.data && voteRes.data.length > 0) {
      const activeVote = voteRes.data[0] as Vote;
      const { data: records } = await supabaseAdmin
        .from('vote_records')
        .select('*')
        .eq('vote_id', activeVote.id);

      const voteRecords = (records || []) as VoteRecord[];
      voteDetail = {
        ...activeVote,
        agree_count: voteRecords.filter((r) => r.agree).length,
        disagree_count: voteRecords.filter((r) => !r.agree).length,
        total_voters: voteRecords.length,
        has_voted: req.user
          ? voteRecords.some((r) => r.user_id === req.user!.id)
          : false,
      };
    }

    res.json({
      success: true,
      data: {
        gathering,
        participants: participantsRes.data || [],
        restaurants: restaurantsRes.data || [],
        active_vote: voteDetail,
        messages: (messagesRes.data || []).reverse(), // 按时间正序
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/join
 * 加入聚会
 */
router.post('/:code/join', validate(joinGatheringSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const body = req.body as z.infer<typeof joinGatheringSchema>;

    // 检查聚会状态
    if (
      gathering.status === GatheringStatus.COMPLETED ||
      gathering.status === GatheringStatus.CANCELLED
    ) {
      throw new AppError(400, ErrorCode.GATHERING_ENDED);
    }

    // 检查是否已加入
    const existing = await getMyParticipant(gathering.id, userId);
    if (existing) {
      throw new AppError(400, ErrorCode.ALREADY_JOINED);
    }

    // 校验昵称
    const nicknameResult = validateNickname(body.nickname);
    if (!nicknameResult.valid) {
      throw new AppError(400, ErrorCode.INVALID_NICKNAME, nicknameResult.message);
    }

    // 校验口味
    if (body.tastes.length > 0) {
      const tastesResult = validateTastes(body.tastes);
      if (!tastesResult.valid) {
        throw new AppError(400, ErrorCode.INVALID_TASTE, tastesResult.message);
      }
    }

    // 添加参与者
    const { data: participant, error: pErr } = await supabaseAdmin
      .from('participants')
      .insert({
        gathering_id: gathering.id,
        user_id: userId,
        nickname: body.nickname.trim(),
        location: body.location || null,
        location_name: body.location_name || null,
        tastes: body.tastes,
        status: ParticipantStatus.JOINED,
        reminders_sent: {},
      })
      .select()
      .single();

    if (pErr) {
      throw new AppError(500, ErrorCode.UNKNOWN, `加入聚会失败: ${pErr.message}`);
    }

    // 写入加入消息
    await writeMessage(
      gathering.id,
      MessageType.JOIN,
      `${body.nickname.trim()} 加入了聚会`,
      participant.id,
    );

    // 递增版本号
    await bumpVersion(gathering.id);

    res.status(201).json({ success: true, data: participant as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/recommend
 * 触发餐厅推荐
 */
router.post('/:code/recommend', async (req, res, next) => {
  try {
    const gathering = await getGatheringByCode(req.params.code);

    // 状态检查：只有 waiting 状态可以推荐
    if (gathering.status !== GatheringStatus.WAITING) {
      throw new AppError(400, ErrorCode.GATHERING_ENDED, '当前状态不允许推荐餐厅');
    }

    // 查询参与者
    const { data: participants } = await supabaseAdmin
      .from('participants')
      .select('*')
      .eq('gathering_id', gathering.id);

    if (!participants || participants.length === 0) {
      throw new AppError(400, ErrorCode.NOT_JOINED, '聚会中没有参与者');
    }

    const withLocation = (participants as Participant[]).filter((p) => p.location);
    if (withLocation.length === 0) {
      throw new AppError(
        400,
        ErrorCode.INVALID_LOCATION,
        '至少需要一个参与者提供位置信息',
      );
    }

    // 更新状态为推荐中
    await supabaseAdmin
      .from('gatherings')
      .update({ status: GatheringStatus.RECOMMENDING })
      .eq('id', gathering.id);

    // 调用推荐服务
    const candidates = await recommend(participants as Participant[]);

    // 清除旧推荐
    await supabaseAdmin
      .from('restaurants')
      .delete()
      .eq('gathering_id', gathering.id);

    // 写入新推荐
    if (candidates.length > 0) {
      const rows = candidates.map((c) => ({
        gathering_id: gathering.id,
        amap_id: c.amap_id,
        name: c.name,
        type: c.type,
        address: c.address,
        location: c.location,
        rating: c.rating,
        cost: c.cost,
        score: c.score,
        travel_infos: c.travel_infos,
        is_confirmed: false,
      }));

      await supabaseAdmin.from('restaurants').insert(rows);
    }

    // 恢复状态为 waiting
    await supabaseAdmin
      .from('gatherings')
      .update({ status: GatheringStatus.WAITING })
      .eq('id', gathering.id);

    await bumpVersion(gathering.id);

    // 写入系统消息
    await writeMessage(
      gathering.id,
      MessageType.SYSTEM,
      `已推荐 ${candidates.length} 家餐厅，快来投票选择吧！`,
    );

    res.json({ success: true, data: candidates });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/vote
 * 发起投票
 */
router.post('/:code/vote', validate(startVoteSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const { restaurant_index } = req.body as z.infer<typeof startVoteSchema>;

    // 检查是否为参与者
    const myParticipant = await getMyParticipant(gathering.id, userId);
    if (!myParticipant) {
      throw new AppError(403, ErrorCode.NOT_JOINED);
    }

    // 检查是否有进行中的投票
    const { data: activeVotes } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('gathering_id', gathering.id)
      .eq('status', VoteStatus.ACTIVE);

    if (activeVotes && activeVotes.length > 0) {
      throw new AppError(400, ErrorCode.VOTE_IN_PROGRESS);
    }

    // 检查餐厅是否存在
    const { data: restaurants } = await supabaseAdmin
      .from('restaurants')
      .select('*')
      .eq('gathering_id', gathering.id)
      .order('score', { ascending: false });

    if (!restaurants || restaurant_index >= restaurants.length) {
      throw new AppError(400, ErrorCode.RESTAURANT_NOT_FOUND, '餐厅索引无效');
    }

    // 查询参与者数量
    const { data: allParticipants } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('gathering_id', gathering.id);

    const participantCount = allParticipants?.length || 1;

    // 创建投票（5 分钟超时）
    const timeoutAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: vote, error: vErr } = await supabaseAdmin
      .from('votes')
      .insert({
        gathering_id: gathering.id,
        restaurant_index,
        proposer_id: myParticipant.id,
        status: VoteStatus.ACTIVE,
        timeout_at: timeoutAt,
      })
      .select()
      .single();

    if (vErr || !vote) {
      throw new AppError(500, ErrorCode.UNKNOWN, `创建投票失败: ${vErr?.message}`);
    }

    // 更新聚会状态为投票中
    await supabaseAdmin
      .from('gatherings')
      .update({ status: GatheringStatus.VOTING })
      .eq('id', gathering.id);

    // 如果只有 1 个参与者，自动确认
    if (participantCount === 1) {
      // 自动投赞成票
      await supabaseAdmin.from('vote_records').insert({
        vote_id: vote.id,
        user_id: userId,
        agree: true,
      });

      // 确认投票通过
      await supabaseAdmin
        .from('votes')
        .update({ status: VoteStatus.PASSED })
        .eq('id', vote.id);

      // 确认餐厅
      const confirmedRestaurant = restaurants[restaurant_index];
      await supabaseAdmin
        .from('restaurants')
        .update({ is_confirmed: true })
        .eq('id', confirmedRestaurant.id);

      // 更新聚会状态
      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.CONFIRMED })
        .eq('id', gathering.id);

      // 计算出发时间
      await calculateDepartureTimes(gathering.code);

      await writeMessage(
        gathering.id,
        MessageType.RESTAURANT_CONFIRMED,
        `已确认餐厅：${confirmedRestaurant.name}`,
      );
    } else {
      const selectedRestaurant = restaurants[restaurant_index];
      await writeMessage(
        gathering.id,
        MessageType.VOTE,
        `${myParticipant.nickname} 发起了投票：${selectedRestaurant.name}，5分钟内投票`,
        vote.id,
      );
    }

    await bumpVersion(gathering.id);

    res.status(201).json({ success: true, data: vote as Vote });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/vote/:voteId
 * 投票（赞成/反对）
 */
router.post('/:code/vote/:voteId', validate(castVoteSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);
    const voteId = Array.isArray(req.params.voteId) ? req.params.voteId[0] : req.params.voteId;
    const { agree } = req.body as z.infer<typeof castVoteSchema>;

    // 检查是否为参与者
    const myParticipant = await getMyParticipant(gathering.id, userId);
    if (!myParticipant) {
      throw new AppError(403, ErrorCode.NOT_JOINED);
    }

    // 查询投票
    const { data: vote, error: vErr } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('id', voteId)
      .eq('gathering_id', gathering.id)
      .single();

    if (vErr || !vote) {
      throw new AppError(404, ErrorCode.VOTE_NOT_FOUND);
    }

    const voteData = vote as Vote;

    // 检查投票状态
    if (voteData.status !== VoteStatus.ACTIVE) {
      throw new AppError(400, ErrorCode.VOTE_ENDED);
    }

    // 检查是否超时
    if (new Date(voteData.timeout_at).getTime() < Date.now()) {
      // 超时自动否决
      await supabaseAdmin
        .from('votes')
        .update({ status: VoteStatus.REJECTED })
        .eq('id', voteId);

      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.WAITING })
        .eq('id', gathering.id);

      await writeMessage(gathering.id, MessageType.VOTE_RESULT, '投票已超时，自动否决');
      await bumpVersion(gathering.id);

      throw new AppError(400, ErrorCode.VOTE_ENDED, '投票已超时');
    }

    // 检查是否已投票
    const { data: existingRecord } = await supabaseAdmin
      .from('vote_records')
      .select('id')
      .eq('vote_id', voteId)
      .eq('user_id', userId)
      .single();

    if (existingRecord) {
      throw new AppError(400, ErrorCode.ALREADY_VOTED);
    }

    // 记录投票
    await supabaseAdmin.from('vote_records').insert({
      vote_id: voteId,
      user_id: userId,
      agree,
    });

    // 查询所有投票记录
    const { data: allRecords } = await supabaseAdmin
      .from('vote_records')
      .select('*')
      .eq('vote_id', voteId);

    const records = (allRecords || []) as VoteRecord[];
    const agreeCount = records.filter((r) => r.agree).length;
    const disagreeCount = records.filter((r) => !r.agree).length;

    // 查询参与者总数
    const { data: allParticipants } = await supabaseAdmin
      .from('participants')
      .select('id')
      .eq('gathering_id', gathering.id);

    const totalParticipants = allParticipants?.length || 1;
    const majority = Math.ceil(totalParticipants / 2);

    // 判断投票结果
    if (agreeCount >= majority) {
      // 投票通过 → 确认餐厅
      await supabaseAdmin
        .from('votes')
        .update({ status: VoteStatus.PASSED })
        .eq('id', voteId);

      // 查询餐厅列表并确认
      const { data: restaurants } = await supabaseAdmin
        .from('restaurants')
        .select('*')
        .eq('gathering_id', gathering.id)
        .order('score', { ascending: false });

      if (restaurants && voteData.restaurant_index < restaurants.length) {
        const confirmed = restaurants[voteData.restaurant_index] as Restaurant;

        await supabaseAdmin
          .from('restaurants')
          .update({ is_confirmed: true })
          .eq('id', confirmed.id);

        // 更新聚会状态为已确认
        await supabaseAdmin
          .from('gatherings')
          .update({ status: GatheringStatus.CONFIRMED })
          .eq('id', gathering.id);

        // 计算出发时间
        await calculateDepartureTimes(gathering.code);

        await writeMessage(
          gathering.id,
          MessageType.RESTAURANT_CONFIRMED,
          `投票通过！已确认餐厅：${confirmed.name}`,
        );
      }
    } else if (disagreeCount >= majority) {
      // 投票否决
      await supabaseAdmin
        .from('votes')
        .update({ status: VoteStatus.REJECTED })
        .eq('id', voteId);

      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.WAITING })
        .eq('id', gathering.id);

      await writeMessage(
        gathering.id,
        MessageType.VOTE_RESULT,
        '投票未通过，请重新选择餐厅',
      );
    }

    await bumpVersion(gathering.id);

    res.json({
      success: true,
      data: {
        agree_count: agreeCount,
        disagree_count: disagreeCount,
        total_voters: records.length,
        total_participants: totalParticipants,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/gatherings/:code/location
 * 更新参与者位置
 */
router.patch('/:code/location', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    // 查询参与者
    const myParticipant = await getMyParticipant(gathering.id, userId);
    if (!myParticipant) {
      throw new AppError(403, ErrorCode.NOT_JOINED);
    }

    // 验证位置数据
    const locationSchema = z.object({
      lng: z.number().min(-180).max(180),
      lat: z.number().min(-90).max(90),
    });

    const location = locationSchema.parse(req.body);

    // 更新位置
    const { data: updated, error } = await supabaseAdmin
      .from('participants')
      .update({ location })
      .eq('id', myParticipant.id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, ErrorCode.UNKNOWN, `更新位置失败: ${error.message}`);
    }

    await bumpVersion(gathering.id);

    res.json({ success: true, data: updated as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/depart
 * 标记出发
 */
router.post('/:code/depart', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    // ���态检查
    if (
      gathering.status !== GatheringStatus.CONFIRMED &&
      gathering.status !== GatheringStatus.ACTIVE
    ) {
      throw new AppError(400, ErrorCode.GATHERING_ENDED, '当前状态不允许标记出发');
    }

    // 查询参与者
    const myParticipant = await getMyParticipant(gathering.id, userId);
    if (!myParticipant) {
      throw new AppError(403, ErrorCode.NOT_JOINED);
    }

    if (myParticipant.status !== ParticipantStatus.JOINED) {
      throw new AppError(400, ErrorCode.UNKNOWN, '当前状态不允许标记出发');
    }

    // 更新参与者状态
    const now = new Date().toISOString();
    const { data: updated, error } = await supabaseAdmin
      .from('participants')
      .update({
        status: ParticipantStatus.DEPARTED,
        departed_at: now,
      })
      .eq('id', myParticipant.id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, ErrorCode.UNKNOWN, error.message);
    }

    // 写入出发消息
    await writeMessage(
      gathering.id,
      MessageType.DEPART,
      `${myParticipant.nickname} 已出发！`,
      myParticipant.id,
    );

    // 检查是否为第一个出发的 → 更新聚会状态为 active
    if (gathering.status === GatheringStatus.CONFIRMED) {
      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.ACTIVE })
        .eq('id', gathering.id);
    }

    // 检查是否全员出发
    const { data: allParticipants } = await supabaseAdmin
      .from('participants')
      .select('status')
      .eq('gathering_id', gathering.id);

    const allDeparted = allParticipants?.every(
      (p) =>
        p.status === ParticipantStatus.DEPARTED ||
        p.status === ParticipantStatus.ARRIVED,
    );

    if (allDeparted) {
      await sendInstantNotice(gathering.id, 'allDeparted', myParticipant);
    }

    await bumpVersion(gathering.id);

    res.json({ success: true, data: updated as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/gatherings/:code/arrive
 * 标记到达
 */
router.post('/:code/arrive', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const gathering = await getGatheringByCode(req.params.code);

    // 状态检查
    if (
      gathering.status !== GatheringStatus.ACTIVE &&
      gathering.status !== GatheringStatus.CONFIRMED
    ) {
      throw new AppError(400, ErrorCode.GATHERING_ENDED, '当前状态不允许标记到达');
    }

    const myParticipant = await getMyParticipant(gathering.id, userId);
    if (!myParticipant) {
      throw new AppError(403, ErrorCode.NOT_JOINED);
    }

    if (myParticipant.status !== ParticipantStatus.DEPARTED) {
      throw new AppError(400, ErrorCode.UNKNOWN, '请先标记出发');
    }

    // 更新参与者状态
    const now = new Date().toISOString();
    const { data: updated, error } = await supabaseAdmin
      .from('participants')
      .update({
        status: ParticipantStatus.ARRIVED,
        arrived_at: now,
      })
      .eq('id', myParticipant.id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, ErrorCode.UNKNOWN, error.message);
    }

    // 写入到达消息
    await writeMessage(
      gathering.id,
      MessageType.ARRIVE,
      `${myParticipant.nickname} 已到达！`,
      myParticipant.id,
    );

    // 检查是否全员到达
    const { data: allParticipants } = await supabaseAdmin
      .from('participants')
      .select('status')
      .eq('gathering_id', gathering.id);

    const allArrived = allParticipants?.every(
      (p) => p.status === ParticipantStatus.ARRIVED,
    );

    if (allArrived) {
      // 全员到达 → 聚会完成
      await supabaseAdmin
        .from('gatherings')
        .update({ status: GatheringStatus.COMPLETED })
        .eq('id', gathering.id);

      await sendInstantNotice(gathering.id, 'allArrived', myParticipant);
    }

    await bumpVersion(gathering.id);

    res.json({ success: true, data: updated as Participant });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/gatherings/:code/poll
 * 轮询更新（客户端定期调用）
 * 如果 gathering.version > 客户端版本号，返回完整状态
 */
router.get('/:code/poll', async (req, res, next) => {
  try {
    const clientVersion = parseInt(req.query.version as string, 10) || 0;
    const gathering = await getGatheringByCode(req.params.code);

    // 版本未变化 → 无更新
    if (gathering.version <= clientVersion) {
      res.json({ success: true, data: { changed: false, version: gathering.version } });
      return;
    }

    // 有更新 → 返回完整状态
    const [participantsRes, restaurantsRes, voteRes, messagesRes] =
      await Promise.all([
        supabaseAdmin
          .from('participants')
          .select('*')
          .eq('gathering_id', gathering.id),
        supabaseAdmin
          .from('restaurants')
          .select('*')
          .eq('gathering_id', gathering.id)
          .order('score', { ascending: false }),
        supabaseAdmin
          .from('votes')
          .select('*')
          .eq('gathering_id', gathering.id)
          .eq('status', VoteStatus.ACTIVE)
          .order('created_at', { ascending: false })
          .limit(1),
        supabaseAdmin
          .from('messages')
          .select('*')
          .eq('gathering_id', gathering.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

    // 活跃投票详情
    let voteDetail = null;
    if (voteRes.data && voteRes.data.length > 0) {
      const activeVote = voteRes.data[0] as Vote;
      const { data: records } = await supabaseAdmin
        .from('vote_records')
        .select('*')
        .eq('vote_id', activeVote.id);

      const voteRecords = (records || []) as VoteRecord[];
      voteDetail = {
        ...activeVote,
        agree_count: voteRecords.filter((r) => r.agree).length,
        disagree_count: voteRecords.filter((r) => !r.agree).length,
        total_voters: voteRecords.length,
        has_voted: req.user
          ? voteRecords.some((r) => r.user_id === req.user!.id)
          : false,
      };
    }

    res.json({
      success: true,
      data: {
        changed: true,
        gathering,
        participants: participantsRes.data || [],
        restaurants: restaurantsRes.data || [],
        active_vote: voteDetail,
        messages: (messagesRes.data || []).reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
