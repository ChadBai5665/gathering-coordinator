/**
 * 服务启动入口
 * 加载配置 → 启动 Express → 启动提醒引擎 → 优雅关闭
 */

import { config } from './config/index.js';
import app from './app.js';
import { startReminderEngine, stopReminderEngine } from './services/reminder.service.js';

const server = app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   碰个头 (OnTheWay) Server           ║
  ║   Port: ${String(config.port).padEnd(28)}║
  ║   Env:  ${config.nodeEnv.padEnd(28)}║
  ╚══════════════════════════════════════╝
  `);

  // 启动提醒引擎
  startReminderEngine();
});

// ── 优雅关闭 ──

function gracefulShutdown(signal: string): void {
  console.log(`\n[${signal}] 正在关闭服务...`);

  // 停止提醒引擎
  stopReminderEngine();

  // 关闭 HTTP 服务
  server.close(() => {
    console.log('[Server] HTTP 服务已关闭');
    process.exit(0);
  });

  // 超时强制退出
  setTimeout(() => {
    console.error('[Server] 关闭超时，强制退出');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常兜底
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  gracefulShutdown('UncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});
