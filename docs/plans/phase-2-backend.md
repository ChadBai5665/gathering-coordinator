# Phase 2: 后端核心服务

## 目标

构建完整的后端 API 服务，包括数据库 Schema、认证系统、聚会管理、地点推荐与投票、实时轮询等核心功能。

## 前置条件

- ✅ Phase 1 完成：项目基础设施搭建完毕
- ✅ Supabase 本地环境已配置
- ✅ shared 包的类型定义已完成

## 任务列表

### 2.1 数据库 Schema 设计与实现 (1天)

**目标**: 创建完整的数据库表结构和关系

**任务**:
- 设计并创建核心表结构:
  - `users` - 用户表 (id, phone, nickname, avatar, created_at)
  - `gatherings` - 聚会表 (id, creator_id, title, description, status, deadline, created_at)
  - `gathering_participants` - 参与者表 (gathering_id, user_id, role, joined_at)
  - `locations` - 地点表 (id, gathering_id, name, address, lat, lng, category, created_by)
  - `location_votes` - 投票表 (id, location_id, user_id, vote_type, created_at)
  - `notifications` - 通知表 (id, user_id, type, content, read, created_at)
  - `user_preferences` - 用户偏好表 (user_id, location_categories, max_distance)
- 创建索引优化查询性能
- 设置 RLS (Row Level Security) 策略
- 编写数据库迁移文件
- 创建必要的数据库函数和触发器

**验证标准**:
- [ ] 所有表创建成功，字段类型正确
- [ ] 外键关系正确建立
- [ ] RLS 策略测试通过
- [ ] 索引创建完成，查询性能符合预期
- [ ] 迁移文件可重复执行

---

### 2.2 Express 服务骨架搭建 (0.5天)

**目标**: 搭建 Express 服务器基础架构

**任务**:
- 初始化 Express 应用
- 配置中间件 (cors, body-parser, helmet, morgan)
- 设置路由结构 (RESTful API 规范)
- 配置环境变量管理
- 集成 Supabase 客户端
- 实现统一错误处理
- 实现统一响应格式
- 配置日志系统

**验证标准**:
- [ ] 服务器成功启动在指定端口
- [ ] 健康检查接口 `/health` 正常响应
- [ ] 错误处理中间件正确捕获异常
- [ ] 日志正确输出到控制台和文件
- [ ] CORS 配置允许前端访问

---

### 2.3 认证服务实现 (1天)

**目标**: 实现手机号登录和 JWT 认证

**任务**:
- 实现手机号验证码发送 (集成短信服务或模拟)
- 实现验证码登录接口
- 实现 JWT token 生成和验证
- 实现认证中间件
- 实现用户信息更新接口
- 实现微信小程序登录集成
- 编写认证相关单元测试

**API 接口**:
- `POST /api/auth/send-code` - 发送验证码
- `POST /api/auth/login` - 验证码登录
- `POST /api/auth/refresh` - 刷新 token
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户信息

**验证标准**:
- [ ] 验证码发送成功（开发环境可打印到控制台）
- [ ] 登录接口返回有效 JWT token
- [ ] 认证中间件正确验证 token
- [ ] 无效 token 返回 401 错误
- [ ] 用户信息更新成功
- [ ] 单元测试覆盖率 > 80%

---

### 2.4 聚会 CRUD 接口 (1天)

**目标**: 实现聚会的创建、查询、更新、删除功能

**任务**:
- 实现创建聚会接口
- 实现获取聚会列表接口（支持分页和筛选）
- 实现获取聚会详情接口
- 实现更新聚会信息接口
- 实现删除聚会接口
- 实现邀请参与者接口
- 实现参与者管理接口
- 实现聚会状态流转逻辑
- 编写 CRUD 相关单元测试

**API 接口**:
- `POST /api/gatherings` - 创建聚会
- `GET /api/gatherings` - 获取聚会列表
- `GET /api/gatherings/:id` - 获取聚会详情
- `PUT /api/gatherings/:id` - 更新聚会
- `DELETE /api/gatherings/:id` - 删除聚会
- `POST /api/gatherings/:id/invite` - 邀请参与者
- `GET /api/gatherings/:id/participants` - 获取参与者列表
- `DELETE /api/gatherings/:id/participants/:userId` - 移除参与者

