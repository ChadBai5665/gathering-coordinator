-- ============================================================================
-- OnTheWay 完整数据库 Schema
-- ============================================================================
-- 创建时间: 2025-02-11
-- 说明: 包含所有核心表、索引、RLS 策略、触发器、Realtime 配置
-- ============================================================================

-- ===========================================
-- 0. 启用必要的 PostgreSQL 扩展
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID 生成（兼容旧写法）
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- 文本相似度搜索

-- ===========================================
-- 1. 通用触发器函数
-- ===========================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 聚会表 version 自增（乐观锁）
CREATE OR REPLACE FUNCTION increment_gathering_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 2. 表结构
-- ===========================================

-- -------------------------------------------
-- 2.1 profiles — 用户资料（与 auth.users 1:1）
-- -------------------------------------------
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    TEXT NOT NULL CONSTRAINT nickname_length CHECK (char_length(nickname) BETWEEN 1 AND 20),
  avatar_url  TEXT,
  wx_openid   TEXT UNIQUE,
  preferences JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  profiles IS '用户资料表，与 auth.users 一对一';
COMMENT ON COLUMN profiles.wx_openid IS '微信小程序 openid，用于微信登录绑定';
COMMENT ON COLUMN profiles.preferences IS '用户偏好设置（JSON），如口味、通知开关等';

-- -------------------------------------------
-- 2.2 gatherings — 聚会
-- -------------------------------------------
CREATE TABLE gatherings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        CHAR(6) UNIQUE NOT NULL,
  name        TEXT NOT NULL CONSTRAINT gathering_name_length CHECK (char_length(name) BETWEEN 1 AND 50),
  target_time TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'waiting'
              CHECK (status IN ('waiting','recommending','voting','confirmed','active','completed','cancelled')),
  creator_id  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  version     INT DEFAULT 1
);

COMMENT ON TABLE  gatherings IS '聚会主表';
COMMENT ON COLUMN gatherings.code IS '6 位邀请码，用于分享加入';
COMMENT ON COLUMN gatherings.status IS '聚会状态机：waiting→recommending→voting→confirmed→active→completed / cancelled';
COMMENT ON COLUMN gatherings.version IS '乐观锁版本号，每次 UPDATE 自动 +1';

-- -------------------------------------------
-- 2.3 participants — 参与者
-- -------------------------------------------
CREATE TABLE participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id    UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),  -- 可为空（游客模式）
  nickname        TEXT NOT NULL,
  location        JSONB,                            -- {lng, lat}
  location_name   TEXT,
  tastes          TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'joined'
                  CHECK (status IN ('joined','departed','arrived')),
  departure_time  TIMESTAMPTZ,
  travel_duration INT,                              -- 预计出行时长（秒）
  departed_at     TIMESTAMPTZ,
  arrived_at      TIMESTAMPTZ,
  reminders_sent  JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  participants IS '聚会参与者';
COMMENT ON COLUMN participants.user_id IS '关联用户，NULL 表示游客';
COMMENT ON COLUMN participants.location IS '出发位置 {lng: number, lat: number}';
COMMENT ON COLUMN participants.travel_duration IS '预计出行时长（秒）';
COMMENT ON COLUMN participants.reminders_sent IS '已发送提醒记录 {reminder_type: timestamp}';

-- -------------------------------------------
-- 2.4 restaurants — 候选餐厅
-- -------------------------------------------
CREATE TABLE restaurants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  amap_id       TEXT,                               -- 高德地图 POI ID
  name          TEXT NOT NULL,
  type          TEXT,                                -- 餐厅类型/菜系
  address       TEXT,
  location      JSONB NOT NULL,                     -- {lng, lat}
  rating        NUMERIC(2,1),
  cost          NUMERIC(8,2),
  score         INT DEFAULT 0,                      -- 推荐算法评分
  travel_infos  JSONB DEFAULT '[]',                 -- 各参与者到达信息
  is_confirmed  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  restaurants IS '聚会候选餐厅';
