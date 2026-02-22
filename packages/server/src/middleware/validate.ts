/**
 * 请求体校验中间件
 * 使用 Zod schema 验证 req.body，失败返回 400
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import type { ApiErrorResponse } from '@ontheway/shared';
import { ErrorCode } from '@ontheway/shared';

/**
 * 格式化 Zod 校验错误为可读字符串
 */
function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
      return `${path}${e.message}`;
    })
    .join('; ');
}

/**
 * 创建请求体校验中间件
 * @param schema - Zod schema，用于验证 req.body
 * @returns Express 中间件
 *
 * @example
 * ```ts
 * const createSchema = z.object({ name: z.string().min(1) });
 * router.post('/', validate(createSchema), handler);
 * ```
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const body: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: formatZodError(result.error),
        },
      };
      res.status(400).json(body);
      return;
    }

    // 用解析后的数据替换 body（Zod 会做类型转换和默认值填充）
    req.body = result.data;
    next();
  };
}
