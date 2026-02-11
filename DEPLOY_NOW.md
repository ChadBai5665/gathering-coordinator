# 碰个头 - 快速部署指南

## 方式一：通过 Vercel 网页部署（推荐）

### 1. 推送代码到 GitHub
```bash
cd D:\AICoding\Ontheway
git remote add origin https://github.com/你的用户名/ontheway.git
git push -u origin master
```

### 2. 导入到 Vercel
1. 访问 https://vercel.com
2. 点击 "Add New" → "Project"
3. 导入你的 GitHub 仓库
4. 配置如下：
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `pnpm build:shared && pnpm build:web`
   - Output Directory: `packages/web/dist`

### 3. 配置环境变量
在 Vercel 项目设置中添加：

```
SUPABASE_URL=https://eqxolkxkkslwstwgohbj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeG9sa3hra3Nsd3N0d2dvaGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzU0NzcsImV4cCI6MjA1MjExMTQ3N30.Uw-Aq-Yx-Yx0Uw-Aq-Yx-Yx0Uw-Aq-Yx-Yx0Uw-Aq-Yx-Yx0
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
AMAP_KEY=dfe03053144291b3c3e146904cc63112
AMAP_JS_KEY=7b7f1120fd185e3b63da14095c310c4f
AMAP_JS_SECRET=e478ce9730b1467920b126f2b25a4f6d

VITE_API_BASE_URL=/api
VITE_AMAP_JS_KEY=7b7f1120fd185e3b63da14095c310c4f
VITE_AMAP_JS_SECRET=e478ce9730b1467920b126f2b25a4f6d
```

### 4. 部署
点击 "Deploy" 按钮，等待构建完成。

---

## 方式二：通过 Vercel CLI 部署

### 1. 安装 Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录
```bash
vercel login
```

### 3. 部署
```bash
cd D:\AICoding\Ontheway
vercel
```

按提示操作，选择项目设置。

### 4. 添加环境变量
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add AMAP_KEY
vercel env add AMAP_JS_KEY
vercel env add AMAP_JS_SECRET
vercel env add VITE_API_BASE_URL
vercel env add VITE_AMAP_JS_KEY
vercel env add VITE_AMAP_JS_SECRET
```

### 5. 重新部署
```bash
vercel --prod
```

---

## 部署后配置

### 1. 高德地图域名白名单
1. 访问 https://console.amap.com
2. 进入应用管理 → 你的应用
3. 在 "JS API 安全密钥" 中添加你的 Vercel 域名
   - 例如：`your-project.vercel.app`

### 2. Supabase 域名配置
1. 访问 https://supabase.com/dashboard
2. 进入项目设置 → Authentication → URL Configuration
3. 添加你的 Vercel 域名到 Site URL 和 Redirect URLs

---

## 验证部署

访问你的 Vercel 域名，测试：
1. ✅ 登录功能
2. ✅ 创建聚会
3. ✅ 位置授权
4. ✅ 获取推荐
5. ✅ 投票功能

---

## 常见问题

**Q: 构建失败？**
A: 检查 pnpm 版本，确保 >= 8.0

**Q: API 请求失败？**
A: 检查环境变量是否正确配置

**Q: 地图不显示？**
A: 检查高德地图域名白名单是否添加

**Q: 推荐功能不工作？**
A: 确保至少一个参与者授权了位置权限
