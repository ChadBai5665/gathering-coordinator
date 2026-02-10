# Claude 协作规范 — 碰个头 (OnTheWay)

---

## 项目概述

**碰个头** 是一个多人聚会协调平台，解决朋友聚餐"去哪吃"的决策难题。

- **Web 端**：React SPA，面向所有用户
- **微信小程序**：原生开发，面向微信生态用户
- **统一后端**：Express API，部署于 Vercel Serverless

核心流程：创建聚会 → 分享邀请 → 加入填信息 → AI 推荐餐厅 → 投票确认 → 出发追踪 → 智能催促

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 项目管理 | Monorepo (pnpm workspace) |
| 语言 | TypeScript 全栈 |
| Web 前端 | React 18 + Vite 6 + Tailwind CSS 3 + Zustand 5 |
| 后端 API | Express 4 + Zod 验证 |
| 数据层 | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| 小程序 | 原生微信 + TypeScript |
| 测试 | Vitest |
| 部署 | Vercel (Web + API) + Supabase Cloud |

---

## 项目结构

```
ontheway/
├── packages/
│   ├── shared/          # 共享类型、常量、工具函数
│   ├── server/          # Express API 服务
│   ├── web/             # React Web 应用
│   └── miniprogram/     # 微信小程序
├── docs/                # 项目文档
│   ├── PRD.md           # 产品需求文档
│   ├── architecture.md  # 技术架构
│   ├── api-spec.md      # API 接口规范
│   ├── data-model.md    # 数据模型
│   ├── design-system.md # 设计系统
│   └── plans/           # 开发计划
├── supabase/            # Supabase 配置与迁移
├── design/              # 设计 Token
├── scripts/             # 构建/部署脚本
└── assets/              # 静态资源
```

---

## 开发规范

### 语言与风格
- **中文为主**，代码注释和文档均使用中文，专有名词中英对照
- 变量/函数命名使用英文 camelCase，类型使用 PascalCase
- 文件命名使用 kebab-case

### TDD 驱动
- 先写测试，再写实现
- 每个 Task 必须包含验证标准
- 共享逻辑（shared 包）100% 测试覆盖

### 共享优先
- 类型定义、常量、工具函数 → `@ontheway/shared`
- Web 和小程序共用同一套类型和业务逻辑
- API 请求/响应类型在 shared 中定义，前后端共享

### Phase 独立可测试
- 每个 Phase 完成后可独立运行和验证
- 不依赖后续 Phase 的功能
- 每个 Phase 有明确的验收标准

### 代码质量
- 严格 TypeScript（strict: true）
- 禁止 `any`，必须显式类型
- 使用 Zod 做运行时校验（API 层）

---

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev:server          # 启动后端 (localhost:3000)
pnpm dev:web             # 启动 Web 前端 (localhost:5173)

# 构建
pnpm build               # 构建所有包
pnpm build:shared        # 仅构建 shared
pnpm build:server        # 仅构建 server
pnpm build:web           # 仅构建 web

# 测试
pnpm test                # 运行所有测试
pnpm test:shared         # 仅测试 shared
pnpm test:server         # 仅测试 server

# 清理
pnpm clean               # 清理所有构建产物
```

---

## 环境变量

复制 `.env.example` 到 `.env` 并填写：

```bash
SUPABASE_URL=            # Supabase 项目 URL
SUPABASE_ANON_KEY=       # Supabase 匿名密钥
SUPABASE_SERVICE_ROLE_KEY= # Supabase 服务端密钥
AMAP_KEY=                # 高德地图 Web 服务 Key
AMAP_JS_KEY=             # 高德地图 JS API Key
AMAP_JS_SECRET=          # 高德地图 JS API Secret
```

---

## 关键文档

| 文档 | 路径 |
|------|------|
| 项目总览 | [README.md](README.md) |
| 产品需求 | [docs/PRD.md](docs/PRD.md) |
| 技术架构 | [docs/architecture.md](docs/architecture.md) |
| API 规范 | [docs/api-spec.md](docs/api-spec.md) |
| 数据模型 | [docs/data-model.md](docs/data-model.md) |
| 设计系统 | [docs/design-system.md](docs/design-system.md) |
| 开发计划 | [docs/plans/overview.md](docs/plans/overview.md) |
| 设计 Token | [design/design-tokens.json](design/design-tokens.json) |

---

## 协作原则

- **问题分析**：先找根本原因，不接受临时绕过
- **工作方式**：不确定时询问；修改前先阅读现有代码；说明改了什么
- **验证要求**：完成前必须验证，能跑测试的就跑测试
- **共享优先**：新增类型/工具先考虑放 shared 包
- **渐进式开发**：按 Phase 推进，每个 Phase 独立可验证
