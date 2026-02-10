/**
 * 认证路由 /api/auth
 * - POST /guest  — 匿名登录（创建匿名用户 + profile）
 * - POST /wechat — 微信登录（code 换 openid → 查找或创建用户）
 */

import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/error-handler.js';
import { supabaseAdmin } from '../lib/supabase.js';
import {
  ErrorCode,
  validateNickname,
  NICKNAME_MAX_LENGTH,
} from '@ontheway/shared';
import type { AuthResponse, UserProfile } from '@ontheway/shared';

const router: RouterType = Router();

// ── Schema ──

const guestSchema = z.object({
  nickname: z
    .string()
    .min(1, '昵称不能为空')
    .max(NICKNAME_MAX_LENGTH, `昵称不能超过${NICKNAME_MAX_LENGTH}个字符`),
});

const wechatSchema = z.object({
  code: z.string().min(1, '微信登录 code 不能为空'),
});

// ── 工具函数 ──

/**
 * 创建或获取用户 profile
 */
async function ensureProfile(
  userId: string,
  nickname: string,
  wxOpenid?: string,
): Promise<UserProfile> {
  // 先查是否已有 profile
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existing) {
    return existing as UserProfile;
  }

  // 创建新 profile
  const profile: Omit<UserProfile, 'avatar_url'> & { avatar_url: null } = {
    id: userId,
    nickname: nickname.trim(),
    avatar_url: null,
    wx_openid: wxOpenid || null,
    preferences: {},
  };

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw new AppError(500, ErrorCode.UNKNOWN, `创建用户资料失败: ${error.message}`);
  }

  return data as UserProfile;
}

// ── 路由 ──

/**
 * POST /api/auth/guest
 * 匿名登录：创建 Supabase 匿名用户，生成 profile
 */
router.post('/guest', validate(guestSchema), async (req, res, next) => {
  try {
    const { nickname } = req.body as z.infer<typeof guestSchema>;

    // 校验昵称业务规则
    const nicknameResult = validateNickname(nickname);
    if (!nicknameResult.valid) {
      throw new AppError(400, ErrorCode.INVALID_NICKNAME, nicknameResult.message);
    }

    // 创建匿名用户
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInAnonymously();

    if (authError || !authData.session || !authData.user) {
      throw new AppError(
        500,
        ErrorCode.UNKNOWN,
        `创建匿名用户失败: ${authError?.message || '无 session'}`,
      );
    }

    const { session, user } = authData;

    // 创建 profile
    const profile = await ensureProfile(user.id, nickname.trim());

    const response: AuthResponse = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: profile,
    };

    res.status(201).json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/wechat
 * 微信登录：code → openid → 查找或创建用户
 */
router.post('/wechat', validate(wechatSchema), async (req, _res, next) => {
  try {
    const { code: _code } = req.body as z.infer<typeof wechatSchema>;

    // TODO: 调用微信 code2session API 获取 openid
    // 需要真实的 WX_APPID 和 WX_SECRET
    // const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wxAppid}&secret=${config.wxSecret}&js_code=${code}&grant_type=authorization_code`;
    // const wxRes = await fetch(wxUrl);
    // const wxData = await wxRes.json();
    // const { openid, session_key } = wxData;

    // 临时：返回未实现错误
    throw new AppError(
      501,
      ErrorCode.UNKNOWN,
      '微信登录尚未实现，请使用匿名登录。需要配置 WX_APPID 和 WX_SECRET 后启用。',
    );

    // 实际实现流程（待启用）：
    // 1. 用 openid 查找已有用户
    // 2. 如果存在 → 生成 session 返回
    // 3. 如果不存在 → 创建用户 + profile → 返回
  } catch (err) {
    next(err);
  }
});

export default router;
