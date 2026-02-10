# 数据模型 — 碰个头 (OnTheWay)

> 版本：v0.1.0 | 最后更新：2025-02

---

## 1. ER 关系图

```
┌──────────────┐
│   profiles   │
│  (用户资料)   │
└──────┬───────┘
       │ 1
       │
       │ ∞                    1 ┌───────────────┐
┌──────┴───────┐ ∞ ─────────── │  gatherings   │
│ participants │                │  (聚会)        │
└──────┬───────┘ ──────────── 1 └───────┬───────┘
       │                                │ 1
       │                                │
       │                                │ ∞
       │                        ┌───────┴───────┐
       │                        │  restaurants  │
       │                        │  (推荐餐厅)    │
       │                        └───────────────┘
       │
       │                        ┌───────────────┐
       │                   1    │    votes      │
       │ ∞ ──────────────────── │  (投票)        │
       │    vote_records        └───────┬───────┘
       │                                │ 1
       │                                │
       │                                │ ∞
       │                        ┌───────┴───────┐
       └────────────────────── │ vote_records  │
                          ∞    │  (投票记录)    │
                               └───────────────┘

┌──────────────┐
│   messages   │ ∞ ──── 1 gatherings
│  (消息记录)   │
└──────────────┘
```

### 关系说明

| 关系 | 说明 |
|------|------|
| profiles → participants | 一个用户可参与多个聚会（1:N） |
| gatherings → participants | 一个聚会有多个参与者（1:N） |
| gatherings → restaurants | 一个聚会有多个推荐餐厅（1:N） |
| gatherings → votes | 一个聚会可有多次投票（1:N） |
| votes → vote_records | 一次投票有多条投票记录（1:N） |
| gatherings → messages | 一个聚会有多条消息（1:N） |

---

## 2. 表结构详细说明

### 2.1 profiles（用户资料）

Supabase Auth 创建用户后，自动在此表创建对应记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, 引用 auth.users(id) | 用户 ID，与 Supabase Auth 关联 |
| `nickname` | text | 可空 | 用户昵称 |
| `avatar_url` | text | 可空 | 头像 URL |
| `wx_openid` | text | 可空, UNIQUE | 微信 OpenID（小程序用户） |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `profiles_pkey` | id | PRIMARY | 主键 |
| `profiles_wx_openid_key` | wx_openid | UNIQUE | 微信 OpenID 唯一索引 |

---

### 2.2 gatherings（聚会）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 聚会 ID |
| `code` | text | NOT NULL, UNIQUE | 6 位邀请码（大写字母+数字） |
| `name` | text | NOT NULL | 聚会名称 |
| `status` | text | NOT NULL, DEFAULT 'waiting' | 聚会状态 |
| `target_time` | timestamptz | NOT NULL | 目标到达时间 |
| `creator_id` | uuid | NOT NULL, FK → profiles(id) | 发起人 ID |
| `confirmed_restaurant_id` | uuid | 可空, FK → restaurants(id) | 确认的餐厅 ID |
| `version` | integer | NOT NULL, DEFAULT 1 | 数据版本号（轮询用） |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| `waiting` | 等待参与者加入 |
| `recommending` | AI 推荐中 |
| `recommended` | 推荐完成 |
| `voting` | 投票进行中 |
| `confirmed` | 餐厅已确认 |
| `completed` | 聚会完成 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `gatherings_pkey` | id | PRIMARY | 主键 |
| `gatherings_code_key` | code | UNIQUE | 邀请码唯一索引 |
| `gatherings_creator_id_idx` | creator_id | INDEX | 按发起人查询 |
| `gatherings_status_idx` | status | INDEX | 按状态查询 |

---

### 2.3 participants（参与者）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 参与者记录 ID |
| `gathering_id` | uuid | NOT NULL, FK → gatherings(id) ON DELETE CASCADE | 聚会 ID |
| `user_id` | uuid | NOT NULL, FK → profiles(id) | 用户 ID |
| `nickname` | text | NOT NULL | 参与时使用的昵称 |
| `location` | jsonb | 可空 | 位置坐标 `{ "lat": number, "lng": number }` |
| `location_name` | text | 可空 | 位置名称 |
| `tastes` | text[] | DEFAULT '{}' | 口味偏好标签数组 |
| `status` | text | NOT NULL, DEFAULT 'joined' | 参与者状态 |
| `is_creator` | boolean | NOT NULL, DEFAULT false | 是否为发起人 |
| `estimated_duration` | integer | 可空 | 预估到达时间（分钟） |
| `estimated_distance` | integer | 可空 | 预估距离（米） |
| `suggested_depart_at` | timestamptz | 可空 | 建议出发时间 |
| `departed_at` | timestamptz | 可空 | 实际出发时间 |
| `arrived_at` | timestamptz | 可空 | 实际到达时间 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 加入时间 |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | 更新时间 |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| `joined` | 已加入 |
| `departed` | 已出发 |
| `arrived` | 已到达 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `participants_pkey` | id | PRIMARY | 主键 |
| `participants_gathering_id_idx` | gathering_id | INDEX | 按聚会查询 |
| `participants_user_id_idx` | user_id | INDEX | 按用户查询 |
| `participants_gathering_user_key` | (gathering_id, user_id) | UNIQUE | 同一聚会不能重复加入 |

