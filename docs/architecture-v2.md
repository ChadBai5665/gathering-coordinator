# 技术架构 — 碰个字 (OnTheWay) v2

> 版本：v2.0.0 | 最后更新：2026-02

---

## 1. 项目目录结构

```
ontheway/
├── packages/
│   ├── shared/                    # @ontheway/shared
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── auth.ts        # 认证类型
│   │   │   │   ├── common.ts      # 通用类型
│   │   │   │   ├── gathering.ts  # 聚会类型（修改：状态枚举更新）
│   │   │   │   ├── participant.ts
│   │   │   │   ├── nomination.ts # 🆕 新增：提名类型
│   │   │   │   ├── vote.ts       # 修改：投票类型更新
│   │   │   │   └── message.ts
│   │   │   ├── constants/
│   │   │   │   ├── status.ts     # 修改：聚会/参与者状态枚举
│   │   │   │   ├── tastes.ts     # 口味选项
│   │   │   │   └── errors.ts     # 错误码
│   │   │   └── utils/
│   │   │       ├── invite-code.ts
│   │   │       ├── geo.ts
│   │   │       ├── time.ts
│   │   │       └── validation.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── server/                    # @ontheway/server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts       # 认证路由（沿用）
│   │   │   │   ├── gathering.ts  # 修改：新增提名/投票路由
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── amap.service.ts
│   │   │   │   ├── restaurant.service.ts  # 修改：复用为 AI 推荐
│   │   │   │   ├── nomination.service.ts  # 🆕 新增：提名服务
│   │   │   │   ├── vote-calculator.service.ts # 🆕 新增：投票结算
│   │   │   │   ├── time-calculator.service.ts
│   │   │   │   └── reminder.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   └── validate.ts
│   │   │   └── lib/
│   │   │       └── supabase.ts   # 双客户端（admin + user）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── web/                       # @ontheway/web
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/           # 基础组件（沿用 10 个）
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── Tag.tsx
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Loading.tsx
│   │   │   │   │   └── Icon.tsx
│   │   │   │   └── nomination/   # 🆕 新增：提名相关组件
│   │   │   │       ├── NominationSection.tsx
│   │   │   │       ├── NominationHeader.tsx
│   │   │   │       ├── NominationMethodTabs.tsx
│   │   │   │       ├── RestaurantSearchPanel.tsx
│   │   │   │       ├── SearchResultItem.tsx
│   │   │   │       ├── AiSuggestPanel.tsx
│   │   │   │       ├── AiSuggestCard.tsx
│   │   │   │       ├── NominationCard.tsx
│   │   │   │       ├── NominationList.tsx
│   │   │   │       ├── TasteSelector.tsx
│   │   │   │       └── StartVotingButton.tsx
│   │   │   │   └── voting/       # 🆕 新增：投票相关组件
│   │   │   │       ├── VotingSection.tsx
│   │   │   │       ├── VotingHeader.tsx
│   │   │   │       ├── VoteNominationCard.tsx
│   │   │   │       └── VoteResultOverlay.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── Dashboard.tsx   # 修改：新增提名/投票区块
│   │   │   │   ├── JoinPage.tsx    # 修改：简化表单
│   │   │   │   ├── MyGatheringsPage.tsx
│   │   │   │   └── NotFoundPage.tsx
│   │   │   ├── stores/
│   │   │   │   ├── auth.store.ts
│   │   │   │   └── gathering.store.ts  # 修改：新增提名/投票 actions
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useGathering.ts
│   │   │   │   ├── useLocation.ts
│   │   │   │   ├── useToast.ts
│   │   │   │   ├── useNomination.ts   # 🆕 新增
│   │   │   │   └── useVoting.ts       # 🆕 新增
│   │   │   └── services/
│   │   │       ├── api.ts          # 修改：新增提名/投票 API
│   │   │       ├── supabase.ts
│   │   │       └── amap.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── miniprogram/               # 微信小程序
│       ├── pages/
│       │   ├── login/
│       │   ├── index/             # 首页（创建/加入）
│       │   ├── dashboard/         # 仪表盘（后续适配）
│       │   ├── my-gatherings/
│       │   └── profile/
│       ├── components/
│       │   ├── nav-bar/
│       │   ├── gathering-card/
│       │   └── ...
│       ├── services/
│       │   ├── api.ts             # 修改：新增提名/投票 API
│       │   ├── types.ts           # 修改：新增提名类型
│       │   └── constants.ts
│       ├── stores/
│       │   ├── auth.ts
│       │   └── gathering.ts       # 修改：新增提名/投票 actions
│       └── project.config.json
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── package.json
├── vercel.json
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 001_initial.sql        # 🆕 修改：nominations 表
│       └── 002_gathering_status.sql
├── design/
│   └── design-tokens.json         # 沿用
└── docs/
    ├── PRD-v2.md
    ├── architecture-v2.md
    └── ui-requirements.md
```

