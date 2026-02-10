/**
 * 认证相关类型
 * 用户 Profile、登录参数等
 */

/** 用户资料（对应 profiles 表） */
export interface UserProfile {
  /** 用户 ID（关联 auth.users.id） */
  id: string;
  /** 昵称 */
  nickname: string;
  /** 头像 URL */
  avatar_url: string | null;
  /** 微信 OpenID */
  wx_openid: string | null;
  /** 用户偏好设置 */
  preferences: UserPreferences;
}

/** 用户偏好设置（JSONB） */
export interface UserPreferences {
  /** 默认口味偏好 */
  default_tastes?: string[];
  /** 默认昵称 */
  default_nickname?: string;
}

/** 微信登录参数 */
export interface WxLoginParams {
  /** 微信临时登录凭证 */
  code: string;
}

/** 登录响应 */
export interface AuthResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token: string;
  /** 用户资料 */
  user: UserProfile;
}
