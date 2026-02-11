# 碰个头 (OnTheWay)

<p align="center">
  <img src="assets/logo.png" alt="碰个头 Logo" width="120" />
</p>

<p align="center">
  <strong>和朋友碰个头，一起吃点好的 🍜</strong>
</p>

<p align="center">
  多人聚会协调平台，解决"去哪吃"的决策难题
</p>

---

## ✨ 功能特性

- 🎉 **创建聚会** — 设定时间、口味偏好，一键生成邀请码
- 🤖 **智能推荐** — 综合所有人位置和口味，AI 推荐最优餐厅
- 🗳️ **投票决策** — 民主投票确认餐厅，避免一言堂
- 🚗 **出发追踪** — 实时显示每个人的位置和状态
- ⏰ **智能催促** — 该出发了自动提醒，迟到了友好催促
- 🌙 **暗色模式** — 温暖舒适的暗色主题
- 📱 **多端支持** — Web + 微信小程序

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 项目管理 | pnpm Monorepo + TypeScript |
| Web 前端 | React 18 + Vite 6 + Tailwind CSS 3 + Zustand 5 |
| 后端 API | Express 4 + Zod |
| 数据库 | Supabase (PostgreSQL + Auth + Realtime) |
| 小程序 | 原生微信 + TypeScript |
| 地图服务 | 高德地图 API |
| 测试 | Vitest |
| 部署 | Vercel + Supabase Cloud |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd ontheway

# 安装依赖
pnpm install
```

### 配置

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填写必要配置：

```bash
# Supabase（必需）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 高德地图（推荐功能需要）
AMAP_KEY=your_amap_web_service_key
AMAP_JS_KEY=your_amap_js_api_key
AMAP_JS_SECRET=your_amap_js_api_secret
```

### 启动

```bash
# 1. 构建共享包（首次必须）
pnpm build:shared

# 2. 启动后端 API（localhost:3000）
pnpm dev:server

# 3. 启动 Web 前端（localhost:5173）
pnpm dev:web
```

---

## 📦 项目结构

```
ontheway/
├── packages/
│   ├── shared/              # @ontheway/shared — 共享代码
│   │   └── src/
│   │       ├── types/       # 类型定义
│   │       ├── constants/   # 常量配置
│   │       └── utils/       # 工具函数
│   │
│   ├── server/              # @ontheway/server — Express API
│   │   └── src/
│   │       ├── routes/      # 路由定义
│   │       ├── services/    # 业务逻辑
│   │       ├── middleware/  # 中间件
│   │       └── lib/         # 外部服务封装
│   │
│   ├── web/                 # @ontheway/web — React SPA
│   │   └── src/
│   │       ├── components/  # UI 组件
│   │       ├── pages/       # 页面
│   │       ├── stores/      # Zustand 状态
│   │       └── hooks/       # 自定义 Hooks
│   │
│   └── miniprogram/         # 微信小程序
│       ├── pages/           # 小程序页面
│       ├── components/      # 小程序组件
│       └── utils/           # 工具函数
│
├── docs/                    # 项目文档
├── supabase/                # 数据库配置
├── design/                  # 设计资源
└── scripts/                 # 构建脚本
```

---

## 🔧 开发命令

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev:server` | 启动后端 API |
| `pnpm dev:web` | 启动 Web 前端 |
| `pnpm build` | 构建所有包 |
| `pnpm build:shared` | 构建共享包 |
| `pnpm test` | 运行所有测试 |
| `pnpm test:shared` | 测试共享包 |
| `pnpm lint` | 代码检查 |
| `pnpm clean` | 清理构建产物 |

---

## 🚢 部署

详细部署说明请查看 [docs/deploy.md](docs/deploy.md)

**快速部署：**

1. 在 [Supabase](https://supabase.com) 创建项目并运行迁移
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 自动部署完成

---

## 📚 文档

- [产品需求文档](docs/PRD.md)
- [技术架构](docs/architecture.md)
- [API 接口规范](docs/api-spec.md)
- [数据模型](docs/data-model.md)
- [设计系统](docs/design-system.md)
- [用户使用手册](docs/user-guide.md)
- [部署指南](docs/deploy.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

开发前请阅读：
- [CLAUDE.md](CLAUDE.md) — 协作规范
- [docs/plans/overview.md](docs/plans/overview.md) — 开发计划

---

## 📄 License

MIT License © 2025 OnTheWay Team
