# Ontheway（OnTheWay）- 项目状态

> 最后更新: 2026-02-14
> 项目路径: `D:/AICoding/Ontheway`

---

## 当前主线

**当前主线**: v2 后端升级（nominating + 选择制投票 + departing）  
**关键文档**:
- `docs/PRD-v2.md`
- `docs/architecture-v2.md`
- `docs/ui-requirements.md`
- `docs/progress.md`（进度唯一记录，前后端/Agent 统一看这里）

**线上现状（v1）**: 仍存在旧版生产环境（v1 API + v1 数据库）。  
**v2 策略**: 使用全新 Supabase 项目/库，不迁移 v1 线上数据；v2 可以 break v1 客户端。

---

## v2 关键破坏性变更（前端需要知道）

1. 错误响应统一为：`{ success:false, error:{ code, message } }`
2. 错误码字符串更新（无 `ERR_` 前缀），以 PRD-v2 为准
3. 状态机更新：
   - Gathering：`waiting | nominating | voting | confirmed | departing | completed`
   - Participant：`joined | departed | arrived`
   - Vote：`active | resolved`
4. 数据模型更新：`nominations` 替代 v1 `restaurants`；投票记录从 `agree` 改为 `nomination_id`

---

## v2 后端落地状态（代码）

**已完成**:
- shared 契约升级：错误结构/错误码/状态枚举/类型（nomination、vote、message、gathering 聚合）
- server 路由升级：创建/加入/详情/我的/位置、提名(手动+AI P0)、选择制投票、depart/arrive、poll(含超时结算)
- Supabase v2 迁移：`supabase/migrations/20260214000001_v2_refactor.sql`
- 最小单测：vote tie-break 规则

**未完成/风险**:
- v2 新 Supabase 项目尚未创建或尚未切换 env（这是 v2 联调的硬前置）
- `POST /api/auth/wechat` 仍未实现（小程序阶段）
- reminder engine 仍为常驻 interval（serverless 部署不可靠，后续需迁移到 Cron/Edge）
- 路由级测试覆盖不足（建议补 supertest）

---

## 如何“让 Agent 看见进度”

1. 任何 Agent 都只能看到“仓库里的事实”（代码、文档、git 变更），看不到你我对话里的隐含进度。
2. 因此进度以 `docs/progress.md` 为准：每次完成一个 Phase/验收点，就在 v2 Upgrade 区块打勾或更新状态。
3. 快速自查（任何 Agent/前端同学都可执行）：
   - `git status -sb` 看当前改动
   - `pnpm -r build` 确认契约与实现仍一致

---

## 快速命令

```bash
cd D:/AICoding/Ontheway
pnpm -r build
pnpm --filter @ontheway/server test
pnpm --filter @ontheway/web build
```