---

## 2. 技术栈确认表

| 层级 | 技术 | 选型理由 | 状态 |
|------|------|----------|------|
| **项目管理** | pnpm Monorepo | 共享代码、统一版本、开发效率高 | 沿用 |
| **语言** | TypeScript | 全栈类型安全，前后端共享类型定义 | 沿用 |
| **Web 框架** | React 18 | 生态成熟，组件化开发 | 沿用 |
| **构建工具** | Vite 6 | 极速 HMR，开发体验好 | 沿用 |
| **CSS** | Tailwind CSS 3 | 原子化 CSS，快速开发，设计 Token 友好 | 沿用 |
| **状态管理** | Zustand 5 | 轻量、简洁、TypeScript 友好 | 沿用 |
| **路由** | React Router 7 | 声明式路由，支持嵌套 | 沿用 |
| **后端框架** | Express 4 | 轻量灵活，Vercel Serverless 兼容 | 沿用 |
| **参数校验** | Zod | 运行时类型校验，与 TS 类型联动 | 沿用 |
| **数据库** | Supabase (PostgreSQL) | 免运维、内置 Auth/Realtime/RLS | 沿用 |
| **地图服务** | 高德地图 API | 国内数据准确，POI 搜索能力强 | 沿用 |
| **测试** | Vitest | 与 Vite 生态一致，速度快 | 沿用 |
| **部署** | Vercel | 零配置部署，Serverless 自动扩缩 | 沿用 |
| **小程序** | 原生微信 + TS | 性能最优，无框架依赖 | 沿用 |

---

## 3. API 接口总表

### 3.1 认证接口

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/auth/guest | 游客登录 | `{ nickname: string }` | `{ token, user }` |
| POST | /api/auth/wechat | 微信登录 | `{ code: string }` | `{ token, user }` |

### 3.2 聚会接口

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | /api/gatherings | 创建聚会 | `{ name, target_time, creator_nickname? }` | `{ gathering }` |
| GET | /api/gatherings/:code | 获取详情 | — | `{ gathering: {...nominations, votes} }` |
| GET | /api/gatherings/mine | 我的聚会 | `?status=active&limit=20&offset=0` | `{ gatherings[], total }` |
| POST | /api/gatherings/:code/join | 加入聚会 | `{ nickname, location?, location_name? }` | `{ participant }` |
| POST | /api/gatherings/:code/start-nominating | 开始提名 | — | `{ status: "nominating" }` |
| POST | /api/gatherings/:code/start-voting | 开始投票 | — | `{ vote }` |
| GET | /api/gatherings/:code/search-restaurants | POI 搜索 | `?keyword=xxx&page=1` | `{ restaurants[] }` |
| POST | /api/gatherings/:code/ai-suggest | AI 推荐 | `{ tastes: string[] }` | `{ suggestions[] }` |
| POST | /api/gatherings/:code/nominate | 提名餐厅 | `{ amap_id, name, type?, address?, location, rating?, cost?, source }` | `{ nomination }` |
| DELETE | /api/gatherings/:code/nominate/:id | 撤回提名 | — | `{ deleted: true }` |
| POST | /api/gatherings/:code/vote/:voteId | 投票 | `{ nomination_id: string }` | `{ vote_counts[], result? }` |
| POST | /api/gatherings/:code/depart | 标记出发 | — | `{ participant }` |
| POST | /api/gatherings/:code/arrive | 标记到达 | — | `{ participant, allArrived }` |
| GET | /api/gatherings/:code/poll | 轮询更新 | `?version=N` | `{ gathering?, version, messages[] }` |

