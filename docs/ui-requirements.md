# UI 需求清单 — 碰个字 (OnTheWay) v2

> 版本：v2.0.0 | 最后更新：2026-02

---

## 1. 页面列表

### 1.1 LoginPage `/login`

**功能描述**：游客登录页面，输入昵称后自动创建匿名账户。

**关键交互**：
- 页面加载 → 检查 localStorage 是否有 token
- 有 token → 跳转 HomePage
- 无 token → 显示昵称输入框
- 输入昵称（1-20 字符）→ 点击"进入"→ 调用登录 API → 跳转 HomePage

**包含组件**：
- Logo（品牌图标 + 文字）
- Input（昵称输入）
- Button（"进入"按钮）
- Toast（错误提示）

**v2 变更**：无，沿用 v1

---

### 1.2 HomePage `/`

**功能描述**：首页，提供两个入口：创建聚会或输入邀请码加入。

**关键交互**：
- 显示欢迎语 + 用户信息
- 两个主要按钮：
  - "发起聚会" → 打开创建弹窗/跳转创建页面
  - "加入聚会" → 打开输入邀请码弹窗
- 创建弹窗：输入聚会名称 + 选择目标时间 → 提交 → 跳转 Dashboard
- 加入弹窗：输入邀请码 → 提交 → 跳转 Dashboard

**包含组件**：
- Header（用户信息 + 头像）
- Card（功能入口卡片）
- Button（主按钮）
- Modal（创建/加入弹窗）
- Input（邀请码、聚会名称）
- DateTimePicker（目标时间选择）

**v2 变更**：
- 创建表单简化：移除口味偏好选择器

---

### 1.3 JoinPage `/join/:code`

**功能描述**：通过邀请码加入聚会。

**关键交互**：
- URL 携带邀请码 → 自动填充
- 输入昵称（1-20 字符）
- 自动获取定位（用户授权）
- 点击"加入"→ 调用加入 API → 跳转 Dashboard
- 邀请码无效 → 显示错误提示

**包含组件**：
- Input（昵称）
- Button（"加入"按钮）
- Toast（错误提示）
- Loading（加入中状态）

**v2 变更**：
- 移除口味偏好选择器（TasteSelector）
- 简化为仅昵称 + 自动定位

---

### 1.4 Dashboard `/dashboard/:code`

**功能描述**：聚会仪表盘，根据状态显示不同内容区。

**关键交互**：
- 根据 `gathering.status` 显示对应内容区：
  - `waiting`: WaitingSection（等待参与者 + 开始提名按钮）
  - `nominating`: NominationSection（提名操作区 + 提名列表）
  - `voting`: VotingSection（投票选择区）
  - `confirmed`: ConfirmedSection（确认餐厅信息 + 出发按钮）
  - `departing`: DepartingSection（出发状态追踪）
  - `completed`: CompletedSection（聚会完成）

**包含组件**：
- Sidebar（邀请码 + 参与者列表）
- WaitingSection（修改：新增"开始提名"按钮）
- NominationSection（🆕 新增）
- VotingSection（🆕 新增，重写）
- ConfirmedSection（微调：餐厅信息来源改为 nominations）
- ActionBar（出发/到达按钮）
- Toast（各种提示）

**v2 变更**：
- 核心变更页面，新增 NominationSection 和 VotingSection

---

### 1.5 MyGatheringsPage `/my-gatherings`

**功能描述**：显示用户参与的所有聚会列表。

**关键交互**：
- 页面加载 → 获取我的聚会列表
- Tab 切换：进行中 / 已完成
- 点击卡片 → 跳转 Dashboard
- 空状态：显示引导创建聚会的提示

**包含组件**：
- Tab（进行中/已完成）
- GatheringCard（聚会卡片）
- EmptyState（空状态）
- Loading（加载中）

**v2 变更**：无，沿用 v1

---

### 1.6 NotFoundPage `*`

**功能描述**：404 页面。

**关键交互**：
- 显示"页面不存在"提示
- "返回首页"按钮

**包含组件**：
- Illustration（插图）
- Text（提示文字）
- Button（返回按钮）

**v2 变更**：无，沿用 v1

---

## 2. 组件清单

### 2.1 新增组件（v2）

#### 2.1.1 提名相关组件

