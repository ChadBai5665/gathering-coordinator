/**
 * 服务端配置
 * 加载并验证环境变量，导出类型安全的配置对象
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// 从 cwd 向上查找 .env 文件
function findEnvFile(): string | undefined {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = resolve(dir, '.env');
    if (existsSync(envPath)) return envPath;
    dir = resolve(dir, '..');
  }
  return undefined;
}

dotenv.config({ path: findEnvFile() });

/** 应用配置接口 */
export interface AppConfig {
  /** Supabase 项目 URL */
  supabaseUrl: string;
  /** Supabase 匿名公钥（客户端用） */
  supabaseAnonKey: string;
  /** Supabase Service Role 密钥（服务端用，绕过 RLS） */
  supabaseServiceRoleKey: string;
  /** 高德地图 Web 服务 API Key */
  amapKey: string;
  /** 高德地图 JS API Key */
  amapJsKey: string;
  /** 微信小程序 AppID */
  wxAppid: string;
  /** 微信小程序 AppSecret */
  wxSecret: string;
  /** 服务端口 */
  port: number;
  /** 运行环境 */
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * 获取环境变量，缺失时抛出错误
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`缺少必需的环境变量: ${key}`);
  }
  return value;
}

/**
 * 获取可选环境变量，缺失时返回默认值
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * 加载并验证配置
 * 必需变量缺失时会在启动阶段直接抛错
 */
function loadConfig(): AppConfig {
  return {
    supabaseUrl: requireEnv('SUPABASE_URL'),
    supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    amapKey: optionalEnv('AMAP_KEY', ''),
    amapJsKey: optionalEnv('AMAP_JS_KEY', ''),
    wxAppid: optionalEnv('WX_APPID', ''),
    wxSecret: optionalEnv('WX_SECRET', ''),
    port: parseInt(optionalEnv('PORT', '3000'), 10),
    nodeEnv: optionalEnv('NODE_ENV', 'development') as AppConfig['nodeEnv'],
  };
}

/** 全局配置单例 */
export const config = loadConfig();
