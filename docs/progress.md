# 碰个头（OnTheWay）开发进度

> 项目目录: `D:\AICoding\Ontheway`
> 更新: 2026-02-14

---

## Phase 1: 项目基础设施 ✅ 已完成

**完成时间**: 2025-02-11
**Git Commit**: `b080f2b` - feat: Phase 1 - 项目基础设施初始化

### 完成清单

| Task | 状态 | 详情 |
|------|------|------|
| 1.1 项目初始化 | ✅ | Monorepo 骨架、pnpm workspace、tsconfig、.gitignore、logo |
| 1.2 Supabase 配置 | ✅ | config.toml、迁移占位、seed.sql |
| 1.3 shared 包 | ✅ | 类型(7) + 常量(3) + 工具(4) + 测试(4)，95个用例全部通过 |
| 1.4 文档体系 | ✅ | CLAUDE.md、README、PRD、architecture、api-spec、data-model、design-system + 5个Phase计划文档 |
| 1.5 设计 Token | ✅ | design-tokens.json（色彩/字体/间距/圆角/阴影/动效） |

### 验证结果

- `pnpm install` ✅ 274个包
- `pnpm --filter @ontheway/shared build` ✅ TypeScript零错误
- `pnpm --filter @ontheway/shared test` ✅ 4文件95用例全通过
- Git初始化 ✅ 55文件，10,166行

### 项目统计

- 文档: 11个 .md 文件
- shared源码: 18个 .ts 文件
- 测试文件: 4个
- 配置文件: 6个

---

## Phase 2: 后端核心服务 ✅ 已完成

**完成时间**: 2025-02-11
**Git Commit**: `5683132` - feat: Phase 2 - 后端核心服务

### 完成清单

| Task | 状态 | 详情 |
|------|------|------|
| 2.1 数据库 Schema | ✅ | 7张表 + 20条RLS策略 + 11个索引 + 3个触发器（478行SQL） |
| 2.2 Express 骨架 | ✅ | app.ts + config + supabase双客户端 + 错误处理 + Zod验证 |
| 2.3 认证服务 | ✅ | 游客匿名登录 + 微信登录桥接（结构就绪，待凭证） |
| 2.4 聚会 CRUD | ✅ | 创建/获取/我的列表/加入/详情 + 轮询（1058行） |
| 2.5 推荐+投票 | ✅ | 高德POI搜索 + 五维评分 + 多数决投票 + Mock降级 |
| 2.6 轮询+催促 | ✅ | 乐观锁版本轮询 + 30s催促引擎 + 出发时间计算 |

### 验证结果

- `pnpm --filter @ontheway/server build` ✅ TypeScript零错误
- `pnpm --filter @ontheway/shared test` ✅ 95用例仍全通过
- 16文件，+3050行

### 关键设计决策

- 双Supabase客户端：supabaseAdmin（绕过RLS）+ 每请求req.supabase（遵守RLS）
- 乐观锁轮询：gathering.version递增，小程序用 GET /poll?version=N
- Mock降级：无AMAP_KEY时自动返回模拟餐厅数据
- 投票自动决策：单人自动确认，多人过半通过/否决

---

## Phase 3: Web 前端重构 ✅ 已完成

**完成时间**: 2025-02-12
**Git Commit**: `20c6a24` - feat: Phase 3 - Web 前端重构

### 完成清单

| Task | 状态 | 详情 |
|------|------|------|
| 3.1 项目搭建 | ✅ | Vite + React 18 + Tailwind 3.4 + Router 7 + Zustand 5 + Supabase client |
| 3.2 UI 组件库 | ✅ | Button/Card/Input/Modal/Toast/Tag/Avatar/Badge/Loading/Icon（10个组件） |
| 3.3 登录页 | ✅ | 游客快速进入（昵称输入）、useAuth hook、路由守卫 |
| 3.4 首页 | ✅ | 创建聚会（地点/口味/时间）+ 加入聚会（邀请码输入） |
| 3.5 仪表盘 | ✅ | 侧边栏（信息/参与者）+ 推荐卡片 + 投票 + 地图占位 + 出发操作 + 消息流（1139行） |
| 3.6 我的聚会 | ✅ | 状态筛选标签页 + 聚会卡片列表 |
| 3.7 响应式适配 | ✅ | Tailwind 响应式断点 + 暗色模式支持 |

### 验证结果

- `pnpm --filter @ontheway/web build` ✅ TypeScript零错误 + Vite打包成功
- 75个模块转换，11个产出文件
- 36文件，+3414行

