# 碰个头 - Vercel 部署完整日志

> 记录时间：2025-02-12
> 部署 URL：https://gathering-coordinator-chadbais-projects.vercel.app

---

## 一、部署背景

**目标**：将 Phase 1-3 完成的 Web 应用部署到 Vercel 生产环境

**起始状态**：
- Phase 1-3 已完成（shared 包、后端、Web 前端）
- Phase 4 小程序骨架已搭建
- 本地开发环境正常运行
- Supabase 云实例已配置

---

## 二、部署过程时间线

### 2.1 准备阶段（21:00-21:15）

**操作**：
1. 更换项目 Logo（BUMP 图标）
2. 确认 GitHub 仓库绑定
3. 检查 Vercel 配置文件

**问题**：
- 旧项目 V1 已占用 GitHub 仓库
- 需要用 V2 代码覆盖 V1

**解决**：
```bash
# 强制推送 V2 代码到 main 分支
git push origin master:main --force
```

---

### 2.2 首次部署尝试（21:15-21:30）

**问题 1：按钮颜色不可见**

**现象**：
- 登录页"快速开始"按钮文字看不到
- 多个页面按钮颜色异常

**根本原因**：
- Tailwind 配置缺少 `DEFAULT` 值
- 代码中使用了不存在的 `primary-dark` 颜色

**解决方案**：
```typescript
// tailwind.config.ts
primary: {
  DEFAULT: '#f2930d',  // 添加 DEFAULT
  50: '#fef8ec',
  // ...
}
```

**修改文件**：
- `tailwind.config.ts` - 添加 DEFAULT 值
- `LoginPage.tsx` - `primary-dark` → `primary-700`
- `HomePage.tsx` - `primary-dark` → `primary-700`
- `Dashboard.tsx` - 修复所有按钮颜色

**提交**：`b4d255c` - fix: 修复所有按钮颜色不显示问题

---

### 2.3 Supabase 配置（21:30-21:45）

**操作**：
1. 创建 Supabase 云实例
2. 运行数据库迁移（478 行 SQL）
3. 启用匿名登录（Anonymous sign-ins）

**问题**：
- SQL 迁移文件中文注释导致编码错误
- 匿名登录未保存设置

**解决**：
- 创建无中文注释的干净 SQL 文件
- 用户手动保存匿名登录设置

**验证**：
```bash
curl -X POST http://localhost:3000/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试"}'
# 返回 token，登录成功 ✅
```

---

### 2.4 三个新功能实现（21:45-22:15）

**需求**：
1. 分享链接直接加入（无需手动输入邀请码）
2. 高德地图集成
3. 自动位置授权

**实现**：

**功能 1：分享链接**
- 新增 `/join/:code` 路由
- `JoinPage.tsx` - 自动加入逻辑
- `LoginPage.tsx` - 登录后跳转到待加入聚会

**功能 2：高德地图**
- `amap.ts` - 动态加载 AMap JS API
- `Dashboard.tsx` - 替换地图占位为真实地图
- 配置 AMap 安全密钥

**功能 3：自动位置**
- `useLocation.ts` - 封装 Geolocation API
- `Dashboard.tsx` - 自动请求位置权限

**提交**：`3cfa3c4` - feat: 分享链接直接加入 + 高德地图集成 + 自动位置授权

---

### 2.5 位置上传功能（22:15-22:30）

**问题**：
- 位置授权成功但地图不更新
- "获取推荐"按钮无响应

**根本原因**：
- 位置获取后没有上传到后端
- 后端推荐接口要求至少一个参与者有位置

**解决方案**：

**后端新增接口**：
```typescript
// PATCH /api/gatherings/:code/location
router.patch('/:code/location', async (req, res, next) => {
  const location = locationSchema.parse(req.body);
  await supabaseAdmin
    .from('participants')
    .update({ location })
    .eq('id', myParticipant.id);
});
```

**前端自动上传**：
```typescript
// Dashboard.tsx
const { location: userLocation } = useGeoLocation(true);

useEffect(() => {
  if (userLocation && code) {
    api.updateLocation(code, userLocation);
  }
}, [userLocation, code]);
```

**提交**：`a926dcc` - feat: add location update endpoint and auto-upload user location

---

### 2.6 Vercel 部署配置（22:30-23:30）