COMMENT ON COLUMN restaurants.amap_id IS '高德地图 POI ID';
COMMENT ON COLUMN restaurants.score IS '推荐算法综合评分';
COMMENT ON COLUMN restaurants.travel_infos IS '各参与者出行信息 [{participant_id, duration, distance, ...}]';

-- -------------------------------------------
-- 2.5 votes — 投票
-- -------------------------------------------
CREATE TABLE votes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id     UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  restaurant_index INT NOT NULL,                    -- 对应餐厅在列表中的索引
  proposer_id      UUID NOT NULL REFERENCES auth.users(id),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','passed','rejected')),
  timeout_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  votes IS '餐厅投票';
COMMENT ON COLUMN votes.restaurant_index IS '候选餐厅在列表中的索引位置';
COMMENT ON COLUMN votes.timeout_at IS '投票超时时间，超时自动结算';

-- -------------------------------------------
-- 2.6 vote_records — 投票记录
-- -------------------------------------------
CREATE TABLE vote_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id     UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  agree       BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE(vote_id, user_id)                          -- 每人每次投票只能投一票
);

COMMENT ON TABLE vote_records IS '投票明细记录，每人每次投票仅一票';

-- -------------------------------------------
-- 2.7 messages — 聚会消息流
-- -------------------------------------------
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gathering_id  UUID NOT NULL REFERENCES gatherings(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                CHECK (type IN (
                  'system','join','depart','arrive',
                  'vote','vote_result','restaurant_confirmed',
                  'reminder','urgent','milestone'
                )),
  text          TEXT NOT NULL,
  target_id     UUID,                               -- 关联目标（用户/餐厅等）
  created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  messages IS '聚会消息流（系统消息、状态变更、提醒等）';
COMMENT ON COLUMN messages.type IS '消息类型枚举';
COMMENT ON COLUMN messages.target_id IS '关联目标 ID（用户、餐厅等，按 type 语义解读）';

-- ===========================================
-- 3. 索引
-- ===========================================

-- gatherings（code 已有 UNIQUE 索引）
CREATE INDEX idx_gatherings_creator_id ON gatherings(creator_id);
CREATE INDEX idx_gatherings_status     ON gatherings(status);

-- participants
CREATE INDEX idx_participants_gathering_id ON participants(gathering_id);
CREATE INDEX idx_participants_user_id      ON participants(user_id);
CREATE UNIQUE INDEX idx_participants_gathering_user
  ON participants(gathering_id, user_id)
  WHERE user_id IS NOT NULL;                        -- 同一聚会同一用户只能加入一次

-- restaurants
CREATE INDEX idx_restaurants_gathering_id ON restaurants(gathering_id);

-- votes
CREATE INDEX idx_votes_gathering_id ON votes(gathering_id);
CREATE INDEX idx_votes_status       ON votes(status);

-- vote_records（vote_id, user_id 已有 UNIQUE 索引）
CREATE INDEX idx_vote_records_vote_id ON vote_records(vote_id);

-- messages
CREATE INDEX idx_messages_gathering_id  ON messages(gathering_id);
CREATE INDEX idx_messages_created_at    ON messages(created_at DESC);

-- ===========================================
-- 4. 触发器
-- ===========================================

-- profiles: 自动更新 updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- gatherings: 自动更新 updated_at
CREATE TRIGGER trg_gatherings_updated_at
  BEFORE UPDATE ON gatherings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- gatherings: version 自增（乐观锁）
CREATE TRIGGER trg_gatherings_version
  BEFORE UPDATE ON gatherings
  FOR EACH ROW
  EXECUTE FUNCTION increment_gathering_version();

-- ===========================================
-- 5. RLS（行级安全策略）
-- ===========================================

-- 启用 RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatherings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------
-- 5.1 profiles
-- -------------------------------------------

-- 任何已认证用户可查看所有资料
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 只能创建自己的资料
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 只能更新自己的资料
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- -------------------------------------------
-- 5.2 gatherings
-- -------------------------------------------

-- 已认证用户可查看所有聚会（需要知道 code 才能找到）
CREATE POLICY "gatherings_select"
  ON gatherings FOR SELECT
  TO authenticated
  USING (true);

-- 已认证用户可创建聚会
CREATE POLICY "gatherings_insert"
  ON gatherings FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- 创建者可更新聚会
CREATE POLICY "gatherings_update_creator"
  ON gatherings FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- 参与者可更新聚会（用于 version 轮询等场景）
CREATE POLICY "gatherings_update_participant"
  ON gatherings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.gathering_id = gatherings.id
        AND p.user_id = auth.uid()
    )
  );

