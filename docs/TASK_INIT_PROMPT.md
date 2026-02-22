# OnTheWay v2 开发任务 - 会话初始化提示词

---

## 当前目录

```
D:\AICoding\Ontheway
```

## 项目背景

**碰个字 (OnTheWay)** — 聚会全流程项目管理工具，从发起到到达。

### v1 → v2 核心变更

| 维度 | v1 | v2 |
|------|----|----|
| 餐厅来源 | 发起人触发 AI 推荐 3 家 | 每人提名 1-2 家（手动搜索/AI 推荐） |
| 加入门槛 | 昵称+位置+口味 | 昵称+自动定位（口味仅 AI 推荐时填） |
| 投票机制 | 对单个餐厅同意/反对 | 选择制投票（从多个提名中选 1） |
| 聚会状态 | waiting→recommending→recommended→voting→confirmed→completed | waiting→nominating→voting→confirmed→departing→completed |

## 开发顺序

1. 项目骨架 + 数据库 Schema + API 契约文档
2. 认证（匿名登录）
3. 创建聚会 + 加入聚会
4. 提名餐厅（手动指定）
5. 提名餐厅（AI 推荐）
6. 投票确认
7. 出发时间管理 + 到达
8. 小程序端
9. 验证

## 关键文档

| 文档 | 用途 |
|------|------|
| [docs/PRD-v2.md](docs/PRD-v2.md) | **产品需求文档** — 每步的 UI/后端/前端/测试需求 |
| [docs/architecture-v2.md](docs/architecture-v2.md) | **技术架构文档** — API 接口、数据库 Schema、目录结构 |
| [docs/ui-requirements.md](docs/ui-requirements.md) | **UI 需求清单** — 页面、组件、图标、设计规范 |
| [design/design-tokens.json](design/design-tokens.json) | 设计 Token（色彩/字体/圆角/间距） |

## 当前待办

根据你的开发任务，从上方选择对应的文档阅读：

- **Step 3.1 ~ 3.3**（创建/加入聚会）→ 主要看 PRD-v2.md 第 3.1-3.3 节
- **Step 3.4**（提名餐厅）→ 主要看 PRD-v2.md 第 3.4 节 + architecture-v2.md 第 3 节 API
- **Step 3.5**（投票确认）→ 主要看 PRD-v2.md 第 3.5 节
- **Step 3.6 ~ 3.7**（出发/到达）→ 主要看 PRD-v2.md 第 3.6-3.7 节
- **数据库搭建** → 主要看 architecture-v2.md 第 4 节
- **前端组件** → 主要看 ui-requirements.md

---

> 提示：先阅读 PRD-v2.md 对应步骤的「后端需求」和「前端需求」子节，明确 API 定义后再开始编码。