| 组件名 | 说明 | 主要 Props |
|--------|------|------------|
| `NominationSection` | 提名阶段主容器 | `gathering`, `onNominate`, `onStartVoting` |
| `NominationHeader` | 提名进度头部 | `totalParticipants`, `nominatedCount` |
| `NominationMethodTabs` | Tab 切换（手动/AI） | `activeTab`, `onChange` |
| `RestaurantSearchPanel` | 手动搜索面板 | `onSearch`, `onSelect` |
| `SearchResultItem` | 搜索结果单项 | `restaurant`, `onNominate`, `disabled` |
| `AiSuggestPanel` | AI 推荐面板 | `onSuggest`, `onSelect` |
| `AiSuggestCard` | AI 推荐卡片 | `suggestion`, `onNominate`, `disabled` |
| `NominationCard` | 提名卡片 | `nomination`, `participants`, `canWithdraw` |
| `NominationList` | 提名列表 | `nominations`, `participants` |
| `TasteSelector` | 口味选择器 | `selected`, `onChange`, `max` |
| `StartVotingButton` | 开始投票按钮 | `disabled`, `onClick` |

#### 2.1.2 投票相关组件

| 组件名 | 说明 | 主要 Props |
|--------|------|------------|
| `VotingSection` | 投票阶段主容器 | `gathering`, `vote`, `onVote` |
| `VotingHeader` | 投票头部 | `totalParticipants`, `votedCount`, `timeoutAt` |
| `VoteNominationCard` | 投票卡片 | `nomination`, `voteCount`, `isSelected`, `onVote`, `disabled` |
| `VoteResultOverlay` | 投票结果弹层 | `winner`, `onClose` |

---

### 2.2 沿用组件（v1）

| 组件名 | 说明 |
|--------|------|
| `Button` | 按钮，支持 primary/secondary/ghost 变体 |
| `Card` | 卡片容器 |
| `Input` | 输入框，支持 icon/prefix/suffix |
| `Modal` | 弹窗 |
| `Toast` | 轻提示 |
| `Tag` | 标签 |
| `Avatar` | 头像 |
| `Badge` | 徽标 |
| `Loading` | 加载 |
| `Icon` | 图标 |

---

## 3. 图标清单

### 3.1 提名阶段

| 图标名 | 用途 | 建议图标 |
|--------|------|----------|
| `search` | 搜索餐厅 | 🔍 magnifying glass |
| `ai-sparkle` | AI 推荐 | ✨ sparkles |
| `nominate` | 提名餐厅 | 📌 pin / ➕ plus-circle |
| `withdraw` | 撤回提名 | ↩️ arrow-uturn-left |
| `manual-tag` | 手动搜索标签 | 🔍 search |
| `ai-tag` | AI 推荐标签 | 🤖 robot |

### 3.2 投票阶段

| 图标名 | 用途 | 建议图标 |
|--------|------|----------|
| `vote` | 投票 | 🗳️ ballot-box |
| `check-circle` | 已投票/已选中 | ✅ check-circle |
| `clock` | 倒计时 | ⏱️ clock / timer |
| `crown` | 胜出 | 👑 trophy / crown |

### 3.3 出行阶段

| 图标名 | 用途 | 建议图标 |
|--------|------|----------|
| `depart` | 出发 | 🚗 car |
| `arrive` | 到达 | 🏁 flag-checkered |
| `distance` | 距离信息 | 📍 location-pin |

### 3.4 通用

| 图标名 | 用途 | 建议图标 |
|--------|------|----------|
| `rating` | 评分 | ⭐ star |
| `cost` | 人均消费 | 💰 yen-sign / money-bill |
| `celebrate` | 聚会完成 | 🎉 party-popper |
| `user` | 用户/参与者 | 👤 user |
| `users` | 多人 | 👥 users |
| `copy` | 复制 | 📋 clipboard |
| `share` | 分享 | 📤 share |
| `chevron-right` | 展开/更多 | › chevron-right |
| `x` | 关闭 | ✕ x |
| `check` | 确定 | ✓ check |

---

## 4. 设计规范

### 4.1 设计 Token（沿用 design-tokens.json）

#### 4.1.1 色彩

```json
{
  "colors": {
    "primary": { "500": "#f2930d" },
    "secondary": { "500": "#0d94f2" },
    "teal": { "500": "#14b8a6" },
    "red": { "500": "#ef4444" },
    "background": { "light": "#f8f7f5", "dark": "#221b10" },
    "card": { "light": "#ffffff", "dark": "#2d2418" },
    "surface": { "light": "#f0ede8", "dark": "#3a3028" },
    "text": {
      "light": { "primary": "#1a1a1a", "secondary": "#6b7280" },
      "dark": { "primary": "#f5f5f4", "secondary": "#a8a29e" }
    }
  }
}
```