---

### 2.4 restaurants（推荐餐厅）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 餐厅记录 ID |
| `gathering_id` | uuid | NOT NULL, FK → gatherings(id) ON DELETE CASCADE | 聚会 ID |
| `index` | integer | NOT NULL | 推荐排序（0, 1, 2） |
| `name` | text | NOT NULL | 餐厅名称 |
| `address` | text | NOT NULL | 餐厅地址 |
| `cuisine` | text | 可空 | 菜系类型 |
| `rating` | numeric(2,1) | 可空 | 评分（0.0-5.0） |
| `price_per_person` | integer | 可空 | 人均消费（元） |
| `location` | jsonb | NOT NULL | 餐厅坐标 `{ "lat": number, "lng": number }` |
| `reason` | text | 可空 | AI 推荐理由 |
| `distances` | jsonb | 可空 | 每个参与者到餐厅的距离信息 |
| `amap_poi_id` | text | 可空 | 高德 POI ID |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `restaurants_pkey` | id | PRIMARY | 主键 |
| `restaurants_gathering_id_idx` | gathering_id | INDEX | 按聚会查询 |
| `restaurants_gathering_index_key` | (gathering_id, index) | UNIQUE | 同一聚会内排序唯一 |

---

### 2.5 votes（投票）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 投票 ID |
| `gathering_id` | uuid | NOT NULL, FK → gatherings(id) ON DELETE CASCADE | 聚会 ID |
| `restaurant_id` | uuid | NOT NULL, FK → restaurants(id) | 被投票的餐厅 |
| `status` | text | NOT NULL, DEFAULT 'active' | 投票状态 |
| `agree_count` | integer | NOT NULL, DEFAULT 0 | 同意票数 |
| `disagree_count` | integer | NOT NULL, DEFAULT 0 | 反对票数 |
| `total_participants` | integer | NOT NULL | 参与者总数（投票发起时快照） |
| `result` | text | 可空 | 投票结果 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |
| `resolved_at` | timestamptz | 可空 | 投票结束时间 |

**status 枚举值：**

| 值 | 说明 |
|----|------|
| `active` | 投票进行中 |
| `resolved` | 投票已结束 |

**result 枚举值：**

| 值 | 说明 |
|----|------|
| `approved` | 投票通过 |
| `rejected` | 投票未通过 |
| `null` | 投票进行中 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `votes_pkey` | id | PRIMARY | 主键 |
| `votes_gathering_id_idx` | gathering_id | INDEX | 按聚会查询 |

---

### 2.6 vote_records（投票记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 记录 ID |
| `vote_id` | uuid | NOT NULL, FK → votes(id) ON DELETE CASCADE | 投票 ID |
| `user_id` | uuid | NOT NULL, FK → profiles(id) | 投票用户 ID |
| `agree` | boolean | NOT NULL | true=同意, false=反对 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 投票时间 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `vote_records_pkey` | id | PRIMARY | 主键 |
| `vote_records_vote_id_idx` | vote_id | INDEX | 按投票查询 |
| `vote_records_vote_user_key` | (vote_id, user_id) | UNIQUE | 同一投票不能重复投票 |

---

### 2.7 messages（消息记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | 消息 ID |
| `gathering_id` | uuid | NOT NULL, FK → gatherings(id) ON DELETE CASCADE | 聚会 ID |
| `type` | text | NOT NULL | 消息类型 |
| `content` | text | NOT NULL | 消息内容 |
| `sender_id` | uuid | 可空, FK → profiles(id) | 发送者 ID（系统消息为空） |
| `metadata` | jsonb | 可空 | 附加数据 |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 创建时间 |

**type 枚举值：**

| 值 | 说明 |
|----|------|
| `participant_joined` | 有人加入聚会 |
| `recommend_ready` | 推荐结果已生成 |
| `vote_started` | 投票已发起 |
| `vote_passed` | 投票通过 |
| `vote_rejected` | 投票未通过 |
| `departed` | 有人已出发 |
| `arrived` | 有人已到达 |
| `nudge` | 催促消息 |
| `all_arrived` | 全员到达 |