### 3.3 接口变更说明

**新增接口（v2）**：
- `POST /start-nominating` — 开始提名阶段
- `POST /start-voting` — 开始投票阶段
- `GET /search-restaurants` — POI 搜索
- `POST /ai-suggest` — 个人 AI 推荐
- `POST /nominate` — 提名餐厅
- `DELETE /nominate/:id` — 撤回提名

**修改接口（v2）**：
- `POST /vote/:voteId` — 请求体从 `{ agree: boolean }` 改为 `{ nomination_id: string }`

**移除接口（v2）**：
- `POST /api/gatherings/:code/recommend` — 不再需要
- `POST /api/gatherings/:code/vote` — 发起投票合并到 start-voting

---

## 4. 数据库 Schema

### 4.1 ER 关系图

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
       │                        │  nominations  │ 🆕 重构自 restaurants
       │                        │  (提名餐厅)    │
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

### 4.2 表结构详细说明

#### 4.2.1 profiles（用户资料）

沿用 v1，无变更。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK, FK → auth.users | 用户 ID |
| `nickname` | text | 可空 | 用户昵称 |
| `avatar_url` | text | 可空 | 头像 URL |
| `wx_openid` | text | 可空, UNIQUE | 微信 OpenID |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

---

#### 4.2.2 gatherings（聚会）

修改 status 枚举值。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 聚会 ID |
| `code` | text | NOT NULL, UNIQUE | 6 位邀请码 |
| `name` | text | NOT NULL | 聚会名称 |
| `status` | text | NOT NULL | 🆕 聚会状态 |
| `target_time` | timestamptz | NOT NULL | 目标到达时间 |
| `creator_id` | uuid | NOT NULL, FK → profiles | 发起人 ID |
| `version` | integer | NOT NULL | 数据版本号 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

**status 枚举值（v2）**：

| 值 | 说明 |
|----|------|
| `waiting` | 等待参与者加入 |
| `nominating` | 提名阶段 |
| `voting` | 投票进行中 |
| `confirmed` | 餐厅已确认 |
| `departing` | 有人已出发 |
| `completed` | 聚会完成 |

---

#### 4.2.3 participants（参与者）

简化：tastes 默认为空数组。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 参与者记录 ID |
| `gathering_id` | uuid | FK → gatherings | 聚会 ID |
| `user_id` | uuid | FK → profiles | 用户 ID |
| `nickname` | text | NOT NULL | 参与时使用的昵称 |
| `location` | jsonb | 可空 | 位置坐标 `{ lng, lat }` |
| `location_name` | text | 可空 | 位置名称 |
| `tastes` | text[] | DEFAULT '{}' | 🆕 口味偏好（默认空） |
| `status` | text | NOT NULL | 参与者状态 |
| `is_creator` | boolean | NOT NULL | 是否为发起人 |
| `estimated_duration` | integer | 可空 | 预估到达时间（分钟） |
| `estimated_distance` | integer | 可空 | 预估距离（米） |
| `suggested_depart_at` | timestamptz | 可空 | 建议出发时间 |
| `departed_at` | timestamptz | 可空 | 实际出发时间 |
| `arrived_at` | timestamptz | 可空 | 实际到达时间 |
| `created_at` | timestamptz | NOT NULL | 加入时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

**status 枚举值**：

| 值 | 说明 |
|----|------|
| `joined` | 已加入 |
| `departed` | 已出发 |
| `arrived` | 已到达 |

---

#### 4.2.4 nominations（提名餐厅）🆕 重构自 restaurants

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 提名记录 ID |
| `gathering_id` | uuid | FK → gatherings | 聚会 ID |
| `nominated_by` | uuid | FK → participants | 🆕 提名人 ID |
| `amap_id` | text | NOT NULL | 高德 POI ID |
| `name` | text | NOT NULL | 餐厅名称 |
| `type` | text | 可空 | 菜系类型 |
| `address` | text | 可空 | 餐厅地址 |
| `location` | jsonb | NOT NULL | 餐厅坐标 `{ lng, lat }` |
| `rating` | numeric(2,1) | 可空 | 评分（0.0-5.0） |
| `cost` | integer | 可空 | 人均消费（元） |
| `source` | text | NOT NULL | 🆕 提名来源：'manual' 或 'ai' |
| `reason` | text | 可空 | AI 推荐理由（仅 ai 来源） |
| `travel_infos` | jsonb | 可空 | 所有参与者到餐厅的距离信息 |
| `is_confirmed` | boolean | NOT NULL, DEFAULT false | 🆕 是否为最终确认的餐厅 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |

