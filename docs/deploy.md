# 部署指南

本文档介绍如何将 OnTheWay 部署到生产环境。

---

## 📋 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase 账号
- Vercel 账号（推荐）或其他支持 Node.js 的托管平台
- 高德地图开发者账号

---

## 🗄️ Supabase 配置

### 1. 创建项目

1. 访问 [Supabase](https://supabase.com)，登录并创建新项目
2. 选择区域（推荐选择离用户最近的区域）
3. 设置数据库密码（请妥善保存）

### 2. 运行数据库迁移

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 关联项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

或手动执行 SQL：

1. 进入 Supabase Dashboard → SQL Editor
2. 依次执行 `supabase/migrations/` 目录下的 SQL 文件
3. 确认所有表和 RLS 策略创建成功

### 3. 获取密钥

在 Supabase Dashboard → Settings → API：

- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key（仅后端使用）

---

## 🗺️ 高德地图配置

### 1. 申请开发者账号

访问 [高德开放平台](https://lbs.amap.com/)，注册并实名认证。

### 2. 创建应用

1. 进入控制台 → 应用管理 → 我的应用
2. 创建新应用
3. 添加 Key：
   - **Web 服务 Key**：用于后端 API 调用
   - **Web 端（JS API）Key**：用于前端地图展示
   - **微信小程序 Key**：用于小程序地图

### 3. 配置白名单

- Web 服务 Key：添加服务器 IP 或域名
- JS API Key：添加前端域名
- 小程序 Key：添加小程序 AppID

---

## 🚀 Vercel 部署

### 1. 导入项目

1. 访问 [Vercel](https://vercel.com)，登录并点击 "New Project"
2. 导入 GitHub 仓库
3. Vercel 会自动检测 monorepo 结构

### 2. 配置构建设置

**Web 前端：**
- Framework Preset: Vite
- Root Directory: `packages/web`
- Build Command: `pnpm build`
- Output Directory: `dist`

**API 后端：**
- Root Directory: `packages/server`
- Build Command: `pnpm build`
- Output Directory: `dist`

### 3. 配置环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 高德地图
AMAP_KEY=your_amap_web_service_key
AMAP_JS_KEY=your_amap_js_api_key
AMAP_JS_SECRET=your_amap_js_api_secret

# 应用配置
NODE_ENV=production
```

### 4. 部署

点击 "Deploy"，Vercel 会自动构建并部署。

---

## 🌐 自定义域名

### 1. 添加域名

在 Vercel Dashboard → Settings → Domains：

1. 添加自定义域名（如 `ontheway.example.com`）
2. 按提示配置 DNS 记录

### 2. HTTPS 证书

Vercel 会自动配置 Let's Encrypt SSL 证书。

---

## 📱 微信小程序部署

### 1. 注册小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号
3. 获取 AppID 和 AppSecret

### 2. 配置服务器域名

在小程序后台 → 开发 → 开发设置 → 服务器域名：

- request 合法域名：添加 API 域名
- uploadFile 合法域名：添加 Supabase Storage 域名
- downloadFile 合法域名：添加 Supabase Storage 域名

### 3. 构建上传

```bash
# 进入小程序目录
cd packages/miniprogram

# 使用微信开发者工具打开项目
# 点击"上传"，填写版本号和备注
```

### 4. 提交审核

在小程序后台 → 版本管理 → 开发版本 → 提交审核。

---

## 📊 监控与日志

### Vercel 监控

- 访问 Vercel Dashboard → Analytics 查看访问统计
- 访问 Vercel Dashboard → Logs 查看运行日志

### Supabase 监控

- 访问 Supabase Dashboard → Database → Logs 查看数据库日志
- 访问 Supabase Dashboard → Auth → Logs 查看认证日志

### 建议集成

- **错误监控**：Sentry
- **性能监控**：Vercel Analytics
- **用户行为**：Google Analytics 或 Umami

---

## 🔒 安全建议

1. **环境变量**：不要将敏感信息提交到代码仓库
2. **RLS 策略**：确保 Supabase RLS 策略正确配置
3. **CORS**：限制 API 的跨域访问来源
4. **Rate Limiting**：考虑添加 API 请求频率限制
5. **HTTPS**：确保所有请求使用 HTTPS

---

## 🐛 常见问题

### Q: 部署后 API 请求失败？

检查环境变量是否正确配置，特别是 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`。

### Q: 高德地图不显示？

检查 JS API Key 是否配置，域名是否在白名单中。

### Q: 小程序无法登录？

检查服务器域名是否配置，AppID 和 AppSecret 是否正确。

### Q: 数据库连接失败？

检查 Supabase 项目是否正常运行，RLS 策略是否正确。

---

## 📞 技术支持

遇到问题？

- 查看 [GitHub Issues](https://github.com/your-repo/issues)
- 阅读 [Supabase 文档](https://supabase.com/docs)
- 阅读 [Vercel 文档](https://vercel.com/docs)
