# Ontheway 聚会协调器 - 项目状态

> 最后更新: 2025-02-12
> 项目路径: `D:/AICoding/Ontheway`

---

## 项目概述

**产品定位**: 微信小程序 + Web 端的聚会协调工具

**技术栈**:
- 前端: React (Web) + 微信小程序
- 后端: Node.js + Express + Supabase
- 部署: Vercel (生产环境)

**生产地址**: https://gathering-coordinator-chadbais-projects.vercel.app
**小程序 AppID**: wx3fcfcb3d937febad

---

## 目录结构

```
D:/AICoding/Ontheway/
├── packages/
│   ├── miniprogram/          # 微信小程序
│   │   └── miniprogram/
│   │       ├── pages/        # 页面
│   │       │   └── login/    # 登录页
│   │       └── services/
│   │           └── api.ts    # API 请求封装
│   ├── web/                  # Web 端
│   │   └── src/
│   │       └── pages/
│   │           ├── LoginPage.tsx
│   │           └── HomePage.tsx
│   ├── server/               # 后端服务
│   │   └── src/
│   │       └── routes/
│   │           └── auth.ts   # 认证接口
│   └── shared/               # 共享代码
├── docs/                     # 文档目录
│   ├── project-status.md     # 本文件
│   └── logo-and-images-inventory.md  # Logo 使用清单
├── assets/
│   └── logo.png              # 项目主 Logo
├── CLAUDE.md                 # Claude 协作规范
└── README.md                 # 项目说明
```

---

## 开发阶段

### ✅ Phase 1-3: 已完成并部署
- Web 端基础功能
- 后端 API
- Vercel 生产部署

### 🚧 Phase 4: 小程序开发中
- 骨架已搭建
- AppID 已配置
- **当前问题**: 登录功能调试中

---

## 当前问题追踪

### 🔴 P0 - 小程序登录失败 (进行中)

**问题描述**:
- 现象: 输入昵称点击"快速进入"后提示 `request:fail`
- 后端验证: curl 测试接口正常
- 编码问题: 后端收到的 nickname 是乱码 `�����û�`（应该是"测试用户"）

**已完成操作**:
1. ✅ 添加调试日志到 `packages/miniprogram/miniprogram/services/api.ts`
   - `request` 函数: 记录请求 URL、method、data、headers
   - `guestLogin` 函数: 记录 nickname 及其 Unicode 编码

**下一步**:
- 等待用户在微信开发者工具中测试
- 收集控制台日志和网络请求详情
- 根据日志分析编码/序列化问题
- 实施针对性修复

**相关文件**:
- `packages/miniprogram/miniprogram/services/api.ts` (已修改)
- `packages/miniprogram/miniprogram/pages/login/index.ts`
- `packages/server/src/routes/auth.ts`

---

### 🟡 P1 - Logo 不统一 (待用户提供资源)

**问题描述**:
- Web 端: 使用渐变背景 + Material Icon
- 小程序: 使用 Emoji 🍽️
- 期望: 使用统一的 `assets/logo.png`

**待办**:
- 等待用户提供不同尺寸的 Logo 资源包
- 替换 Web 端 Logo (LoginPage.tsx, HomePage.tsx)
- 替换小程序 Logo (login/index.wxml)

**相关文件**:
- `packages/web/src/pages/LoginPage.tsx` (line 53-55)
- `packages/web/src/pages/HomePage.tsx` (line 22-24)
- `packages/miniprogram/miniprogram/pages/login/index.wxml` (line 3)
- `docs/logo-and-images-inventory.md` (详细清单)

---

## 快速命令

### 启动开发环境
```bash
cd D:/AICoding/Ontheway
pnpm install
pnpm dev
```

### 查看文档
```bash
# 查看项目状态
cat docs/project-status.md

# 查看 Logo 清单
cat docs/logo-and-images-inventory.md
```

### 测试后端接口
```bash
curl -X POST https://gathering-coordinator-chadbais-projects.vercel.app/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户"}'
```

---

## 协作提示

**给新终端的 Claude**:
1. 项目路径: `D:/AICoding/Ontheway`
2. 先读取: `docs/project-status.md` (本文件)
3. 再读取: `CLAUDE.md` (协作规范)
4. 查看: `docs/logo-and-images-inventory.md` (如涉及 UI)

**关键原则**:
- 问题分析: 先找根本原因，不接受临时绕过
- 修改前先阅读相关文件
- 完成后必须验证
- 中文为主，专有名词中英对照

---

## 更新日志

### 2025-02-12
- 创建项目状态文档
- 添加小程序登录调试日志
- 记录当前 P0/P1 问题
