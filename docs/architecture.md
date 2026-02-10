# 技术架构 — 碰个头 (OnTheWay)

> 版本：v0.1.0 | 最后更新：2025-02

---

## 1. 架构总览

```
┌─────────────────────────────────────────────────┐
│                    客户端层                       │
│                                                   │
│  ┌──────────────┐       ┌──────────────────┐     │
│  │   Web SPA    │       │   微信小程序       │     │
│  │  React 18    │       │   原生 + TS        │     │
│  │  Vite 6      │       │                    │     │
│  │  Tailwind    │       │                    │     │
│  │  Zustand     │       │                    │     │
│  └──────┬───────┘       └────────┬───────────┘   │
│         │                        │                │
│         │  Supabase Realtime     │  HTTP 轮询     │
│         │  (WebSocket)           │  (GET /poll)   │
└─────────┼────────────────────────┼────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────┐
│                    API 层                         │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │         Express 4 (Vercel Serverless)     │    │
│  │                                            │    │
│  │  ├─ /api/auth/*      认证路由              │    │
│  │  ├─ /api/gatherings/* 聚会路由             │    │
│  │  ├─ middleware/       认证 + 错误处理      │    │
│  │  └─ services/         业务逻辑             │    │
│  └──────────────────┬───────────────────────┘    │
│                     │                             │
└─────────────────────┼─────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                   数据层                          │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │            Supabase Cloud                  │    │
│  │                                            │    │
│  │  ├─ PostgreSQL    关系数据库               │    │
│  │  ├─ Auth          用户认证                 │    │
│  │  ├─ Realtime      实时订阅                 │    │
│  │  ├─ Storage       文件存储（预留）         │    │
│  │  └─ RLS           行级安全策略             │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 2. 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| **项目管理** | pnpm Monorepo | 共享代码、统一版本、开发效率高 |
| **语言** | TypeScript | 全栈类型安全，前后端共享类型定义 |
| **Web 框架** | React 18 | 生态成熟，组件化开发 |
| **构建工具** | Vite 6 | 极速 HMR，开发体验好 |
| **CSS** | Tailwind CSS 3 | 原子化 CSS，快速开发，设计 Token 友好 |
| **状态管理** | Zustand 5 | 轻量、简洁、TypeScript 友好 |
| **路由** | React Router 7 | 声明式路由，支持嵌套 |
| **后端框架** | Express 4 | 轻量灵活，Vercel Serverless 兼容 |
| **参数校验** | Zod | 运行时类型校验，与 TS 类型联动 |
| **数据库** | Supabase (PostgreSQL) | 免运维、内置 Auth/Realtime/RLS |
| **地图服务** | 高德地图 API | 国内数据准确，POI 搜索能力强 |
| **测试** | Vitest | 与 Vite 生态一致，速度快 |
| **部署** | Vercel | 零配置部署，Serverless 自动扩缩 |
| **小程序** | 原生微信 + TS | 性能最优，无框架依赖 |

---

## 3. Monorepo 结构

```
ontheway/
├── packages/
│   ├── shared/          # @ontheway/shared
│   │   ├── src/
│   │   │   ├── types/       # 共享类型定义
│   │   │   ├── constants/   # 共享常量
│   │   │   └── utils/       # 共享工具函数
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── server/          # @ontheway/server
│   │   ├── src/
│   │   │   ├── routes/      # Express 路由
│   │   │   ├── services/    # 业务逻辑层
│   │   │   ├── middleware/  # 中间件
│   │   │   └── lib/         # 外部服务封装
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── web/             # @ontheway/web
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── pages/       # 页面组件
│   │   │   ├── stores/      # Zustand Store
│   │   │   ├── hooks/       # 自定义 Hooks
│   │   │   └── lib/         # 工具库
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── miniprogram/     # 微信小程序
│       ├── pages/
│       ├── components/
│       ├── utils/
│       └── project.config.json
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

