# Phase 1：项目基础设施

**预估时间**：2 天
**目标**：搭建完整的项目骨架，确保开发环境可用，为后续 Phase 奠定基础。

---

## 前置条件

- [x] Node.js >= 18.0.0 已安装
- [x] pnpm >= 8.0.0 已安装
- [x] Git 仓库已初始化

---

## 任务列表

### Task 1.1：项目初始化 ✅

**目标**：创建标准化的 Monorepo 项目结构

**完成内容**：
- [x] 根目录 `package.json`（scripts: dev:server, dev:web, build, test 等）
- [x] `pnpm-workspace.yaml`（packages/*）
- [x] `tsconfig.base.json`（strict: true, ES2022, bundler 模块解析）
- [x] `.gitignore`（node_modules, dist, .env, IDE 文件等）
- [x] `.env.example`（Supabase、高德地图、微信小程序配置模板）
- [x] `assets/logo.png`
- [x] 四个子包目录及各自的 `package.json` + `tsconfig.json`：
  - `packages/shared` — @ontheway/shared（类型、常量、工具）
  - `packages/server` — @ontheway/server（Express + Supabase + Zod）
  - `packages/web` — @ontheway/web（React 18 + Vite 6 + Tailwind + Zustand）
  - `packages/miniprogram` — 微信小程序

**验证标准**：
- ✅ `pnpm install` 成功执行，无报错
- ✅ 每个子包有独立的 `package.json` 和 `tsconfig.json`
- ✅ workspace 引用正确（server 和 web 依赖 `@ontheway/shared: workspace:*`）

---

### Task 1.2：设计 Token ✅

**目标**：建立统一的设计语言，输出可被 Tailwind 引用的 Token 文件

**完成内容**：
- [x] `design/design-tokens.json` 包含完整的设计变量：
  - 色彩系统：Primary 橙（#f2930d）、Secondary 蓝（#0d94f2）、Teal、Red
  - 语义色：背景、卡片、表面、文字（亮色/暗色双模式）
  - 字体：Plus Jakarta Sans，字号 xs-4xl，字重 400-700
  - 间距：4px 基准，0-24 级
  - 圆角：sm(8px) / md(16px) / lg(24px) / xl(32px) / full
  - 阴影：sm/md/lg/xl，亮色（黑色透明度）/ 暗色（橙色微光）
  - 断点：sm(640) / md(768) / lg(1024) / xl(1280)
  - 动画：fast(150ms) / normal(300ms) / slow(500ms) + bounce 缓动

**验证标准**：
- ✅ JSON 格式合法，可被程序解析
- ✅ 包含亮色和暗色两套色彩方案
- ✅ 所有设计变量有明确的命名和层级结构

---

### Task 1.3：shared 包 — 类型定义、常量、工具函数 🔄

**目标**：实现 `@ontheway/shared` 包，定义全项目共享的类型、常量和工具函数

**任务清单**：

#### 1.3.1 类型定义（`src/types/`）

- [ ] `gathering.ts` — 聚会相关类型
  ```typescript
  // GatheringStatus: 'waiting' | 'recommending' | 'recommended' | 'voting' | 'confirmed' | 'completed'
  // Gathering: id, code, name, status, targetTime, creatorId, confirmedRestaurantId, version, ...
  // CreateGatheringInput: name, targetTime, location?, locationName?, tastes?
  ```
- [ ] `participant.ts` — 参与者相关类型
  ```typescript
  // ParticipantStatus: 'joined' | 'departed' | 'arrived'
  // Participant: id, gatheringId, userId, nickname, location, locationName, tastes, status, ...
  // JoinGatheringInput: nickname, location, locationName?, tastes?
  ```
- [ ] `restaurant.ts` — 餐厅相关类型
  ```typescript
  // Restaurant: id, gatheringId, index, name, address, cuisine, rating, pricePerPerson, location, reason, distances
  // RestaurantDistance: nickname, distance, duration
  ```
- [ ] `vote.ts` — 投票相关类型
  ```typescript
  // VoteStatus: 'active' | 'resolved'
  // VoteResult: 'approved' | 'rejected' | null
  // Vote: id, gatheringId, restaurantId, status, agreeCount, disagreeCount, totalParticipants, result
  // VoteRecord: id, voteId, userId, agree
  ```
- [ ] `user.ts` — 用户相关类型
  ```typescript
  // User: id, nickname, avatarUrl, wxOpenid?, createdAt
  ```
- [ ] `api.ts` — API 通用类型
  ```typescript
  // ApiResponse<T>: { success: boolean, data?: T, error?: { code: string, message: string } }
  // ApiError: { code: string, message: string }
  // Location: { lat: number, lng: number }
  ```
- [ ] `message.ts` — 消息类型
  ```typescript
  // MessageType: 'participant_joined' | 'recommend_ready' | 'vote_started' | ...
  // Message: id, gatheringId, type, content, senderId?, metadata?, createdAt
  ```
- [ ] `index.ts` — 统一导出

#### 1.3.2 常量（`src/constants/`）

- [ ] `gathering.ts` — 聚会相关常量
  ```typescript
  // GATHERING_STATUS: 状态枚举对象
  // MAX_PARTICIPANTS: 10
  // INVITE_CODE_LENGTH: 6
  // RECOMMEND_COUNT: 3（推荐餐厅数量）
  ```
- [ ] `tastes.ts` — 口味标签
  ```typescript
  // TASTE_OPTIONS: ['火锅', '川菜', '粤菜', '日料', '韩餐', '西餐', '烧烤', '小龙虾', '东南亚', '素食', ...]
  ```
- [ ] `index.ts` — 统一导出

#### 1.3.3 工具函数（`src/utils/`）

- [ ] `invite-code.ts` — 邀请码生成
  ```typescript
  // generateInviteCode(): string — 生成 6 位大写字母+数字邀请码
  // isValidInviteCode(code: string): boolean — 校验邀请码格式
  ```
- [ ] `time.ts` — 时间工具
  ```typescript
  // formatRelativeTime(date: Date): string — "3分钟前"、"2小时后"
  // calculateDepartTime(targetTime: Date, durationMinutes: number, bufferMinutes?: number): Date
  ```
- [ ] `distance.ts` — 距离工具
  ```typescript
  // calculateDistance(from: Location, to: Location): number — 两点间直线距离（米）
  // formatDistance(meters: number): string — "1.2km" / "800m"
  ```
- [ ] `index.ts` — 统一导出

#### 1.3.4 单元测试（`src/__tests__/`）

- [ ] `invite-code.test.ts`
  - 生成的邀请码长度为 6
  - 邀请码只包含大写字母和数字
  - 多次生成不重复（概率测试）
  - isValidInviteCode 正确校验
- [ ] `time.test.ts`
  - formatRelativeTime 各种时间差的格式化
  - calculateDepartTime 正确计算出发时间
- [ ] `distance.test.ts`
  - calculateDistance 已知坐标的距离计算
  - formatDistance 格式化输出

**验证标准**：
- ✅ `pnpm build:shared` 成功编译，输出到 `dist/`
- ✅ `pnpm test:shared` 所有测试通过
- ✅ 类型定义完整，无 `any` 类型
- ✅ 导出结构清晰：`import { Gathering, generateInviteCode, TASTE_OPTIONS } from '@ontheway/shared'`

---

### Task 1.4：文档体系 🔄

**目标**：建立完整的项目文档体系

**任务清单**：
- [x] `CLAUDE.md` — Claude 协作规范
- [x] `README.md` — 项目总览
- [x] `docs/PRD.md` — 产品需求文档
- [x] `docs/architecture.md` — 技术架构
- [x] `docs/api-spec.md` — API 接口规范
- [x] `docs/data-model.md` — 数据模型
- [x] `docs/design-system.md` — 设计系统
- [x] `docs/plans/overview.md` — 开发计划总览
- [x] `docs/plans/phase-1-foundation.md` — Phase 1 详细计划（本文档）

**验证标准**：
- ✅ 所有文档使用中文，专有名词中英对照
- ✅ 文档间交叉引用正确
- ✅ 新成员可根据文档理解项目全貌

---

### Task 1.5：Supabase 初始化

**目标**：创建数据库 Schema、RLS 策略、种子数据

**任务清单**：
- [ ] 创建迁移文件 `supabase/migrations/001_init.sql`
  - profiles 表（关联 auth.users）
  - gatherings 表
  - participants 表
  - restaurants 表
  - votes 表
  - vote_records 表
  - messages 表
  - 所有索引
  - 触发器：profiles 自动创建、updated_at 自动更新、version 自增
- [ ] 创建 RLS 策略
  - 每个表的 SELECT/INSERT/UPDATE 策略
  - 参考 [docs/data-model.md](../data-model.md) 中的 RLS 策略说明
- [ ] 更新种子数据 `supabase/seed.sql`
  - 测试用户
  - 示例聚会数据
- [ ] 配置 Supabase Auth
  - 启用匿名登录
  - 配置 JWT 过期时间

**验证标准**：
- ✅ 迁移文件可在 Supabase Cloud 上成功执行
- ✅ RLS 策略正确：用户只能访问自己参与的聚会数据
- ✅ 种子数据可正常插入
- ✅ 表结构与 `docs/data-model.md` 一致

---

## Phase 1 总验证标准

### 环境验证
- [ ] `pnpm install` 成功执行
- [ ] `pnpm build:shared` 成功编译
- [ ] `pnpm test:shared` 所有测试通过

### 代码质量
- [ ] TypeScript 严格模式无类型错误
- [ ] shared 包导出结构清晰
- [ ] 无 `any` 类型

### 文档完整性
- [ ] 9 个核心文档全部就位
- [ ] 文档内容完整（非占位符）
- [ ] 文档间链接正确

### 数据库
- [ ] Schema 迁移文件可执行
- [ ] RLS 策略已定义
- [ ] 种子数据可插入

---

## 预估时间

| 任务 | 预估时间 | 状态 |
|------|----------|------|
| 1.1 项目初始化 | 2 小时 | ✅ 完成 |
| 1.2 设计 Token | 2 小时 | ✅ 完成 |
| 1.3 shared 包 | 4-5 小时 | 🔄 进行中 |
| 1.4 文档体系 | 3-4 小时 | 🔄 进行中 |
| 1.5 Supabase 初始化 | 3-4 小时 | ⬜ 待开始 |
| **总计** | **14-17 小时** | **约 2 天** |

---

## 注意事项

1. **shared 包优先**：后续所有包都依赖 shared 的类型定义，必须先完成
2. **TDD 驱动**：shared 包的工具函数先写测试再写实现
3. **TypeScript 严格模式**：`strict: true` 从第一天就启用，不留技术债
4. **文档即代码**：文档与代码同步更新，保持一致性

---

## 下一步

✅ Phase 1 完成后 → 进入 [Phase 2: 核心聚会流程](./phase-2-backend.md)