**问题 1：API 路由 404**

**原因**：Vercel 配置缺少 serverless functions 支持

**解决**：
```json
// vercel.json
{
  "buildCommand": "pnpm build:shared && pnpm build:server && pnpm build:web",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" }
  ]
}
```

**创建 API 入口**：
```javascript
// api/index.js
import app from '../packages/server/dist/app.js';
export default function handler(req, res) {
  return app(req, res);
}
```

---

**问题 2：ESM 模块错误**

**错误信息**：
```
Error [ERR_REQUIRE_ESM]: require() of ES Module not supported
```

**原因**：Vercel 将 `api/index.js` 当作 CommonJS 执行

**解决**：
```json
// api/package.json
{
  "type": "module"
}
```

---

**问题 3：Directory import 不支持**

**错误信息**：
```
Directory import '/var/task/packages/shared/dist/constants' is not supported
```

**原因**：ESM 要求明确的文件扩展名

**解决**：批量为所有导入添加 `.js` 扩展名
```typescript
// 修改前
export { ... } from './constants';

// 修改后
export { ... } from './constants/index.js';
```

**修改文件**：
- `shared/src/index.ts`
- `shared/src/constants/index.ts`
- `shared/src/types/index.ts`
- `shared/src/utils/index.ts`
- 所有子文件的内部导入

**提交**：`f38f0ef` - fix: add .js extensions to all imports in shared package for ESM compatibility

---

**问题 4：Deployment Protection**

**现象**：访问网站要求 Vercel 登录

**解决**：
- Settings → Deployment Protection → Disabled

---

**问题 5：环境变量配置**

**问题**：`SUPABASE_ANON_KEY` 配置错误导致登录失败

**错误信息**：
```
创建匿名用户失败: Invalid API key
```

**解决**：
1. 从本地 `.env` 获取正确的 key
2. 在 Vercel 环境变量中更新
3. 重新部署

**正确的环境变量**：
```
SUPABASE_URL=https://eqxolkxkkslwstwgohbj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeG9sa3hra3Nsd3N0d2dvaGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Nzg2NTgsImV4cCI6MjA4NjM1NDY1OH0.ANg_avBWPY9wQId_sFyFifjqfLTogqJeJTTe5ILhgpo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxeG9sa3hra3Nsd3N0d2dvaGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc3ODY1OCwiZXhwIjoyMDg2MzU0NjU4fQ.JRSizJj7pnAgkmK5XqGqMjZ_JmcFIiZ01jlNGjNyFMA
AMAP_KEY=dfe03053144291b3c3e146904cc63112
AMAP_JS_KEY=7b7f1120fd185e3b63da14095c310c4f
AMAP_JS_SECRET=e478ce9730b1467920b126f2b25a4f6d
VITE_API_BASE_URL=/api
VITE_AMAP_JS_KEY=7b7f1120fd185e3b63da14095c310c4f
VITE_AMAP_JS_SECRET=e478ce9730b1467920b126f2b25a4f6d
```

---

### 2.7 部署成功验证（23:30-23:45）

**验证步骤**：

1. **健康检查**：
```bash
curl https://gathering-coordinator-chadbais-projects.vercel.app/api/health
# 返回：{"success":true,"data":{"status":"ok",...}}
```

2. **登录测试**：
```bash
curl -X POST https://gathering-coordinator-chadbais-projects.vercel.app/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"nickname":"测试用户"}'
# 返回：access_token + user 信息
```

3. **前端页面**：
- 访问 https://gathering-coordinator-chadbais-projects.vercel.app
- 登录成功 ✅
- 创建聚会 ✅
- 位置授权 ✅

---

## 三、关键问题总结

### 3.1 技术问题

| 问题 | 根本原因 | 解决方案 | 提交 |
|------|---------|---------|------|
| 按钮颜色不可见 | Tailwind 缺少 DEFAULT 值 | 添加 DEFAULT + 替换 primary-dark | `b4d255c` |
| 位置不上传 | 缺少位置更新接口 | 新增 PATCH /location 接口 | `a926dcc` |
| API 404 | Vercel 配置缺少 functions | 创建 api/index.js 入口 | `69719cc` |
| ESM 模块错误 | 缺少 type: module | 添加 api/package.json | `6c71981` |
| Directory import | ESM 要求明确扩展名 | 批量添加 .js 扩展名 | `f38f0ef` |
| 登录失败 | 环境变量配置错误 | 更新正确的 Supabase keys | - |