**验证标准**:
- [ ] 创建聚会成功，返回完整聚会信息
- [ ] 列表接口支持分页、筛选、排序
- [ ] 详情接口返回完整信息（包含参与者）
- [ ] 更新接口正确修改数据
- [ ] 删除接口软删除或硬删除
- [ ] 权限控制：只有创建者可以修改/删除
- [ ] 单元测试覆盖率 > 80%

---

### 2.5 地点推荐与投票系统 (1天)

**目标**: 实现地点推荐算法和投票功能

**任务**:
- 实现地点推荐算法（基于参与者位置的中心点计算）
- 集成高德地图 API 搜索附近地点
- 实现添加自定义地点接口
- 实现地点投票接口（支持多选）
- 实现投票统计接口
- 实现地点详情查询接口
- 实现地点列表接口
- 编写推荐算法单元测试

**API 接口**:
- `POST /api/gatherings/:id/locations/recommend` - 获取推荐地点
- `POST /api/gatherings/:id/locations` - 添加自定义地点
- `GET /api/gatherings/:id/locations` - 获取地点列表
- `POST /api/locations/:id/vote` - 投票
- `DELETE /api/locations/:id/vote` - 取消投票
- `GET /api/locations/:id/votes` - 获取投票统计

**验证标准**:
- [ ] 推荐算法正确计算中心点
- [ ] 高德 API 集成成功，返回附近地点
- [ ] 投票接口支持多选和单选模式
- [ ] 投票统计实时更新
- [ ] 地点列表按投票数排序
- [ ] 单元测试覆盖推荐算法核心逻辑

---

### 2.6 实时轮询与催促功能 (0.5天)

**目标**: 实现实时状态轮询和催促通知

**任务**:
- 实现聚会状态轮询接口
- 实现参与者在线状态更新
- 实现催促功能（发送通知）
- 实现通知列表接口
- 实现通知已读标记
- 集成 Supabase Realtime（可选）
- 编写轮询相关测试

**API 接口**:
- `GET /api/gatherings/:id/status` - 获取聚会实时状态
- `POST /api/gatherings/:id/nudge` - 催促未投票参与者
- `GET /api/notifications` - 获取通知列表
- `PUT /api/notifications/:id/read` - 标记已读
- `PUT /api/notifications/read-all` - 全部标记已读

**验证标准**:
- [ ] 状态轮询返回最新数据
- [ ] 催促功能正确发送通知
- [ ] 通知列表正确显示未读数量
- [ ] 已读标记正确更新
- [ ] 性能测试：支持高频轮询

---

## 总验证标准

- [ ] 所有 API 接口文档完整（使用 Swagger/OpenAPI）
- [ ] 所有接口通过 Postman/Thunder Client 测试
- [ ] 单元测试总覆盖率 > 75%
- [ ] 集成测试覆盖核心业务流程
- [ ] 错误处理完善，返回友好错误信息
- [ ] 日志记录完整，便于调试
- [ ] 性能测试：单接口响应时间 < 200ms
- [ ] 数据库查询优化，无 N+1 问题

## 预估时间

**总计**: 4-5 天

- 2.1 数据库 Schema: 1天
- 2.2 Express 骨架: 0.5天
- 2.3 认证服务: 1天
- 2.4 聚会 CRUD: 1天
- 2.5 推荐投票: 1天
- 2.6 轮询催促: 0.5天

## 技术栈

- **运行时**: Node.js 20+
- **框架**: Express.js
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Supabase Client / Prisma (可选)
- **认证**: JWT
- **地图**: 高德地图 API
- **测试**: Vitest
- **文档**: Swagger/OpenAPI

## 注意事项

1. 所有接口必须有权限验证
2. 敏感操作需要二次确认
3. 数据库操作使用事务保证一致性
4. 外部 API 调用需要错误重试机制
5. 开发环境使用 mock 数据，避免频繁调用外部服务