### 项目结构

- UI 组件: 10个（Button/Card/Input/Modal/Toast/Tag/Avatar/Badge/Loading/Icon）
- 页面: 5个（Login/Home/Dashboard/MyGatherings/NotFound）
- Hooks: 3个（useAuth/useGathering/useToast）
- Stores: 2个（auth.store/gathering.store）
- Services: 2个（api/supabase）
- 配置: vite.config.ts + tailwind.config.ts + postcss.config.js

### 关键设计决策

- 设计Token完整集成：Tailwind config 引用 design-tokens.json 色彩体系
- API 客户端自动注入 Bearer token，统一错误处理
- Zustand persist 持久化登录状态
- 聚会 store 内置 3s 轮询（版本号对比，避免无效更新）
- 路由懒加载（React.lazy + Suspense）

---

## Phase 4: 微信小程序 🔄 骨架已完成

**骨架完成时间**: 2025-02-12
**Git Commit**: `9f15c8d` - feat: Phase 4 - 微信小程序骨架搭建

### 完成清单

| Task | 状态 | 详情 |
|------|------|------|
| 4.1 项目搭建与配置 | ✅ | 原生小程序 + TypeScript + miniprogram-api-typings + 分包配置 |
| 4.2 API 服务层 | ✅ | wx.request 封装，与 Web 端 API 完全对齐（12个接口） |
| 4.3 状态管理 | ✅ | authStore + gatheringStore（事件模式，3s轮询） |
| 4.4 页面结构 | ✅ | 5个页面（login/index/dashboard/my-gatherings/profile） |
| 4.5 公共组件 | ✅ | 7个组件（nav-bar/gathering-card/restaurant-card/status-tag/taste-selector/message-item/empty-state） |
| 4.6 全局样式 | ✅ | CSS 变量 + 工具类，对齐 design-tokens.json |
| 微信登录 | ⏳ | 结构就绪，待小程序 AppID 配置 |
| 分享+订阅消息 | ⏳ | onShareAppMessage 已实现，订阅消息待配置模板 |
| 性能优化 | ⏳ | 待真机测试后优化 |

### 验证结果

- `tsc --noEmit` ✅ TypeScript 零错误
- 72文件，+4136行

### 项目结构

- 页面: 5个（login/index/dashboard/my-gatherings/profile）
- 组件: 7个（nav-bar/gathering-card/restaurant-card/status-tag/taste-selector/message-item/empty-state）
- 服务: api.ts + types.ts + constants.ts
- 状态: auth.ts + gathering.ts
- 工具: util.ts + location.ts
- TabBar: 3个标签（首页/我的聚会/我的）

### 待办（需要小程序账号后）

- 替换 project.config.json 中的 appid
- 配置微信登录（wx.login → 后端 /auth/wechat）
- 配置订阅消息模板
- 替换占位图标为实际图标
- 真机测试 + 性能优化
- 提交审核

---

## Phase 5: 打磨+部署 ✅ Web 端已完成

**完成时间**: 2025-02-12
**Git Commit**: `0af4af7` - Web 端生产部署完成

### 完成清单

| Task | 状态 | 详情 |
|------|------|------|
| 5.2 Web 错误边界 | ✅ | ErrorBoundary 组件 + App.tsx 集成 |
| 5.3 Vercel 部署配置 | ✅ | vercel.json + Serverless Functions + ESM 支持 |
| 5.3 Vercel 生产部署 | ✅ | **已上线** https://gathering-coordinator-chadbais-projects.vercel.app |
| 5.3 CI/CD | ✅ | GitHub Actions（build + test 全链路） |
| 5.3 环境变量配置 | ✅ | Supabase + AMap 环境变量已配置 |
| 5.4 README | ✅ | 完善项目介绍、快速开始、命令表 |
| 5.4 CHANGELOG | ✅ | v0.1.0 完整变更记录 |
| 5.4 部署文档 | ✅ | docs/deploy.md（Supabase + Vercel + 域名） |
| 5.4 用户手册 | ✅ | docs/user-guide.md（面向终端用户） |
| 5.4 LICENSE | ✅ | MIT |
| 5.5 分享链接功能 | ✅ | `/join/:code` 路由 + 自动加入 |
| 5.5 高德地图集成 | ✅ | AMap JS API 2.0 + 动态加载 + 安全配置 |
| 5.5 自动位置授权 | ✅ | useGeoLocation hook + 自动上传位置 |
| 5.1 两端对齐测试 | ⏳ | 待小程序 AppID 后进行 |
| 5.2 体验打磨（完整） | ⏳ | 待真机测试后优化 |
| 5.3 小程序提审 | ⏳ | 待 AppID + ICP 备案 |

