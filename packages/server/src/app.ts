/**
 * Express 应用入口
 * 组装中间件、路由、错误处理
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.js';
import gatheringRoutes from './routes/gathering.js';

const app: Express = express();

// ── 全局中间件 ──
app.use(cors());
app.use(express.json());

// ── 健康检查 ──
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ── 业务路由 ──
app.use('/api/auth', authRoutes);
app.use('/api/gatherings', gatheringRoutes);

// ── 404 处理 ──
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '接口不存在',
    },
  });
});

// ── 全局错误处理（必须放最后） ──
app.use(errorHandler);

export default app;