**索引**：

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `nominations_pkey` | id | PRIMARY |
| `nominations_gathering_id_idx` | gathering_id | INDEX |
| `nominations_nominated_by_idx` | nominated_by | INDEX |
| `nominations_gathering_nominator_key` | (gathering_id, nominated_by, amap_id) | UNIQUE |

---

#### 4.2.5 votes（投票）

修改结构：移除 restaurant_id，改为关联所有 nominations。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 投票 ID |
| `gathering_id` | uuid | FK → gatherings | 聚会 ID |
| `status` | text | NOT NULL | 投票状态 |
| `timeout_at` | timestamptz | NOT NULL | 🆕 投票超时时间 |
| `total_participants` | integer | NOT NULL | 参与者总数 |
| `result` | text | 可空 | 投票结果 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `resolved_at` | timestamptz | 可空 | 投票结束时间 |

**status 枚举值**：

| 值 | 说明 |
|----|------|
| `active` | 投票进行中 |
| `resolved` | 投票已结束 |

**result 枚举值**：

| 值 | 说明 |
|----|------|
| `approved` | 投票通过 |
| `rejected` | 投票未通过（无可用提名） |
| `null` | 投票进行中 |

---

#### 4.2.6 vote_records（投票记录）

修改结构：agree(boolean) → nomination_id(uuid)。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 记录 ID |
| `vote_id` | uuid | FK → votes | 投票 ID |
| `user_id` | uuid | FK → profiles | 投票用户 ID |
| `nomination_id` | uuid | FK → nominations | 🆕 选择的提名 ID |
| `created_at` | timestamptz | NOT NULL | 投票时间 |

**索引**：

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `vote_records_pkey` | id | PRIMARY |
| `vote_records_vote_id_idx` | vote_id | INDEX |
| `vote_records_vote_user_key` | (vote_id, user_id) | UNIQUE |

---

#### 4.2.7 messages（消息记录）

新增消息类型。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | uuid | PK | 消息 ID |
| `gathering_id` | uuid | FK → gatherings | 聚会 ID |
| `type` | text | NOT NULL | 消息类型 |
| `content` | text | NOT NULL | 消息内容 |
| `sender_id` | uuid | 可空, FK → profiles | 发送者 ID |
| `metadata` | jsonb | 可空 | 附加数据 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |

**type 枚举值**：

| 值 | 说明 |
|----|------|
| `participant_joined` | 有人加入聚会 |
| `nominating_started` | 🆕 提名阶段开始 |
| `restaurant_nominated` | 🆕 有人提名餐厅 |
| `nomination_withdrawn` | 🆕 提名被撤回 |
| `vote_started` | 投票已发起 |
| `vote_passed` | 投票通过 |
| `vote_rejected` | 投票未通过 |
| `departed` | 有人已出发 |
| `arrived` | 有人已到达 |
| `nudge` | 催促消息 |
| `all_arrived` | 全员到达 |

---

### 4.3 索引策略

沿用 v1 索引策略，新增：

| 查询场景 | 使用的索引 |
|----------|------------|
| 查聚会的所有提名 | `nominations_gathering_id_idx` |
| 查用户的所有提名 | `nominations_nominated_by_idx` |
| 查用户是否已对某投票投过票 | `vote_records_vote_user_key` |

---

### 4.4 RLS 策略

沿用 v1，新增 nominations 表策略：

```sql
-- nominations 表
CREATE POLICY "nominations_select" ON nominations
  FOR SELECT USING (
    gathering_id IN (
      SELECT gathering_id FROM participants WHERE user_id = auth.uid()
    )
  );

-- 仅通过 API（service_role）插入提名
```

---

## 5. 认证方案

### 5.1 Web 端认证