-- -------------------------------------------
-- 5.3 participants
-- -------------------------------------------

-- 辅助函数：判断用户是否为聚会参与者
CREATE OR REPLACE FUNCTION is_gathering_participant(p_gathering_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM participants
    WHERE gathering_id = p_gathering_id
      AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 聚会参与者可查看同聚会的所有参与者
CREATE POLICY "participants_select"
  ON participants FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));

-- 已认证用户可加入聚会
CREATE POLICY "participants_insert"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 只能更新自己的参与记录（状态变更等）
CREATE POLICY "participants_update"
  ON participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -------------------------------------------
-- 5.4 restaurants
-- -------------------------------------------

-- 聚会参与者可查看候选餐厅
CREATE POLICY "restaurants_select"
  ON restaurants FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));

-- 仅 service_role 可插入（后端 API 调用）
CREATE POLICY "restaurants_insert_service"
  ON restaurants FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 仅 service_role 可更新
CREATE POLICY "restaurants_update_service"
  ON restaurants FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------
-- 5.5 votes
-- -------------------------------------------

-- 聚会参与者可查看投票
CREATE POLICY "votes_select"
  ON votes FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));

-- 聚会参与者可发起投票
CREATE POLICY "votes_insert"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_gathering_participant(gathering_id, auth.uid())
    AND proposer_id = auth.uid()
  );

-- 仅 service_role 可更新投票状态
CREATE POLICY "votes_update_service"
  ON votes FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------
-- 5.6 vote_records
-- -------------------------------------------

-- 聚会参与者可查看投票记录
CREATE POLICY "vote_records_select"
  ON vote_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM votes v
      WHERE v.id = vote_records.vote_id
        AND is_gathering_participant(v.gathering_id, auth.uid())
    )
  );

-- 已认证用户可投票（每人每次投票仅一票，由 UNIQUE 约束保证）
CREATE POLICY "vote_records_insert"
  ON vote_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- -------------------------------------------
-- 5.7 messages
-- -------------------------------------------

-- 聚会参与者可查看消息
CREATE POLICY "messages_select"
  ON messages FOR SELECT
  TO authenticated
  USING (is_gathering_participant(gathering_id, auth.uid()));

-- 仅 service_role 可插入消息
CREATE POLICY "messages_insert_service"
  ON messages FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ===========================================
-- 6. Realtime 配置
-- ===========================================
-- 将 messages、participants、gatherings 加入 Realtime 发布
-- Supabase 默认使用 supabase_realtime publication

DO $$
BEGIN
  -- 如果 publication 不存在则创建
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 逐个添加表到 publication（忽略已存在的情况）
DO $$
BEGIN
  -- messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  -- participants
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participants;
  END IF;

  -- gatherings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'gatherings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE gatherings;
  END IF;
END $$;

-- ===========================================
-- 完成
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '=== OnTheWay Schema 创建完成 ===';
  RAISE NOTICE '表: profiles, gatherings, participants, restaurants, votes, vote_records, messages';
  RAISE NOTICE 'RLS: 已启用并配置策略';
  RAISE NOTICE 'Realtime: messages, participants, gatherings';
END $$;