### 包依赖关系

```
@ontheway/web ──────→ @ontheway/shared
@ontheway/server ───→ @ontheway/shared
miniprogram ────────→ (复制 shared 类型定义)
```

- `shared` 是基础包，被 `web` 和 `server` 通过 `workspace:*` 引用
- 小程序因微信构建限制，通过脚本复制 shared 的类型定义

---

## 4. 认证架构

### Web 端认证

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
- **未来扩展**：支持 OAuth（微信扫码、Google 等），匿名用户可升级为正式用户

### 小程序认证

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

### Token 管理

| 项目 | 说明 |
|------|------|
| Token 类型 | Supabase JWT |
| 存储位置 | Web: 内存 + localStorage / 小程序: wx.setStorageSync |
| 过期时间 | 1 小时（Supabase 默认），自动刷新 |
| 刷新机制 | Supabase SDK 自动处理 |

---

## 5. 实时通信

### Web 端 — Supabase Realtime

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
  .subscribe()
```

- 基于 WebSocket，低延迟
- 订阅 PostgreSQL 的 INSERT/UPDATE/DELETE 事件
- 按聚会 code 过滤，只接收相关数据

### 小程序端 — HTTP 轮询

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
- 后端维护聚会的 version 号，每次数据变更 +1

### 为什么不统一用 WebSocket？

| 方案 | Web | 小程序 |
|------|-----|--------|
| Supabase Realtime | ✅ 原生支持 | ❌ SDK 不支持小程序环境 |
| 自建 WebSocket | ⚠️ 需额外维护 | ⚠️ 小程序有连接数限制 |
| HTTP 轮询 | ⚠️ 延迟较高 | ✅ 简单可靠 |

**结论**：Web 用 Realtime 获得最佳体验，小程序用轮询保证兼容性。

---

## 6. 部署架构

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
│           Supabase Cloud                 ���
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │PostgreSQL│  │   Auth   │  │Realtime│ │
│  │  数据库  │  │  认证服务│  │实时订阅│ │
│  └──────────┘  └──────────┘  └───────┘ │
│                                          │
└─────────────────────────────────────────┘
```

### Vercel 部署配置

- **Web SPA**：`packages/web/dist` → 静态文件托管，CDN 全球分发
- **API**：`packages/server` → Serverless Functions，按需执行
- **环境变量**：在 Vercel Dashboard 配置，不提交到代码仓库

### Supabase Cloud

- **数据库**：PostgreSQL，自动备份
- **认证**：内置 Auth 服务，支持匿名登录 + OAuth
- **实时**：Realtime 服务，WebSocket 推送数据变更
- **RLS**：行级安全策略，数据库层面的访问控制

### 环境管理

| 环境 | Web URL | API URL | 数据库 |
|------|---------|---------|--------|
| 开发 | localhost:5173 | localhost:3000 | Supabase 本地/开发项目 |
| 预览 | Vercel Preview URL | 同上 | Supabase 开发项目 |
| 生产 | 自定义域名 | 同上 | Supabase 生产项目 |

---

## 7. 错误处理

### API 统一错误格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;      // 机器可读错误码
    message: string;   // 人类可读错误信息
  };
}
```

### 错误码规范

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `AUTH_REQUIRED` | 401 | 未登录 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `GATHERING_FULL` | 400 | 聚会人数已满 |
| `INVALID_STATE` | 400 | 聚会状态不允许此操作 |
| `ALREADY_JOINED` | 400 | 已加入该聚会 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 8. 安全策略

| 层级 | 措施 |
|------|------|
| **传输** | HTTPS 全站加密 |
| **认证** | Supabase JWT，每个请求验证 |
| **授权** | RLS 行级安全，用户只能访问自己参与的聚会 |
| **输入** | Zod 运行时校验所有 API 参数 |
| **密钥** | 环境变量管理，不提交到代码仓库 |
| **CORS** | 仅允许指定域名访问 API |