```
用户打开 Web
    ↓
Supabase signInAnonymously()
    ↓ 获得匿名用户 + JWT
    ↓
创建/加入聚会时设置 nickname
    ↓
JWT 随请求发送到 API
    ↓
API 通过 Supabase 验证 JWT
```

- **当前方案**：匿名登录（游客模式），零门槛
- **未来扩展**：支持 OAuth（微信扫码、Google 等）

### 5.2 小程序认证

```
用户打开小程序
    ↓
wx.login() 获取 code
    ↓
POST /api/auth/wechat { code }
    ↓
后端调用微信 code2session
    ↓ 获得 openid + session_key
    ↓
后端用 Supabase Admin API 创建/查找用户
    ↓ 以 openid 为唯一标识
    ↓
返回 JWT Token 给小程序
    ↓
小程序后续请求携带 JWT
```

### 5.3 Token 管理

| 项目 | 说明 |
|------|------|
| Token 类型 | Supabase JWT |
| 存储位置 | Web: 内存 + localStorage / 小程序: wx.setStorageSync |
| 过期时间 | 1 小时（Supabase 默认），自动刷新 |
| 刷新机制 | Supabase SDK 自动处理 |

---

## 6. 实时同步方案

### 6.1 Web 端 — Supabase Realtime

```typescript
// 订阅聚会数据变更
supabase
  .channel('gathering:ABC123')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'gatherings',
    filter: `code=eq.ABC123`
  }, (payload) => {
    // 更新本地状态
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'participants',
    filter: `gathering_id=eq.${gatheringId}`
  }, (payload) => {
    // 更新参与者状态
  })
  .on('postgres_changes', {  // 🆕 新增 nominations 订阅
    event: '*',
    schema: 'public',
    table: 'nominations',
    filter: `gathering_id=eq.${gatheringId}`
  }, (payload) => {
    // 更新提名列表
  })
  .subscribe()
```

### 6.2 小程序端 — HTTP 轮询

```
小程序定时请求
    ↓
GET /api/gatherings/:code/poll?version=N
    ↓
后端比较 version
    ├─ 有更新 → 返回最新数据 + 新 version
    └─ 无更新 → 返回 304 或空数据
```

- 轮询间隔：3 秒（活跃状态）/ 10 秒（后台状态）
- 使用 `version` 字段避免重复传输

---

## 7. 部署架构

### 7.1 架构图

```
┌─────────────────────────────────────────┐
│              Vercel Platform             │
│                                          │
│  ┌────────────────┐  ┌───────────────┐  │
│  │  Static Files  │  │  Serverless   │  │
│  │  (Web SPA)     │  │  Functions    │  │
│  │                │  │  (Express API)│  │
│  │  CDN 全球分发  │  │  自动扩缩     │  │
│  └────────────────┘  └───────┬───────┘  │
│                              │           │
└──────────────────────────────┼───────────┘
                               │
                               ▼
┌─────────────────────────────────────────┐
│           Supabase Cloud                 │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │PostgreSQL│  │   Auth   │  │Realtime│ │
│  │  数据库  │  │  认证服务│  │实时订阅│ │
│  └──────────┘  └──────────┘  └───────┘ │
│                                          │
└─────────────────────────────────────────┘
```

### 7.2 Vercel 部署配置

- **Web SPA**：`packages/web/dist` → 静态文件托管，CDN 全球分发
- **API**：`packages/server` → Serverless Functions，按需执行
- **环境变量**：在 Vercel Dashboard 配置

### 7.3 Supabase Cloud

- **数据库**：PostgreSQL，自动备份
- **认证**：内置 Auth 服务，支持匿名登录 + OAuth
- **实时**：Realtime 服务，WebSocket 推送数据变更
- **RLS**：行级安全策略

### 7.4 环境管理

| 环境 | Web URL | API URL | 数据库 |
|------|---------|---------|--------|
| 开发 | localhost:5173 | localhost:3000 | Supabase 本地/开发项目 |
| 预览 | Vercel Preview URL | 同上 | Supabase 开发项目 |
| 生产 | 自定义域名 | 同上 | Supabase 生产项目 |

---

## 8. 错误处理

### 8.1 API 统一错误格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 8.2 错误码规范

见 PRD-v2.md 附录 B。

---

> 文档版本：v2.0.0
> 最后更新：2026-02
> 状态：待用户确认
