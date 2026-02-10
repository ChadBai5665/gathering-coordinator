-- ============================================================================
-- 初始化迁移文件
-- ============================================================================
-- 说明: 这是一个占位迁移文件
-- 实际的数据库 Schema 将在 Phase 2: 后端核心服务 中创建
-- ============================================================================

-- 创建时间戳: 2024-02-10
-- 版本: 0.0.0

-- 启用必要的 PostgreSQL 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID 生成
CREATE EXTENSION IF NOT EXISTS "postgis";        -- 地理位置支持
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- 文本相似度搜索

-- 创建基础 Schema 标记
DO $$
BEGIN
  RAISE NOTICE '=== OnTheWay 数据库初始化 ===';
  RAISE NOTICE '扩展已启用: uuid-ossp, postgis, pg_trgm';
  RAISE NOTICE '等待 Phase 2 创建完整 Schema...';
END $$;

-- TODO: Phase 2 将创建以下表结构:
-- - users (用户表)
-- - gatherings (聚会表)
-- - gathering_participants (参与者表)
-- - locations (地点表)
-- - location_votes (投票表)
-- - notifications (通知表)
-- - user_preferences (用户偏好表)
