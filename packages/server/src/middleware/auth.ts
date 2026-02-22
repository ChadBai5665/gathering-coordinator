/**
 * 认证中间件
 * - authMiddleware: 强制认证，无 token 则 401
 * - optionalAuth: 可选认证，无 token 也放行
 * 扩展 Express Request 类型，附加 user 和 supabase 客户端
 */

import type { Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, createSupabaseClient } from '../lib/supabase.js';
import { AppError } from './error-handler.js';
import { ErrorCode } from '@ontheway/shared';

/** 认证用户信息 */
export interface AuthUser {
  /** Supabase auth.users.id */
  id: string;
  /** 用户邮箱（匿名用户可能为空） */
  email?: string;
}

/** 扩展 Express Request 类型 */
declare global {
  namespace Express {
    interface Request {
      /** 当前认证用户（authMiddleware 注入） */
      user?: AuthUser;
      /** 用户级 Supabase 客户端（遵守 RLS） */
      supabase?: SupabaseClient;
    }
  }
}

/**
 * 从 Authorization header 提取 Bearer token
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * 验证 token 并注入用户信息到 req
 * @returns 是否验证成功
 */
async function verifyAndAttach(req: Request): Promise<boolean> {
  const token = extractToken(req);
  if (!token) return false;

  // 使用 admin 客户端验证 token（不受 RLS 限制）
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return false;

  req.user = {
    id: data.user.id,
    email: data.user.email,
  };

  // 创建用户级客户端（遵守 RLS）
  req.supabase = createSupabaseClient(token);
  return true;
}

/**
 * 强制认证中间件
 * 无有效 token → 401 Unauthorized
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ok = await verifyAndAttach(req);
    if (!ok) {
      throw new AppError(401, ErrorCode.AUTH_REQUIRED, '请先登录');
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * 可选认证中间件
 * 有 token 则验证并注入，无 token 也放行（req.user 为 undefined）
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await verifyAndAttach(req);
    next();
  } catch {
    // 验证失败也放行，只是不注入 user
    next();
  }
}
