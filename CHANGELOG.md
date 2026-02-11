# Changelog

所有重要变更记录。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.1.0] - 2025-02-12

### 🎉 首次发布

完成 MVP 版本，包含核心功能的完整实现。

#### Phase 1: 项目基础设施

**新增**
- pnpm monorepo 项目骨架
- @ontheway/shared 共享包（类型、常量、工具函数）
- 95 个单元测试，覆盖核心业务逻辑
- 完整文档体系（PRD、架构、API 规范、数据模型、设计系统）
- 设计 Token 系统（颜色、字体、间距、圆角）

#### Phase 2: 后端核心服务

**新增**
- Express + TypeScript API 服务
- Supabase 数据库（7 张表、20 条 RLS 策略）
- 游客匿名登录 + 微信登录桥接
- 聚会 CRUD + 轮询机制
- 高德 POI 搜索 + 五维评分推荐算法
- 多数决投票系统
- 智能催促引擎（基于距离和时间）

**技术细节**
- Zod 运行时校验
- 错误处理中间件
- CORS 跨域配置
- 环境变量管理

#### Phase 3: Web 前端

**新增**
- React 18 + Vite 6 + Tailwind CSS 3.4
- 10 个 UI 组件（Button、Input、Card、Modal 等）
- 5 个页面（登录、首页、仪表盘、我的聚会、404）
- Zustand 状态管理 + 3 秒轮询机制
- 响应式布局 + 暗色模式
- 错误边界处理

**用户体验**
- 流畅的页面切换动画
- 加载状态提示
- 友好的错误提示
- 移动端适配

#### Phase 4: 微信小程序

**新增**
- 原生小程序 + TypeScript
- 5 个页面（首页、创建聚会、聚会详情、我的、登录）
- 7 个公共组件（导航栏、底部栏、卡片等）
- API 层与 Web 端对齐
- TabBar 导航 + 自定义导航栏
- 微信授权登录

**小程序特性**
- 分享功能
- 位置选择
- 地图展示
- 扫码加入

#### Phase 5: 部署与打磨

**新增**
- Vercel 部署配置
- GitHub Actions CI 流程
- 环境变量管理
- 错误监控埋点

**文档**
- README.md 完善
- CHANGELOG.md
- 部署文档
- 用户使用手册
- MIT License

**优化**
- 代码质量检查
- 性能优化
- 安全加固
- 用户体验打磨

---

## [Unreleased]

### 计划中
- 微信支付集成
- 餐厅评价系统
- 历史聚会记录
- 数据统计分析
- 推送通知优化
