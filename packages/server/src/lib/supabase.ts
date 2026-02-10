/**
 * Supabase 客户端工厂
 * - supabaseAdmin: 使用 Service Role Key，绕过 RLS，用于服务端操作
 * - createSupabaseClient: 使用用户 JWT，遵守 RLS，用于用户级操作
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

/**
 * 管理员客户端（Service Role Key）
 * 绕过 RLS，用于：创建用户、写入消息、后台任务等
 */
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * 创建用户级 Supabase 客户端
 * 使用用户的 JWT token，遵守 RLS 策略
 * @param token - 用户的 access_token
 */
export function createSupabaseClient(token: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