**索引：**

| 索引名 | 字段 | 类型 | 说明 |
|--------|------|------|------|
| `messages_pkey` | id | PRIMARY | 主键 |
| `messages_gathering_id_idx` | gathering_id | INDEX | 按聚会查询 |
| `messages_created_at_idx` | created_at | INDEX | 按时间排序 |

---

## 3. 索引策略

### 设计原则

1. **主键索引**：所有表使用 uuid 主键，自动创建索引
2. **外键索引**：所有外键字段创建索引，加速 JOIN 查询
3. **唯一约束**：业务唯一性字段创建唯一索引（邀请码、用户+聚会组合等）
4. **查询优化**：高频查询字段创建索引（status、created_at）

### 高频查询场景

| 查询场景 | 使用的索引 |
|----------|------------|
| 通过邀请码查聚会 | `gatherings_code_key` |
| 查用户参与的聚会 | `participants_user_id_idx` |
| 查聚会的所有参与者 | `participants_gathering_id_idx` |
| 查聚会的推荐餐厅 | `restaurants_gathering_id_idx` |
| 查聚会的消息（按时间） | `messages_gathering_id_idx` + `messages_created_at_idx` |
| 检查用户是否已加入 | `participants_gathering_user_key` |
| 检查用户是否已投票 | `vote_records_vote_user_key` |

---

## 4. RLS 策略（行级安全）

所有表均启用 RLS（Row Level Security），确保用户只能访问自己有权限的数据。

### 4.1 profiles

```sql
-- 用户可以读取所有 profiles（昵称、头像等公开信息）
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- 用户只能更新自己的 profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 通过触发器自动创建（auth.users 插入时）
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 4.2 gatherings

```sql
-- 参与者可以查看聚会
CREATE POLICY "gatherings_select" ON gatherings
  FOR SELECT USING (
    id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
    OR creator_id = auth.uid()
  );

-- 任何已登录用户可以创建聚会
CREATE POLICY "gatherings_insert" ON gatherings
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 仅发起人可以更新聚会
CREATE POLICY "gatherings_update" ON gatherings
  FOR UPDATE USING (auth.uid() = creator_id);
```

### 4.3 participants

```sql
-- 同聚会的参与者可以互相查看
CREATE POLICY "participants_select" ON participants
  FOR SELECT USING (
    gathering_id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
  );

-- 已登录用户可以加入聚会（插入自己的记录）
CREATE POLICY "participants_insert" ON participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的参与者记录
CREATE POLICY "participants_update" ON participants
  FOR UPDATE USING (auth.uid() = user_id);
```

### 4.4 restaurants

```sql
-- 聚会参与者可以查看推荐餐厅
CREATE POLICY "restaurants_select" ON restaurants
  FOR SELECT USING (
    gathering_id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
  );

-- 仅通过 API（service_role）插入，前端无直接写入权限
-- 无 INSERT/UPDATE 策略 → 前端无法直接操作
```

### 4.5 votes

```sql
-- 聚会参与者可以查看投票
CREATE POLICY "votes_select" ON votes
  FOR SELECT USING (
    gathering_id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
  );

-- 仅通过 API（service_role）创建投票
```

### 4.6 vote_records

```sql
-- 同投票的参与者可以查看投票记录
CREATE POLICY "vote_records_select" ON vote_records
  FOR SELECT USING (
    vote_id IN (
      SELECT v.id FROM votes v
      JOIN participants p ON p.gathering_id = v.gathering_id
      WHERE p.user_id = auth.uid()
    )
  );

-- 用户只能插入自己的投票记录
CREATE POLICY "vote_records_insert" ON vote_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4.7 messages

```sql
-- 聚会参与者可以查看消息
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    gathering_id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
  );

-- 仅通过 API（service_role）插入消息
```

### RLS 策略总结

| 表 | SELECT | INSERT | UPDATE | DELETE |
|----|--------|--------|--------|--------|
| profiles | 所有人 | 自己 | 自己 | ❌ |
| gatherings | 参与者/发起人 | 已登录用户 | 发起人 | ❌ |
| participants | 同聚会参与者 | 自己 | 自己 | ❌ |
| restaurants | 聚会参与者 | API only | API only | ❌ |
| votes | 聚会参与者 | API only | API only | ❌ |
| vote_records | 同投票参与者 | 自己 | ❌ | ❌ |
| messages | 聚会参与者 | API only | ❌ | ❌ |

> **注意**：标记为 "API only" 的操作通过后端使用 `service_role` 密钥执行，绕过 RLS。这确保了业务逻辑的完整性（如投票计数、状态流转等必须在后端原子性完成）。