### 验证结果

- `pnpm --filter @ontheway/web build` ✅ 79模块，零错误
- `pnpm --filter @ontheway/shared test` ✅ 95用例全通过
- **生产环境测试** ✅ 登录、创建聚会、位置授权功能正常
- 部署提交：20+ commits，修复 ESM 导入、Vercel Functions、环境变量等问题

### 部署关键问题解决

1. **ESM 模块支持** - 为所有 shared 包导入添加 `.js` 扩展名
2. **Vercel Functions** - 创建 `api/package.json` 启用 ESM
3. **环境变量配置** - 正确配置 Supabase 和 AMap 密钥
4. **Deployment Protection** - 关闭 Vercel 认证保护
5. **域名绑定** - Promote to Production 更新生产域名

---

## v2 Upgrade: 后端升级（nominating + 选择制投票 + departing）🔄 进行中

**开始时间**: 2026-02-14  
**目标**: 将 v1（recommend + 同意/反对投票）后端升级为 v2（提名 + 选择制投票 + departing 状态机），并以 `packages/shared` 作为前后端唯一契约来源。  
**重要约束**: v2 使用“全新 Supabase 项目/库”，不迁移 v1 线上数据；错误响应统一为 `{ success:false, error:{ code, message } }`。

### 已落地（代码层面）

| Item | 状态 | 说明 |
|------|------|------|
| 1) 契约与错误格式 | ✅ | `ApiErrorResponse` 改为 `error:{code,message}`；404/校验/鉴权统一格式 |
| 2) 错误码与状态机 | ✅ | 错误码按 PRD-v2；Gathering/Participant/Vote 状态枚举按 v2 |
| 3) 数据模型（提名/投票/消息） | ✅ | 新增 `types/nomination.ts`；投票改为 `nomination_id`；messages 改为 `content/metadata/sender_id` |
| 4) Supabase v2 迁移 | ✅ | 新增 `supabase/migrations/20260214000001_v2_refactor.sql`（restaurants→nominations，votes/vote_records/messages/participants/gatherings 约束更新，RLS 与 realtime publication） |
| 5) v2 路由实现 | ✅ | gatherings 全套：创建/加入/详情/我的/位置、start-nominating、搜索 POI、nominate/withdraw、start-voting、vote、depart/arrive、poll(含超时结算) |
| 6) AI suggest（P0 规则版） | ✅ | `POST /api/gatherings/:code/ai-suggest`：AMap 搜索 + 打分 + 模板化 reason，预留 provider 开关 |
| 7) 结算与出发时间计算 | ✅ | 平票 tie-break：count > score > created_at；确认 winner 后写 participants 的 v2 字段 |
| 8) 最小单测 | ✅ | vote settlement tie-break 单测已补 |
| 9) Web 编译对齐 | ✅ | 为适配 shared breaking changes，web 端已改到可编译（功能联调仍需跑通新库） |

### 待办（需要你确认/配合的外部动作）

| Item | 状态 | 说明 |
|------|------|------|
| 新建 Supabase v2 项目/库 | ⏳ | 创建新项目（例如 `ontheway-v2-dev`）并替换 `.env` / Vercel env 指向新项目 |
| 执行 migrations | ⏳ | 在新项目中执行 `supabase/migrations/*`（至少包含 v2 refactor） |
| 微信登录（小程序） | ⏳ | `POST /api/auth/wechat` 仍未实现 |
| 路由级测试（supertest） | ⏳ | 覆盖 nomination limit/duplicate、start-nominating 前置、start-voting nominations<2、重复投票、depart/arrive 状态 |
| reminder engine 部署可靠性 | ⏳ | 目前是常驻 interval（serverless 不可靠），后续迁移到 Cron/Edge |

### v2 对齐点（给前端/小程序）

1. 错误结构：所有失败均为 `{ success:false, error:{ code, message } }`
2. 核心聚合接口：`GET /api/gatherings/:code` 与 `GET /api/gatherings/:code/poll?version=N`
3. 关键命名：`nominations`（不再写 `restaurants`），messages 用 `content/metadata`

### 本地验证命令（开发者自测）

```bash
pnpm -r build
pnpm --filter @ontheway/server test
pnpm --filter @ontheway/web build
```
