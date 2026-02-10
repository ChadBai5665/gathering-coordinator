/**
 * 全局错误处理中间件
 * - AppError: 业务错误类，携带 statusCode 和 errorCode
 * - errorHandler: Express 错误处理中间件，统一输出 ApiErrorResponse 格式
 */

import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@ontheway/shared';
import { ErrorCode, ERROR_MESSAGES } from '@ontheway/shared';
import { config } from '../config/index.js';

/**
 * 业务错误类
 * 用于在路由/服务中抛出可预期的业务错误
 */
export class AppError extends Error {
  /** HTTP 状态码 */
  public readonly statusCode: number;
  /** 业务错误码（来自 shared ErrorCode） */
  public readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message?: string) {
    super(message || ERROR_MESSAGES[errorCode as ErrorCode] || '未知错误');
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = 'AppError';

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 全局错误处理中间件
 * 必须放在所有路由之后注册
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // 已知业务错误
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      code: err.errorCode,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // 未知错误
  console.error('[UnhandledError]', err);

  const body: ApiErrorResponse = {
    success: false,
    code: ErrorCode.UNKNOWN,
    message:
      config.nodeEnv === 'development'
        ? err.message || '服务器内部错误'
        : '服务器内部错误，请稍后重试',
  };
  res.status(500).json(body);
}