#### 4.1.2 字体

- 主字体：Plus Jakarta Sans
- 字号阶梯：xs(12) / sm(14) / base(16) / lg(18) / xl(20) / 2xl(24) / 3xl(30) / 4xl(36)

#### 4.1.3 圆角

- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- full: 9999px

#### 4.1.4 间距

- 基准：4px
- 档位：1(4) / 2(8) / 3(12) / 4(16) / 5(20) / 6(24) / 8(32) / 10(40)

#### 4.1.5 动效

- fast: 150ms
- normal: 300ms
- slow: 500ms
- 缓动：ease-in-out, bounce

---

### 4.2 提名卡片样式规范

```
┌─────────────────────────────────────────────┐
│ 👤 小明                        [手动] [AI]  │ ← 来源标签
├─────────────────────────────────────────────┤
│ 海底捞火锅（望京店）                          │ ← 餐厅名称
│ 川菜 · ⭐4.5 · 💰120                        │ ← 标签信息
│ 北京市朝阳区望京街9号                         │ ← 地址
├─────────────────────────────────────────────┤
│ 📍 距离：小明 2.3km / 小红 1.8km             │ ← 距离信息（可折叠）
└─────────────────────────────────────────────┘
```

**样式要点**：
- 卡片圆角：md(16px)
- 卡片内边距：4(16px)
- 来源标签：
  - 手动：secondary 蓝色 (#0d94f2)，文字白色
  - AI：primary 橙色 (#f2930d)，文字白色
- 餐厅名称：font-size lg(18px)，font-weight semibold
- 标签信息：使用 Tag 组件，灰色背景
- 距离信息：font-size sm(14px)，secondary 文字色

---

### 4.3 投票卡片样式规范

```
┌─────────────────────────────────────────────┐
│                                             │
│              🏆 胜出餐厅展示区                │ ← 胜出时显示
│                                             │
├─────────────────────────────────────────────┤
│ 🍲 海底捞火锅（望京店）      ⭐4.5 · 💰120   │
│ 川菜 · 📍2.3km                              │
├─────────────────────────────────────────────┤
│ 已获得 3 票                                  │ ← 票数进度条
│ ████████░░░░░░░░░░░░░░ 3/5                 │
├─────────────────────────────────────────────┤
│        [ 投这家 ]  或  ✓ 你已投票             │
└─────────────────────────────────────────────┘
```

**样式要点**：
- 卡片圆角：md(16px)
- 选中态：primary 橙色边框 + 右上角勾选图标
- 未选中态：默认边框
- 按钮状态：
  - 未投票：primary 橙色按钮
  - 已投票给此选项：选中态高亮
  - 已投票给其他选项：按钮 disabled
- 进度条：使用 Progress 组件，secondary 蓝色
- 胜出动画：scale(1.05) + 🎉 粒子效果

---

### 4.4 来源标签颜色

| 来源 | 背景色 | 文字色 |
|------|--------|--------|
| 手动 (manual) | #0d94f2 (secondary) | #ffffff |
| AI 推荐 (ai) | #f2930d (primary) | #ffffff |

---

### 4.5 状态标签颜色

| 状态 | 背景色 | 文字色 |
|------|--------|--------|
| 未出发 | #e5e7eb (gray-200) | #6b7280 (gray-500) |
| 已出发 | #0d94f2 (secondary) | #ffffff |
| 已到达 | #14b8a6 (teal) | #ffffff |

---

### 4.6 投票进度条

- 背景色：#e5e7eb (gray-200)
- 填充色：#0d94f2 (secondary)
- 高度：8px
- 圆角：full(9999px)

---

### 4.7 响应式布局

- **Mobile First**：默认移动端适配
- **断点**：
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

**移动端适配要点**：
- 提名卡片：单列布局
- 投票卡片：单列布局
- 搜索结果：每行 1 个
- Tab 切换：底部固定或可滚动

**桌面端适配**：
- 提名列表：可改为 2 列
- 投票卡片：可改为 2-3 列网格

---

### 4.8 动画规范

| 动画 | 时长 | 缓动 | 用途 |
|------|------|------|------|
| fade-in | 150ms | ease-in | 显示元素 |
| fade-out | 150ms | ease-out | 隐藏元素 |
| slide-up | 300ms | ease-out | 弹层出现 |
| scale-in | 300ms | bounce | 投票胜出 |
| button-press | 100ms | ease-in | 按钮点击 |

---

> 文档版本：v2.0.0
> 最后更新：2026-02
> 状态：待用户确认