### 3.2 配置问题

| 配置项 | 问题 | 解决 |
|--------|------|------|
| Deployment Protection | 需要登录才能访问 | 关闭保护 |
| 域名绑定 | 自定义域名指向旧部署 | Promote to Production |
| 环境变量 | SUPABASE_ANON_KEY 错误 | 从本地 .env 复制正确值 |

---

## 四、部署统计

### 4.1 提交记录

总计 **20+ commits**，主要包括：
- 功能开发：3 个新功能
- Bug 修复：6 个关键问题
- 配置优化：5 个部署配置
- 调试代码：6 个调试端点（已保留）

### 4.2 代码变更

- 新增文件：10+ 个
- 修改文件：30+ 个
- 代码行数：+1000 行

### 4.3 部署时间

- 总耗时：约 3 小时
- 问题排查：2 小时
- 功能开发：1 小时

---

## 五、经验教训

### 5.1 技术经验

1. **ESM 模块化**
   - Vercel Serverless Functions 需要明确的 `type: "module"`
   - 所有导入必须包含 `.js` 扩展名
   - 不能使用 directory imports

2. **环境变量管理**
   - 前端变量需要 `VITE_` 前缀
   - 环境变量更新后必须重新部署
   - 使用调试端点验证环境变量

3. **Tailwind 配置**
   - 自定义颜色必须包含 `DEFAULT` 值
   - 避免使用不存在的颜色变体

4. **API 设计**
   - 位置等状态更新需要独立接口
   - 前端自动化操作要有对应的后端支持

### 5.2 部署流程

1. **本地验证优先**
   - 所有功能在本地完整测试
   - 确保环境变量配置正确

2. **分步部署**
   - 先部署基础功能
   - 逐步添加新功能
   - 每次部署后验证

3. **调试工具**
   - 创建调试端点检查环境
   - 使用 Vercel Function Logs
   - 保留调试代码便于排查

### 5.3 项目管理

1. **文档留档**
   - 记录完整的部署过程
   - 保存问题解决方案
   - 便于后续复盘

2. **版本管理**
   - V1 备份后再覆盖
   - 使用 Git 历史恢复
   - 清理无用文件夹

---

## 六、后续优化建议

### 6.1 功能优化

- [ ] 清理调试端点（api/test.js, api/debug-*.js）
- [ ] 配置高德地图域名白名单
- [ ] 添加错误监控（Sentry）
- [ ] 优化首屏加载速度

### 6.2 体验优化

- [ ] 添加加载骨架屏
- [ ] 优化移动端体验
- [ ] 添加离线提示
- [ ] 完善错误提示

### 6.3 性能优化

- [ ] 启用 Vercel Edge Functions
- [ ] 配置 CDN 缓存
- [ ] 图片懒加载
- [ ] 代码分割优化

---

## 七、最终状态

### 7.1 部署信息

- **生产 URL**：https://gathering-coordinator-chadbais-projects.vercel.app
- **GitHub**：https://github.com/ChadBai5665/gathering-coordinator
- **分支**：main
- **最新提交**：`0af4af7` - debug: add supabase config debug endpoint

### 7.2 功能状态

| 功能 | 状态 | 备注 |
|------|------|------|
| 用户登录 | ✅ | 匿名登录正常 |
| 创建聚会 | ✅ | 完整流程 |
| 加入聚会 | ✅ | 邀请码 + 分享链接 |
| 位置授权 | ✅ | 自动请求 + 上传 |
| 高德地图 | ✅ | 动态加载 |
| 餐厅推荐 | ✅ | 需要位置信息 |
| 投票系统 | ✅ | 多数决 |
| 实时更新 | ✅ | 轮询机制 |

### 7.3 待完成

- ⏳ 小程序开发（需要 AppID）
- ⏳ 微信登录（需要开放平台）
- ⏳ ICP 备案（小程序上线必需）

---

## 八、参考资料

- [Vercel 部署文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)
- [高德地图 JS API](https://lbs.amap.com/api/javascript-api/summary)
- [项目开发计划](./development-plan.md)
- [开发进度记录](./progress.md)
